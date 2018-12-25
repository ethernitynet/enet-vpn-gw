#!/bin/bash

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
	echo "-security_type ${cipher_type}"
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

enet_ipsec_add_profile() {

	local spi=$2
	local auth_algo=$4
	local auth_key=$5
	local cipher_algo=$6
	local cipher_key=$7

	spi=$(enet_ipsec_spi_ntoh_hex ${spi})
	local enet_cipher_type=$(enet_ipsec_cipher_type ${auth_algo} ${cipher_algo})
	local enet_auth_key=$(enet_ipsec_format_auth_key ${auth_key})
	local enet_cipher_key=$(enet_ipsec_format_cipher_key ${cipher_key})
		
	local profile_add_result="$(\
	enet_exec 'IPSec ESP set create \
		${ENET_IPSEC_ID_AUTO} \
		${enet_cipher_type} \
		-TFC_en 0 \
		-ESN_en 0 \
		-SPI ${spi} \
		${enet_auth_key} \
		${enet_cipher_key})'\
		)"
	sed -n 's/^.*Done create IPSecESP with Id = \(.*\)  .*$/\1/p' <<< "${profile_add_result}"
}

enet_ipsec_outbound_tunnel_partial_offload_delete() {

	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local in_vlan_hex=$(printf '0x81000%03x' ${tunnel_id})
	
	set -x
	local service_line_pattern="^${WS}\([0-9][0-9]*\)${WS}${ENET_HOST_PORT}${WS}${in_vlan_hex}${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0x00000000${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0${WS}NA${WS}Encrypt${WS}\([0-9][0-9]*\)${WS}NONE${WS}${enet_mach_id_ipsec_enc_pop_vlan}${WS}NONE${WS}NA.*$"
	exec_delete=$(\
		meaCli mea service show edit all | \
		sed -n "s/${service_line_pattern}/meaCli mea service set delete \1; meaCli mea IPSec ESP set delete \2;/p"\
		)
	set +x
	enet_exec "${exec_delete}"
}

enet_ipsec_inbound_tunnel_partial_offload_delete() {

	local dev_dst=$1
	local subnet_dst=$2
	local subnet_src=$3
	local dev_src=$4
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local out_vlan_hex=$(printf '0x81000%03x' ${tunnel_id})

	set -x
	exec_delete=$(\
		meaCli mea service show edit all | \
		sed -n "s/^${WS}\([0-9][0-9]*\)${WS}${in_port}${WS}${out_vlan_hex}${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0x00000000${WS}N${WS}\/${WS}N${WS}transp${WS}NA${WS}0${WS}NA${WS}Decrypt${WS}\([0-9][0-9]*\)${WS}NONE${WS}${enet_mach_id_push_vlan}${WS}NONE${WS}NA.*$/meaCli mea service set delete \1; meaCli mea IPSec ESP set delete \2;/p"\
		)
	set +x
	enet_exec "${exec_delete}"
	enet_ovs del-flows \
		$ENET_NIC_BR \
		$ENET_FWD_VLAN_PUSH_PATTERN \
		$ENET_IPSEC_VPORT_VLAN_PUSH_PRIORITY \
		$ENET_IPSEC_VPORT \
		${tunnel_id} \
		${dev_dst}
}

enet_ipsec_inbound_tunnel_partial_offload_add() {

	local tun_dst=$1
	local tun_src=$2
	shift 2
	
	local spi=$1
	local cipher_profile_id=$(enet_ipsec_add_profile $@)
	shift 5
	
	local dev_dst=$1
	local subnet_dst=$2
	local subnet_src=$3
	local dev_src=$4

	spi=$(enet_ipsec_spi_ntoh_hex ${spi})
	local tun_src_ip_hex=$(gethostip -x ${tun_src})
	local tunnel_id=$(enet_ipsec_unique_id_by_subnets ${subnet_src} ${subnet_dst})
	local out_vlan_mask=$(printf 'FF%03X' "${tunnel_id}")
	local out_vlan_header=$(printf '81000%03X' "${tunnel_id}")
	################################
	enet_exec "service set create \
		${in_port} \
		${tun_src_ip_hex} ${tun_src_ip_hex} \
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
	ovs_dpdk add-flow \
		'priority=%d,in_port=%d,dl_vlan=%d,ip,nw_src=%s,nw_dst=%s,actions=mod_vlan_vid:%d,goto_table=%d' \
		$ENET_IPSEC_INBOUND_TUNNEL_PARTIAL_OFFLOAD_PRIORITY \
		${dev_src} \
		${tunnel_id} \
		${subnet_src} \
		${subnet_dst} \
		${dev_dst} \
		${dev_dst}
	################################
}

enet_ipsec_outbound_tunnel_partial_offload_add() {

	local tun_src=$1
	local tun_dst=$2
	shift 2
	
	local cipher_profile_id=$(enet_ipsec_add_profile $@)
	shift 5
	
	local dev_src=$1
	local subnet_src=$2
	local subnet_dst=$3
	local dev_dst=$4
	
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
		${ENET_IPSEC_LOCAL_IP} ${tun_dst} \
		${ENET_IPSEC_FLAG_ESP_ENCRYPT} ${cipher_profile_id} \
		${ENET_IPSEC_FLAG_ENG_VLAN_POP_ENCRYPT}"
	################################
	ovs_dpdk add-flow \
		'priority=%d,in_port=%d,dl_vlan=%d,ip,nw_src=%s,nw_dst=%s,actions=mod_vlan_vid:%d,goto_table=%d' \
		$ENET_IPSEC_OUTBOUND_TUNNEL_PARTIAL_OFFLOAD_PRIORITY \
		${dev_src} \
		${tunnel_id} \
		${subnet_src} \
		${subnet_dst} \
		${dev_dst} \
		${dev_dst}
	################################
}
	
enet_ipsec_tunnel_delete() {

	local xfrm_pattern=$1
	shift


	case "${xfrm_pattern}" in
		"${OUTBOUND_TUNNEL_SPEC}")
		enet_ipsec_outbound_tunnel_partial_offload_delete $@
		;;
		"${INBOUND_TUNNEL_SPEC}")
		ovs_dpdk 
		enet_ipsec_inbound_tunnel_partial_offload_delete $@
		;;
		*)
		exec_log "ip xfrm state delete $(printf '${xfrm_pattern}' $@)"
		;;
	esac
}

enet_ipsec_tunnel_add() {

	local xfrm_pattern=$1
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
}

enet_ipsec() {

	local object=$1
	local command=$2
	local verb=$3
	shift 3

	case "${object} ${command} ${verb}" in
		'xfrm state add')
		enet_ipsec_tunnel_add $@
		;;
		'xfrm state delete')
		enet_ipsec_tunnel_delete $@
		;;
		'xfrm state update')
		enet_ipsec_tunnel_delete "${@:7}"
		enet_ipsec_tunnel_add $@
		;;
		*)
		exec_log "ip xfrm ${command} ${verb} $@"
		;;
	esac
}
