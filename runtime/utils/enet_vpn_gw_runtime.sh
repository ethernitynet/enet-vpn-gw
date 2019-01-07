#!/bin/bash

enet_vpn_gw_start() {

	#enet_run
	ovs_run
	ovs_dpdk add-br ${OVS_VPN_BR}
	enet_ovs_add_nic_br ${ENET_NIC_BR}
	enet_ovs_attach_nic_br ${ENET_NIC_BR} ${OVS_VPN_BR} ${ENET_NIC_INTERFACE} ${ENET_NIC_PCI}
}

enet_vpn_boot_libreswan() {

	ovs_dpdk add-docker-port br0 lib107 libreswan --ipaddress=15.1.1.108/24 --macaddress=00:62:B1:49:1D:BF
}
