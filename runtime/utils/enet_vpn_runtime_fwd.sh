#!/bin/bash

enet_ipsec_exec() {

	(>&2 echo "enet_exec $@")
	#enet_exec $@
}

enet_ipsec_ovs_exec() {

	(>&2 echo "ovs_dpdk $@")
	#ovs_dpdk $@
}

enet_ipsec_spi_ntoh_hex() {

	local spi=$1
	
	local spi_hex=$(printf "%08x" ${spi})
	local spi_ntoh_hex="${spi_hex:6:2}${spi_hex:4:2}${spi_hex:2:2}${spi_hex:0:2}"
	printf "%d" 0x${spi_ntoh_hex}
}

enet_ipsec_unique_id_by_subnets() {

	local subnet_src=$1
	local subnet_dst=$2
	local hashval=$(md5sum <<< "${subnet_src} ${subnet_dst}")
	local hashmod="${hashval:0:3}"
	echo $(( ((16#${hashmod}) % 2048) + 2048 ))
}

enet_ipsec_unique_mac_by_subnets() {

	local subnet_src=$1
	local subnet_dst=$2
	local hashval=$(md5sum <<< "${subnet_src} ${subnet_dst}")
	local hashmod="${hashval:0:2}:${hashval:2:2}:${hashval:4:2}:${hashval:6:2}:${hashval:8:2}:${hashval:10:2}"
	echo ${hashmod}
}

enet_ipsec_cipher_type() {

	local auth_algo="$1"
	local cipher_algo="$2"
	local cipher_type="0x00"

	case "${auth_algo}" in
	"NONE"|"null"|"")
	######################
	case "${cipher_algo}" in
		"rfc3686(ctr(aes))"|"AES_CTR")
		cipher_type="0x80"
		;;
		"AES_GCM_16")
		cipher_type="0xCA"
		;;
	esac
	######################
	;;
	"HMAC_SHA1_96")
	######################
	case "${cipher_algo}" in
		"AES_CBC")
		cipher_type="0x42"
		;;
	esac
	######################
	;;
	esac
	echo "${cipher_type}"
}

enet_ipsec_format_auth_key() {

	local auth_key=$1

	[[ ${auth_key} == "0x00" ]] && \
	auth_key="0x0000000000000000000000000000000000000000"

	local enet_integrity_key="${auth_key:0:18} 0x${auth_key:8:8} 0x${auth_key:16:8} 0x${auth_key:24:8} 0x00000000 0x00000000 0x00000000 0x00000000"
	local enet_integrity_iv="0x${auth_key:32:8} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000"

	echo "-Integrity_key ${enet_integrity_key} -Integrity_IV ${enet_integrity_iv}"
}

enet_ipsec_format_cipher_key() {

	local cipher_key=$1

	local enet_confidentiality_key="0x${cipher_key:0:8} 0x${cipher_key:8:8} 0x${cipher_key:16:8} 0x${cipher_key:24:8} 0x00000000 0x00000000 0x00000000 0x00000000"
	local enet_confidentiality_iv="0x${cipher_key:32:8} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000"

	echo "-Confident_key ${enet_confidentiality_key} -Confident_IV ${enet_confidentiality_iv}"
}

function enet_ipsec_resolve_tun_mac_dst {

	local dev_dst=$1
	local tun_ip_dst=$2
	local srvr_ip=$(srvr_ip_by_id ${dev_dst})
	local srvr_name=$(srvr_name_by_ip ${srvr_ip})
	
	local docker_cmd="docker exec ${srvr_name} ip neigh | grep ${tun_ip_dst} | sed -s 's/^.* dev vpndev0 lladdr \([0-9a-fA-F\:]*\) .*$/\1/'"
	host_log "${docker_cmd}"
	local neigh_mac=$(eval "${docker_cmd}")
	host_log "${tun_ip_dst}@${dev_dst}: ${neigh_mac}"
	echo "${neigh_mac}"
}

