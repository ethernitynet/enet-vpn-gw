#!/bin/bash

set +x

ACENIC_ID=${1:-0}
ACENIC_LABEL=${2:-ACENIC1_127}
ACENIC_710_SLOT=${3:-3d:00.0}
IMG_DOMAIN=${4:-local}
OVS_VERSION=${5:-v2.10.1}
LIBRESWAN_VERSION=${6:-v3.27}

docker volume rm $(docker volume ls -qf dangling=true)
#docker network rm $(docker network ls | grep "bridge" | awk '/ / { print $1 }')
docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
docker rmi $(docker images | grep "none" | awk '/ / { print $3 }')
docker rm $(docker ps -qa --no-trunc --filter "status=exited")

DOCKER_INST="enet${ACENIC_ID}-vpn"

case ${IMG_DOMAIN} in
	"hub")
	IMG_TAG=ethernity/enet-vpn-gw:$LIBRESWAN_VERSION
	docker pull $IMG_TAG
	;;
	*)
	IMG_TAG=local/enet-vpn-gw:$LIBRESWAN_VERSION
	IMG_BASE=local/enet-ovs-dpdk:$OVS_VERSION
	IMG_LIBRESWAN_TAG=local/libreswan:$LIBRESWAN_VERSION
	docker build \
		-t $IMG_TAG \
		--build-arg IMG_BASE=$IMG_BASE \
		--build-arg IMG_LIBRESWAN_TAG=$IMG_LIBRESWAN_TAG \
		./
	;;
esac

docker kill $DOCKER_INST
docker rm $DOCKER_INST

VPN_SHARED_DIR=/shared/$DOCKER_INST
HOST_SHARED_DIR=$(pwd)${VPN_SHARED_DIR}
mkdir -p $HOST_SHARED_DIR

ENET_VPN_CONFIG=$(cat $HOST_SHARED_DIR/enet_vpn_config.json)
ACENIC_LABEL=$( printf 'ACENIC%u_127' $(( ${ACENIC_ID} + 1 )) )
ACENIC_710_SLOT=$(jq -r .VPN.ace_nic_config[0].nic_pci <<< "${ENET_VPN_CONFIG}")
ENET_INSTALL_DIR=$(jq -r .VPN.ace_nic_config[0].install_dir <<< "${ENET_VPN_CONFIG}")
DATAPLANE_TYPE=$(jq -r .VPN.ace_nic_config[0].dataplane <<< "${ENET_VPN_CONFIG}")

#####################################################
#####################################################
# Old ver.
#####################################################
#####################################################
if false
then
ENET_INSTALL_DIR=/home/devops/ENET_SmartNic_ver_1.31A

enet_restart_old() {

	cd /home/devops/ENET_SmartNic_ver_1.31A/AceNic_output
	if [[ ${ACENIC_ID} == 0 ]]
	then
		pkill SmartNic
		sleep 1
		./AppInit_AceNic
	elif [[ ${ACENIC_ID} == 1 ]]
	then
		pkill SmartNic
		sleep 1
		./AppInit_AceNic2
	fi
	cd -
}
fi
#####################################################
#####################################################

enet_restart() {

	ACENIC_LABEL="ACENIC$(( ${ACENIC_ID} + 1 ))_127"
	ACENIC_XIL_SLOT="ACENIC$(( ${ACENIC_ID} + 1 ))_XIL_SLOT"
	echo "Rebooting ${ACENIC_LABEL}:"
	cd ${ENET_INSTALL_DIR}/Ethernity/lib/pcicard
	ENV_SETUP="$(./env_setup.sh)"
	echo "${ENV_SETUP}"
	ACENIC_CHECK=$(grep "${ACENIC_XIL_SLOT}" <<< "${ENV_SETUP}")
	if [[ ${ACENIC_CHECK} == "" ]]
	then
		echo "${ACENIC_LABEL} not present. Aborting."
		cd -
		exit
	fi
	
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
	echo "${ACENIC_LABEL} reboot Done."
}

acenic_bind() {

	local driver_name=$1
	
	if false
	then
		${dpdk_install_dir}/usertools/dpdk-devbind.py -b ${driver_name} ${ACENIC_710_SLOT}
	else
		#cd /home/trx/v2.51
		#./dpdk_nic_bind.py -b ${driver_name} ${ACENIC_710_SLOT}
		#cd -
		echo '-'
	fi
}

kmod_install() {

	local dpdk_install_dir=/root/ETHERNITY/GITHUB/dpdk-v17.11-rc4/dpdk

	acenic_bind i40e
	sleep 1
	[[ $(lsmod | grep -c "^openvswitch") == 0 ]] && modprobe openvswitch
	[[ $(lsmod | grep -c "^af_key") == 0 ]] && modprobe af-key
	
	if [[ ${DATAPLANE_TYPE} == 'userspace' ]]
	then
		sleep 1
		[[ $(lsmod | grep -c "^uio") == 0 ]] && modprobe uio
		[[ $(lsmod | grep -c "^igb_uio") == 0 ]] && insmod ${dpdk_install_dir}/x86_64-native-linuxapp-gcc/kmod/igb_uio.ko
		sleep 1
		acenic_bind igb_uio
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
	-v $HOST_SHARED_DIR:$VPN_SHARED_DIR \
	--env ACENIC_ID=$ACENIC_ID \
	--env ACENIC_LABEL=$ACENIC_LABEL \
	--env ACENIC_710_SLOT=$ACENIC_710_SLOT \
	--env DOCKER_INST=$DOCKER_INST \
	--env HOST_SHARED_DIR=$HOST_SHARED_DIR \
	--env VPN_SHARED_DIR=$VPN_SHARED_DIR \
	--hostname=$DOCKER_INST \
	--name=$DOCKER_INST \
	$IMG_TAG \
	/bin/bash

set +x
