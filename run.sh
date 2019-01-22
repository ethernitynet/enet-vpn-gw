#!/bin/bash

ACENIC_ID=${1:-0}
ENET_NIC_INTERFACE=${2:-ens1}
ENET_NIC_PCI=${2:-0000:3d:00.0}
IMG_DOMAIN=${2:-local}
OVS_VERSION=${3:-v2.10.1}
LIBRESWAN_VERSION=${4:-v3.27}

docker volume rm $(docker volume ls -qf dangling=true)
#docker network rm $(docker network ls | grep "bridge" | awk '/ / { print $1 }')
docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
docker rmi $(docker images | grep "none" | awk '/ / { print $3 }')
docker rm $(docker ps -qa --no-trunc --filter "status=exited")

DOCKER_INST="enet${ACENIC_ID}-vpn"

case ${IMG_DOMAIN} in
	"hub")
	IMG_TAG=ethernitynet/enet-vpn-gw:$LIBRESWAN_VERSION
	docker pull $IMG_TAG
	;;
	*)
	IMG_TAG=local/enet-vpn-gw:$LIBRESWAN_VERSION
	IMG_BASE=local/enet-ovs-dpdk:$OVS_VERSION
	docker build \
		-t $IMG_TAG \
		--build-arg IMG_BASE=$IMG_BASE \
		./
	;;
esac

mkdir -p $(pwd)/shared/$DOCKER_INST

docker kill $DOCKER_INST
docker rm $DOCKER_INST

ENET_VPN_CONFIG=$(cat shared/${DOCKER_INST}/enet_vpn_config.json)
ENET_INSTALL_DIR=$(jq -r .VPN.ace_nic_config[0].install_dir <<< "${ENET_VPN_CONFIG}")
DATAPLANE_TYPE=$(jq -r .VPN.ace_nic_config[0].dataplane <<< "${ENET_VPN_CONFIG}")
ENET_NIC_INTERFACE=$( printf 'ACENIC%u_127' $(( ${ACENIC_ID} + 1 )) )


enet_restart() {

	cd ${ENET_INSTALL_DIR}/Ethernity/lib/pcicard
	if [[ ${ACENIC_ID} == 0 ]]
	then
		pkill pcicard_mea.ex
		sleep 1
		./AppInit_Nic
	elif [[ ${ACENIC_ID} == 1 ]]
	then
		pkill pcicard_mea2.ex
		sleep 1
		./AppInit_Nic2
	fi
	cd -
}

kmod_install() {

	local dpdk_install_dir=/root/ETHERNITY/GITHUB/dpdk-v17.11-rc4/dpdk

	sleep 1
	[[ $(lsmod | grep -c "^openvswitch") == 0 ]] && modprobe openvswitch
	[[ $(lsmod | grep -c "^af_key") == 0 ]] && modprobe af-key
	
	if [[ ${DATAPLANE_TYPE} == 'userspace' ]]
	then
		sleep 1
		[[ $(lsmod | grep -c "^uio") == 0 ]] && modprobe uio
		[[ $(lsmod | grep -c "^igb_uio") == 0 ]] && insmod ${dpdk_install_dir}/x86_64-native-linuxapp-gcc/kmod/igb_uio.ko
		sleep 1
		${dpdk_install_dir}/usertools/dpdk-devbind.py -b igb_uio ${ENET_NIC_INTERFACE}
	fi
}


enet_restart
kmod_install

docker run \
	-t \
	-d \
	--rm \
	--net=host \
	--privileged \
	-v /mnt/huge:/mnt/huge \
	--device=/dev/uio0:/dev/uio0 \
	-v ${ENET_INSTALL_DIR}/shared/$DOCKER_INST:/shared \
	--env ACENIC_ID=$ACENIC_ID \
	--env ENET_NIC_INTERFACE=$ENET_NIC_INTERFACE \
	--env ENET_NIC_PCI=$ENET_NIC_PCI \
	--env DOCKER_INST=$DOCKER_INST \
	--hostname=$DOCKER_INST \
	--name=$DOCKER_INST \
	$IMG_TAG \
	/bin/bash