enet_ipsec_add_profile() {

	local spi=$1
	local auth_algo=$2
	local auth_key=$3
	local cipher_algo=$4
	local cipher_key=$5

	spi=$(enet_ipsec_spi_ntoh_hex ${spi})
	local enet_cipher_type=$(enet_ipsec_cipher_type ${auth_algo} ${cipher_algo})
	local enet_auth_key=$(enet_ipsec_format_auth_key ${auth_key})
	local enet_cipher_key=$(enet_ipsec_format_cipher_key ${cipher_key})

	set +x
	################################
	local exec_pattern="IPSec ESP set create \
		${ENET_IPSEC_ID_AUTO} \
		-security_type 0x%02X \
		-TFC_en 0 \
		-ESN_en 0 \
		-SPI %s \
		%s \
		%s"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${enet_cipher_type} \
		${spi} \
		"${enet_auth_key}" \
		"${enet_cipher_key}")
	################################
	local profile_add_result=$(enet_ipsec_exec "${exec_cmd}")
	sed -n 's~.*Done create IPSecESP with Id = \([0-9][0-9]*\).*~\1~p' <<< "${profile_add_result}"
	################################
	set +x
}

enet_ipsec_add_cipher_action() {

	local tun_ip_src=$1
	local tun_ip_dst=$2
	local cipher_profile_id=$3
	local enet_cipher_flag=$4
	
	set +x
	################################
	local exec_pattern="action set create \
		-ed 1 0 \
		-hIPSec 1 1 %s %s \
		-hESP 1 %d \
		-hType %d"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${tun_ip_src} ${tun_ip_dst} \
		${cipher_profile_id} \
		${enet_cipher_flag})
	################################
	local action_add_result=$(enet_ipsec_exec "${exec_cmd}")
	sed -n 's~Done\. ActionId=\([0-9][0-9]*\) (PmId=NO/[0-9][0-9]*,tmId=NO/[0-9][0-9]*,edId=YES/[0-9][0-9]*)~\1~p' <<< ${action_add_result}
	echo "66665"
	################################	
	set +x
}

enet_ipsec_add_l3fwd_action() {

	local mac_dst=$1
	local mac_src=$2

	set +x
	################################
	local exec_pattern="action set create \
		-ed 1 0 \
		-h 0 0 0 0 \
		-lmid 1 0 1 0 \
		-r %s  %s 0000"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${mac_dst} ${mac_src})
	################################
	local action_add_result=$(enet_ipsec_exec "${exec_cmd}")
	sed -n 's~Done\. ActionId=\([0-9][0-9]*\) (PmId=NO/[0-9][0-9]*,tmId=NO/[0-9][0-9]*,edId=YES/[0-9][0-9]*)~\1~p' <<< ${action_add_result}
	echo "66666"
	################################
	set +x
}

enet_ipsec_add_dmac_forwarder() {

	local tun_uniq_mac=$1
	local dev_src=$2
	local dev_dst=$3
	local cipher_action_id=$4
	
	set +x
	################################
	local exec_pattern="forwarder add \
		0 %s %d 3 1 0 1 %d \
		-action 1 %d"
	local exec_cmd=$(\
	printf "${exec_pattern}" \
		${tun_uniq_mac} ${dev_src} ${dev_dst} \
		${cipher_action_id})
	################################
	echo "exec_cmd:${exec_cmd}"
	local forwarder_add_result=$(enet_ipsec_exec "${exec_cmd}")
	#echo "${forwarder_add_result}"
	################################	
	set +x
}

enet_ipsec_del_dmac_forwarder_action() {

	local tun_uniq_mac=$1
	local dev_src=$2
	local dev_dst=$3

	################################
	local forwarder_pattern="${WS}\(${NUM}\)${WS}${NUM}${WS}%s${WS}vpn=${WS}%d${WS}Data:${WS}Static${WS}Age${NUM}${WS}saD=${WS}NO${WS}ActId=${WS}\(${NUM}\)${WS}LimId=D.C${WS}A_P=${NUM}${WS}xPerId=${WS}${NUM}${WS}Out:${WS}%d"
	local forwarder_sed_pattern=$(printf "${forwarder_pattern}" ${tun_uniq_mac} ${dev_src} ${dev_dst})
	local exec_delete=$(meaCli mea forwarder show all | sed -n "s/${forwarder_sed_pattern}/meaCli mea forwarder set delete \1;meaCli mea action set delete \2;/p")
	enet_ipsec_exec "${exec_delete}"
	################################
}

