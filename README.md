# enet-vpn-gw

This Docker image deploys and orchestrates a cluster of LibreSwan VPN gateways over an Ethernity ACE-NIC, thereby enabling multi-Gbps VPN connections through the ACE-NIC IPSec full HW acceleration feature.

# Supported versions:
- ACE-NIC v450.08.122A#1 (SW) / v1302.1.11.5 (HW)
- Linux server compatible with ACE-NIC requirements (officially supported on Centos v7.5.1804 / kernel 3.10.0-862.14.4.el7.x86_64)
- dpdk v17.11-rc4: http://doc.dpdk.org/guides/rel_notes/release_17_11.html
- ovs v2.10.1: https://www.openvswitch.org/download/
- LibreSwan v3.27: https://libreswan.org/
- docker v18.09.0: https://docs.docker.com/install/linux/docker-ce/centos/

# Prerequisites:
- Ethernity ACE-NIC installed on compatible Linux server
- ACE-NIC compatible SW
- Docker

# Installation
```
docker push ethernity/enet-vpn-gw
```
# Booting the VPN GW (single NIC)
Boot the ACE-NIC according to the documented procedure. Locate ```ENET_INSTALL_DIR``` and run the following:
```
ACENIC1_ID=0
DOCKER_INST=enet0-vpn
docker run \
        -t \
        -d \
        --rm \
        --net=host \
        --privileged \
        -v /mnt/huge:/mnt/huge \
        --device=/dev/uio0:/dev/uio0 \
        -v $ENET_INSTALL_DIR/shared/$DOCKER_INST:/shared \
        --env ACENIC_ID=$ACENIC1_ID \
        --env ACENIC_LABEL=$ACENIC1_LABEL \
        --env ACENIC_710_SLOT=$ACENIC1_710_SLOT \
        --env DOCKER_INST=$DOCKER_INST \
        --hostname=$DOCKER_INST \
        --name=$DOCKER_INST \
        ethernity/enet-vpn-gw
```
# Configuration (single NIC)
Assuming 172.16.11.152 to be the server IP, go to:
http://172.16.11.152:44443/enet_vpn_config.html
