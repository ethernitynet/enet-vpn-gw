#!/bin/bash

enet_vpn_update_env() {

	local enet_vpn_config=$(<$VPN_SHARED_DIR/enet_vpn_config.json)
	
	export ACENIC_ID=$(jq -r .VPN.ace_nic_config[0].nic_name <<< "${enet_vpn_config}")
	export ENET_OVS_DATAPLANE=$(jq -r .VPN.ace_nic_config[0].dataplane <<< "${enet_vpn_config}")
	export ACENIC_710_SLOT=$(jq -r .VPN.ace_nic_config[0].nic_pci <<< "${enet_vpn_config}")
	
	export ACENIC_LABEL=$( printf 'ACENIC%u_127' $(( ${ACENIC_ID} + 1 )) )
	export ENET_NIC_BR="enet${ACENIC_ID}"
	export OVS_VPN_BR="ovsvpn${ACENIC_ID}"
	
	export ENET_IPSEC_LOCAL_IP=$(jq -r .VPN.vpn_gw_config[0].vpn_gw_ip <<< "${enet_vpn_config}")
}

enet_vpn_config_mngr_start() {

	pkill node
	ln -s $VPN_SHARED_DIR/enet_vpn_config.json ${SRC_DIR}/schema/enet_vpn_config.json
	mkdir -p $VPN_SHARED_DIR/enet${ACENIC_ID}_libreswan104/conns
	mkdir -p $VPN_SHARED_DIR/enet${ACENIC_ID}_libreswan105/conns
	mkdir -p $VPN_SHARED_DIR/enet${ACENIC_ID}_libreswan106/conns
	mkdir -p $VPN_SHARED_DIR/enet${ACENIC_ID}_libreswan107/conns
	cd ${SRC_DIR}/config
	npm start &
	cd -
	cd ${SRC_DIR}
	local config_mngr_port=$(( 44443 + ${ACENIC_ID} ))
	http-server -p ${config_mngr_port} &
	cd -
	sleep 1
}

enet_vpn_shutdown_libreswan_inst() {

	local nic_id=$1
	local nic_port=$2
	local libreswan_inst="${ENET_NIC_BR}_libreswan${nic_port}"
	
	################################
	local exec_pattern="\
	docker kill %s; \
	docker rm %s"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${libreswan_inst} \
		${libreswan_inst})
	################################
	sleep 2
	exec_tgt '/' "${exec_cmd}"
}

enet_vpn_reboot_libreswan_inst() {

	local nic_id=$1
	local nic_port=$2
	local libreswan_inst="${ENET_NIC_BR}_libreswan${nic_port}"
	local libreswan_shared_dir="$VPN_SHARED_DIR/${libreswan_inst}"
	local libreswan_host_dir="$HOST_SHARED_DIR/${libreswan_inst}"
	
	################################
	enet_vpn_disconnect_libreswan_inst ${nic_id} ${nic_port}
	enet_vpn_shutdown_libreswan_inst ${nic_id} ${nic_port}
	################################
	local exec_pattern="\
	mkdir -p %s; \
	docker run \
		-t \
		-d \
		--rm \
		--ipc=host \
		--privileged \
		--env ACENIC_ID=%d \
		--env DOCKER_INST=%s \
		--hostname=%s \
		--name=%s \
		-v %s:/etc/ipsec.conf \
		-v %s:/etc/ipsec.secrets \
		-v %s:%s \
		%s"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${libreswan_host_dir} \
		${nic_id} \
		${libreswan_inst} \
		${libreswan_inst} \
		${libreswan_inst} \
		${libreswan_host_dir}/ipsec.conf \
		${libreswan_host_dir}/ipsec.secrets \
		${libreswan_host_dir}/conns \
		${libreswan_shared_dir}/conns \
		${LIBRESWAN_TAG})
	################################
	sleep 2
	exec_tgt '/' "${exec_cmd}"
}

enet_vpn_connect_libreswan_inst() {

	set -x
	local nic_id=$1
	local nic_port=$2
	local libreswan_inst="${ENET_NIC_BR}_libreswan${nic_port}"
	local dev_name="e${nic_id}ls${nic_port}"
	
	local libreswan_inst_mac=$(printf 'CC:D3:9D:D0:00:%01X%01X' ${nic_id} $(( ${nic_port} - 100 )))
	sleep 2
	ovs_dpdk add-docker-port \
		$OVS_VPN_BR ${dev_name} ${libreswan_inst} \
		--ipaddress=${ENET_IPSEC_LOCAL_IP}/24 \
		--macaddress=${libreswan_inst_mac}
	sleep 2
	ovs_dpdk set-docker-port-id ${libreswan_inst} ${dev_name} ${nic_port}
	set +x
}

enet_vpn_disconnect_libreswan_inst() {

	local nic_id=$1
	local nic_port=$2
	local libreswan_inst="${ENET_NIC_BR}_libreswan${nic_port}"
	local dev_name="e${nic_id}ls${nic_port}"
	
	sleep 2
	ovs_dpdk del-docker-port \
		$OVS_VPN_BR ${dev_name} ${libreswan_inst}
}

enet_vpn_deploy_libreswan() {

	enet_vpn_reboot_libreswan_inst ${ACENIC_ID} 104
	enet_vpn_reboot_libreswan_inst ${ACENIC_ID} 105
	enet_vpn_reboot_libreswan_inst ${ACENIC_ID} 106
	enet_vpn_reboot_libreswan_inst ${ACENIC_ID} 107
}

enet_vpn_connect_libreswan() {

	enet_vpn_connect_libreswan_inst ${ACENIC_ID} 104
	enet_vpn_connect_libreswan_inst ${ACENIC_ID} 105
	enet_vpn_connect_libreswan_inst ${ACENIC_ID} 106
	enet_vpn_connect_libreswan_inst ${ACENIC_ID} 107
}

enet_vpn_disconnect_libreswan() {

	enet_vpn_disconnect_libreswan_inst ${ACENIC_ID} 104
	enet_vpn_disconnect_libreswan_inst ${ACENIC_ID} 105
	enet_vpn_disconnect_libreswan_inst ${ACENIC_ID} 106
	enet_vpn_disconnect_libreswan_inst ${ACENIC_ID} 107
}

enet_vpn_init() {

	enet_exec port ingress set all -a 1 -c 0
	enet_exec port egress set all -a 1 -c 1
	enet_exec IPSec global set ttl 40
	enet_exec forwarder delete all
	enet_exec action set delete all
	enet_exec service set delete all
	enet_exec IPSec ESP set delete all
}

enet_vpn_start() {

	#enet_run
	enet_vpn_config_mngr_start
	curl -X POST -H "Content-Type: application/json" -d @$VPN_SHARED_DIR/enet_vpn_config.json "http://127.0.0.1:${ENET_VPN_CONFIG_PORT}"
	enet_vpn_update_env
	exec_tgt '/' "mkdir -p /tmp/${DOCKER_INST}"
	ip link del dev ${OVS_VPN_BR}
	#ovs_run
	enet_ovs_attach ${OVS_VPN_BR}
	enet_vpn_init
	enet_vpn_deploy_libreswan
	enet_vpn_connect_libreswan
}