enet_ipsec_outbound_tunnel_partial_offload_delete() {

	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	local tun_mac_dst=$5
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local in_vlan_hex=$(printf '0x81000%03x' ${tunnel_id})
	
	################################
	ovs_dpdk del-flows $OVS_VPN_BR \
		$OVS_FLOW_PORT_SUBNET_PAIR_SPEC \
		$ENET_HOST_PORT \
		${subnet_src} \
		${subnet_dst}
	################################
	set -x
	local service_line_pattern="^${WS}\([0-9][0-9]*\)${WS}${ENET_HOST_PORT}${WS}${in_vlan_hex}${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0x00000000${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0${WS}NA${WS}Encrypt${WS}\([0-9][0-9]*\)${WS}NONE${WS}${enet_mach_id_ipsec_enc_pop_vlan}${WS}NONE${WS}NA.*$"
	exec_delete=$(\
		meaCli mea service show edit all | \
		sed -n "s/${service_line_pattern}/meaCli mea service set delete \1; meaCli mea IPSec ESP set delete \2;/p"\
		)
	set +x
	enet_exec "${exec_delete}"
	################################
}

enet_ipsec_inbound_tunnel_partial_offload_delete() {

	local dev_dst=$1
	local subnet_dst=$2
	local subnet_src=$3
	local dev_src=$4
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local out_vlan_hex=$(printf '0x81000%03x' ${tunnel_id})

	################################
	ovs_dpdk del-flows $OVS_VPN_BR \
		$OVS_FLOW_PORT_SUBNET_PAIR_SPEC \
		$ENET_HOST_PORT \
		${subnet_src} \
		${subnet_dst}
	################################
	set -x
	exec_delete=$(\
		meaCli mea service show edit all | \
		sed -n "s/^${WS}\([0-9][0-9]*\)${WS}${in_port}${WS}${out_vlan_hex}${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0x00000000${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0${WS}NA${WS}Decrypt${WS}\([0-9][0-9]*\)${WS}NONE${WS}${enet_mach_id_push_vlan}${WS}NONE${WS}NA.*$/meaCli mea service set delete \1; meaCli mea IPSec ESP set delete \2;/p"\
		)
	set +x
	enet_exec "${exec_delete}"
	################################
	enet_ovs del-flows \
		$ENET_NIC_BR \
		$ENET_FWD_VLAN_PUSH_PATTERN \
		$ENET_IPSEC_VPORT_VLAN_PUSH_PRIORITY \
		$ENET_IPSEC_VPORT \
		${tunnel_id} \
		${dev_dst}
	################################
}

enet_ipsec_inbound_tunnel_partial_offload_add() {

	local tun_ip_dst=$1
	local tun_ip_src=$2
	shift 2
	
	local spi=$1
	local cipher_profile_id=$(enet_ipsec_add_profile $@)
	shift 5
	
	local dev_dst=$1
	local subnet_dst=$2
	local subnet_src=$3
	local dev_src=$4

	spi=$(enet_ipsec_spi_ntoh_hex ${spi})
	local tun_ip_src_hex=$(gethostip -x ${tun_ip_src})
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local out_vlan_mask=$(printf 'FF%03X' "${tunnel_id}")
	local out_vlan_header=$(printf '81000%03X' "${tunnel_id}")
	################################
	enet_exec "service set create \
		${in_port} \
		${tun_ip_src_hex} ${tun_ip_src_hex} \
		D.C 0 1 0 1000000000 0 ${ENET_IPSEC_DEFAULT_CBS} 0 0 1 \
		${ENET_IPSEC_VPORT} \
		-ra 0 \
		-inf 1 ${spi} \
		${ENET_FLAG_CLASSIFY_UNTAGGED} \
		${ENET_IPSEC_SUBTYPE_FLAG} \
		-h ${out_vlan_header} 0 0 0 \
		${ENET_ENG_FLAG_VLAN_PUSH} \
		${ENET_IPSEC_FLAG_ESP_DECRYPT} ${cipher_profile_id}"
	################################
	enet_exec "service set create \
		${ENET_IPSEC_VPORT} \
		${out_vlan_mask} ${out_vlan_mask} \
		D.C 0 1 0 1000000000 0 ${ENET_IPSEC_DEFAULT_CBS} 0 0 1 \
		${ENET_HOST_PORT} \
		-ra 0 \
		${ENET_FLAG_CLASSIFY_TAGGED}"
	################################
	ovs_dpdk add-flow $OVS_VPN_BR \
		$OVS_FLOW_PORT_SUBNET_PAIR_VLAN_SWAP \
		$ENET_IPSEC_INBOUND_TUNNEL_PARTIAL_OFFLOAD_PRIORITY \
		$ENET_HOST_PORT \
		${tunnel_id} \
		${subnet_src} \
		${subnet_dst} \
		${dev_dst} \
		${dev_dst}
	################################
}

