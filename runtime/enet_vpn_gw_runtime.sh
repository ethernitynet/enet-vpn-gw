#!/bin/bash

enet_vpn_gw_start() {

	#enet_run
	ovs_run
	ovs_dpdk add-br ${OVS_VPN_BR}
	enet_ovs_add_nic_br ${ENET_NIC_BR}
	enet_ovs_attach_nic_br ${ENET_NIC_BR} ${OVS_VPN_BR} ${ENET_NIC_INTERFACE} ${ENET_NIC_PCI}
}

enet_vpn_run_libreswan() {

	echo 'enet_vpn_run_libreswan'
}
