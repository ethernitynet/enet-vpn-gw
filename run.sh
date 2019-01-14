#!/bin/bash

ACENIC_ID=${1:-0}
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

docker run \
	-ti \
	--net=host \
	--privileged \
	-v /mnt/huge:/mnt/huge \
	--device=/dev/uio0:/dev/uio0 \
	-v $(pwd)/shared/$DOCKER_INST:/shared \
	--env ACENIC_ID=$ACENIC_ID \
	--env DOCKER_INST=$DOCKER_INST \
	--hostname=$DOCKER_INST \
	--name=$DOCKER_INST \
	$IMG_TAG \
	/bin/bash