enet_ipsec_outbound_tunnel_partial_offload_add() {

	local tun_ip_src=$1
	local tun_ip_dst=$2
	shift 2
	
	local cipher_profile_id=$(enet_ipsec_add_profile $@)
	shift 5
	
	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	local tun_mac_dst=$5
	
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local in_vlan_mask=$(printf 'FF%03X' "${tunnel_id}")
	local in_vlan_header=$(printf '81000%03X' "${tunnel_id}")

	################################
	enet_exec "service set create \
		${ENET_HOST_PORT} \
		${in_vlan_mask} ${in_vlan_mask} \
		D.C 0 1 0 1000000000 0 ${ENET_IPSEC_DEFAULT_CBS} 0 0 1 \
		${dev_dst} \
		-ra 0 \
		${ENET_FLAG_CLASSIFY_TAGGED} \
		-h ${in_vlan_header} 0 0 0 \
		${ENET_IPSEC_FLAG_TUN_ONLY} \
		${ENET_IPSEC_LOCAL_IP} ${tun_ip_dst} \
		${ENET_IPSEC_FLAG_ESP_ENCRYPT} ${cipher_profile_id} \
		${ENET_IPSEC_FLAG_ENG_VLAN_POP_ENCRYPT}"
	################################
	ovs_dpdk add-flow $OVS_VPN_BR \
		$OVS_FLOW_PORT_SUBNET_PAIR_L3FWD_VLAN_SWAP \
		$ENET_IPSEC_OUTBOUND_TUNNEL_PARTIAL_OFFLOAD_PRIORITY \
		$ENET_HOST_PORT \
		${dev_src} \
		${subnet_src} \
		${subnet_dst} \
		${tunnel_id} \
		$ENET_VPN_MAC \
		${tun_mac_dst}
	################################
}

enet_ipsec_outbound_tunnel_full_offload_add() {

	local tun_ip_src=$1
	local tun_ip_dst=$2
	shift 2
	
	local cipher_profile_id=$(enet_ipsec_add_profile $@)
	local cipher_action_id=$(enet_ipsec_add_cipher_action ${tun_ip_src} ${tun_ip_dst} ${cipher_profile_id} $ENET_IPSEC_ID_ENG_ENCRYPT)
	echo "cipher_action_id:${cipher_action_id}"
	shift 5
	
	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	local tun_mac_dst=$5
	
	################################
	local tun_uniq_mac=$(enet_ipsec_unique_mac_by_subnets ${subnet_src} ${subnet_dst})
	enet_ipsec_add_dmac_forwarder ${tun_uniq_mac} ${dev_src} $ENET_IPSEC_VPORT_ENC ${cipher_action_id}
	local l3fwd_action_id=$(enet_ipsec_add_l3fwd_action ${tun_mac_dst} $ENET_VPN_MAC)
	echo "l3fwd_action_id:${l3fwd_action_id}"
	enet_ipsec_add_dmac_forwarder ${tun_uniq_mac} $ENET_IPSEC_VPORT_ENC ${dev_dst} ${l3fwd_action_id}
	################################
	enet_ipsec_ovs_exec add-flow $OVS_VPN_BR \
		$OVS_FLOW_PORT_ARP_SUBNET_PAIR_DO_L2FWD \
		$ENET_IPSEC_OUTBOUND_TUNNEL_FULL_OFFLOAD_PRIORITY \
		$ENET_HOST_PORT \
		${dev_src} \
		${subnet_src} \
		${subnet_dst} \
		${dev_dst}
	################################
	enet_ipsec_ovs_exec add-flow $OVS_VPN_BR \
		$OVS_FLOW_PORT_SMAC_ARP_SUBNET_PAIR_DO_SET_DMAC_L2FWD \
		$ENET_IPSEC_OUTBOUND_TUNNEL_FULL_OFFLOAD_PRIORITY \
		${dev_dst} \
		${tun_uniq_mac} \
		${subnet_dst} \
		${subnet_src} \
		${dev_dst} \
		$ENET_HOST_PORT
	################################
}

enet_ipsec_outbound_tunnel_full_offload_delete() {

	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	local tun_mac_dst=$5

	################################
	local tun_uniq_mac=$(enet_ipsec_unique_mac_by_subnets ${subnet_src} ${subnet_dst})
	enet_ipsec_del_dmac_forwarder_action ${tun_uniq_mac} ${dev_src} $ENET_IPSEC_VPORT_ENC
	enet_ipsec_del_dmac_forwarder_action ${tun_uniq_mac} $ENET_IPSEC_VPORT_ENC ${dev_dst}
	################################
	
	################################
	################################
	################################
}

enet_ipsec_tunnel_delete() {

	local xfrm_pattern=$1
	shift


	case "${xfrm_pattern}" in
		"${OUTBOUND_TUNNEL_SPEC}")
		enet_ipsec_outbound_tunnel_full_offload_delete $@
		#enet_ipsec_outbound_tunnel_partial_offload_delete $@
		;;
		"${INBOUND_TUNNEL_SPEC}")
		enet_ipsec_inbound_tunnel_full_offload_delete $@
		#enet_ipsec_inbound_tunnel_partial_offload_delete $@
		;;
		*)
		exec_log "ip xfrm state delete $(printf '${xfrm_pattern}' $@)"
		;;
	esac
}

enet_ipsec_tunnel_add() {

	set +x
	local xfrm_pattern="$1"
	shift

	case "${xfrm_pattern}" in
		"${OUTBOUND_TUNNEL_FULL_OFFLOAD_PATTERN}")
		enet_ipsec_outbound_tunnel_full_offload_add $@
		;;
		"${INBOUND_TUNNEL_FULL_OFFLOAD_PATTERN}")
		enet_ipsec_inbound_tunnel_full_offload_add $@
		;;
		"${OUTBOUND_TUNNEL_PARTIAL_OFFLOAD_PATTERN}")
		enet_ipsec_outbound_tunnel_partial_offload_add $@
		;;
		"${INBOUND_TUNNEL_PARTIAL_OFFLOAD_PATTERN}")
		enet_ipsec_inbound_tunnel_partial_offload_add $@
		;;
		"${OUTBOUND_TUNNEL_SW_OFFLOAD_PATTERN}")
		enet_ipsec_outbound_tunnel_sw_offload_add $@
		;;
		"${INBOUND_TUNNEL_SW_OFFLOAD_PATTERN}")
		enet_ipsec_inbound_tunnel_sw_offload_add $@
		;;
		*)
		exec_log "ip xfrm state add $(printf '${xfrm_pattern}' $@)"
		;;
	esac
	set +x
}

enet_ipsec() {

	local object=$1
	local command=$2
	local verb=$3
	shift 3

	set +x
	case "${object} ${command} ${verb}" in
		'xfrm state add')
		enet_ipsec_tunnel_add "$@"
		;;
		'xfrm state delete')
		enet_ipsec_tunnel_delete "$@"
		;;
		'xfrm state update')
		enet_ipsec_tunnel_delete "${@:7}"
		enet_ipsec_tunnel_add "$@"
		;;
		*)
		exec_log "ip xfrm ${command} ${verb} $@"
		;;
	esac
	set +x
}

