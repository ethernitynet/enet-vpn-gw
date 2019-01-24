
/////////////////////////////////////
/////////////////////////////////////
// mea
/////////////////////////////////////
/////////////////////////////////////

function mea_ipsec_cipher_type_hex_spec(auth_algo, cipher_algo) {

	var cipher_type = '0x00';

	switch(auth_algo) {

	case 'NONE':
	case 'null':
	case '':
		switch(cipher_algo) {
			
		case 'rfc3686(ctr(aes))':
		case 'AES_CTR':
			cipher_type = '0x80';
		break;

		case 'AES_GCM_16':
			cipher_type = '0xCA';
		break;		
		};
	break;
	
	case 'HMAC_SHA1_96':
		switch(cipher_algo) {
			
		case 'AES_CBC':
			cipher_type = '0x42';
		break;
		};
	break;
	};
	return cipher_type;
};

function mea_ipsec_cipher_type_hex(cipher_type) {

	switch(cipher_type) {

		case 'aes_gcm128-null':
			return mea_ipsec_cipher_type_hex_spec('', 'AES_GCM_16');
	};
	return '0x00';
}

function mea_expr_ipsec_profile_id_parse(expr_arr) {

	expr_arr.push(`  PROFILE_ID=$(sed -s "s~Done create IPSecESP with Id = \\([0-9][0-9]*\\)~\\1~" <<< "\${MEA_RESULT}")`);
	expr_arr.push(`  PROFILE_IDS="\${PROFILE_IDS},\${PROFILE_ID}"`);
};

function mea_expr_action_id_pm_id_parse(expr_arr) {

	expr_arr.push(`  ENV_EXPR=$(sed -s "s~Done\\. ActionId=\\([0-9][0-9]*\\) (PmId=YES/\\([0-9][0-9]*\\),tmId=[YESNO][YESNO]*/[0-9][0-9]*,edId=[YESNO][YESNO]*/[0-9][0-9]*)~ACTION_ID=\\1;PM_ID=\\2~" <<< "\${MEA_RESULT}")`);
	expr_arr.push(`  eval "\${ENV_EXPR}"`);
	expr_arr.push(`  PM_IDS="\${PM_IDS},\${PM_ID}"`);
	expr_arr.push(`  ACTION_IDS="\${ACTION_IDS},\${ACTION_ID}"`);
};

function mea_expr_action_id_parse(expr_arr) {

	expr_arr.push(`  ACTION_ID=$(sed -s "s~Done\\. ActionId=\\([0-9][0-9]*\\) (PmId=NO/[0-9][0-9]*,tmId=[YESNO][YESNO]*/[0-9][0-9]*,edId=[YESNO][YESNO]*/[0-9][0-9]*)~\\1~" <<< "\${MEA_RESULT}")`);
	expr_arr.push(`  ACTION_IDS="\${ACTION_IDS},\${ACTION_ID}"`);
};

function mea_ipsec_auth_key_expr_append(expr_arr, auth_key) {

	expr_arr.push(`  if [[ \${${auth_key}} == '0x00' ]]`);
	expr_arr.push(`  then`);
	expr_arr.push(`  ${auth_key}="-Integrity_key 0x0000000000000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 -Integrity_IV 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000"`);
	expr_arr.push(`  else`);
	expr_arr.push(`  ${auth_key}="-Integrity_key \${${auth_key}:0:18} 0x\${${auth_key}:18:8} 0x\${${auth_key}:26:8} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 -Integrity_IV 0x\${${auth_key}:34:8} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000"`);
	expr_arr.push(`  fi`);
}

function mea_ipsec_cipher_key_expr_append(expr_arr, cipher_key) {

	expr_arr.push(`  ${cipher_key}="-Confident_key 0x\${${cipher_key}:0:8} 0x\${${cipher_key}:8:8} 0x\${${cipher_key}:16:8} 0x\${${cipher_key}:24:8} 0x00000000 0x00000000 0x00000000 0x00000000 -Confident_IV 0x\${${cipher_key}:32:8} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000"`);
}

function mea_expr_conn_add_outbound(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const gw_dev = tun_gw_dev(nic_cfg, conn);
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const gw_ip_hex = ip_to_hex(vpn_cfg.vpn_gw_ip);
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/${vpn_inst}/${gw_inst}/conns/${ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# [host]:${mea_shared_dir}/mea_add_outbound.sh`);
	expr_arr.push(`mea_add_outbound() {`);
	expr_arr.push(`  local PROFILE_IDS=''`);
	expr_arr.push(`  local ACTION_IDS=''`);
	expr_arr.push(`  local FORWARDER_IDS=''`);
	expr_arr.push(`  local SERVICE_IDS=''`);
	expr_arr.push(`  local PM_IDS=''`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ACE-NIC# Add Outbound Tunnel (HW offload: ${conn.outbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + docker_wrapper(nic_cfg, conn, '', `ip neigh`));
	expr_arr.push(`  TUN_REMOTE_MAC=$(echo "\${DOCKER_RESULT}" | grep ${conn.remote_tunnel_endpoint_ip} | sed -s 's/^.* dev ${gw_dev} lladdr \\([0-9a-fA-F\:]*\\) .*$/\\1/')`);
	expr_arr.push(`  ` + log_wrapper(`TUN_REMOTE_MAC:\${TUN_REMOTE_MAC}`));
	expr_arr.push(`  if [[ \${TUN_REMOTE_MAC} != '' ]]`);
	expr_arr.push(`  then`);
	ntoh_32_expr_append(expr_arr, 'SPI');
	mea_ipsec_auth_key_expr_append(expr_arr, 'AUTH_KEY');
	mea_ipsec_cipher_key_expr_append(expr_arr, 'CIPHER_KEY');
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `IPSec ESP set create auto -security_type ${mea_ipsec_cipher_type_hex(conn.encryption_type)} -TFC_en 0 -ESN_en 0 -SPI \${SPI} \${AUTH_KEY} \${CIPHER_KEY}`));
	mea_expr_ipsec_profile_id_parse(expr_arr);
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `action set create -ed 1 0 -hIPSec 1 1 ${vpn_cfg.vpn_gw_ip} ${conn.remote_tunnel_endpoint_ip} -hESP 1 \${PROFILE_ID} -hType 71`));
	mea_expr_action_id_parse(expr_arr);
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `forwarder add 0 ${ns_mac} 24 3 1 0 1 ${conn.lan_port} -action 1 \${ACTION_ID}`));
	expr_arr.push(`  FORWARDER_IDS="\${FORWARDER_IDS},\${FORWARDER_ID}"`);
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `service set create 24 ${gw_ip_hex} ${gw_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 0 -ra 0 -inf 1 \${SPI}  -h 0 0 0 0 -v 24 -p 0 -subType 19 -l2Type 0`));
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `action set create -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r \${TUN_REMOTE_MAC} ${ns_mac} 0000`));
	mea_expr_action_id_pm_id_parse(expr_arr);
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `forwarder add 0 ${ns_mac} 24 3 1 0 1 ${conn.tunnel_port} -action 1 \${ACTION_ID}`));
	expr_arr.push(`  FORWARDER_IDS="\${FORWARDER_IDS},\${FORWARDER_ID}"`);
	expr_arr.push(`  fi`);
	expr_arr.push(`  echo "{'${ns}':{'PROFILE_IDS':[\${PROFILE_IDS}],'ACTION_IDS':[\${ACTION_IDS}],'FORWARDER_IDS':[\${FORWARDER_IDS}],'SERVICE_IDS':[\${SERVICE_IDS}],'PM_IDS':[\${PM_IDS}]}}" | sed -s 's/ //g' | sed -s 's/,\\]/\\]/g' | sed -s 's/\\[,/\\[/g' | sed -s "s/'/\\"/g"`);
	expr_arr.push(`}`);
};

function mea_expr_conn_add_inbound(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_hash = tun_ns_hash(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const remote_tunnel_endpoint_ip_hex = ip_to_hex(conn.remote_tunnel_endpoint_ip);
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/${vpn_inst}/${gw_inst}/conns/${ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# [host]:${mea_shared_dir}/mea_add_inbound.sh`);
	expr_arr.push(`mea_add_inbound() {`);
	expr_arr.push(`  local PROFILE_IDS=''`);
	expr_arr.push(`  local ACTION_IDS=''`);
	expr_arr.push(`  local FORWARDER_IDS=''`);
	expr_arr.push(`  local SERVICE_IDS=''`);
	expr_arr.push(`  local PM_IDS=''`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ACE-NIC# Add Inbound Tunnel (HW offload: ${conn.inbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	mea_ipsec_auth_key_expr_append(expr_arr, 'AUTH_KEY');
	mea_ipsec_cipher_key_expr_append(expr_arr, 'CIPHER_KEY');
	ntoh_32_expr_append(expr_arr, 'SPI');
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `IPSec ESP set create auto -security_type ${mea_ipsec_cipher_type_hex(conn.encryption_type)} -TFC_en 0 -ESN_en 0 -SPI \${SPI} \${AUTH_KEY} \${CIPHER_KEY}`));
	mea_expr_ipsec_profile_id_parse(expr_arr);
	uint32_hex_expr_append(expr_arr, 'SPI');
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `service set create ${conn.tunnel_port} ${remote_tunnel_endpoint_ip_hex} ${remote_tunnel_endpoint_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 27 -ra 0 -inf 1 0x\${SPI} -l2Type 0 -subType 19 -h 81000${ns_hash.substring(0, 3)} 0 0 0 -hType 1 -hESP 2 \${PROFILE_ID}`));
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `service set create 27 FF${ns_hash.substring(0, 3)} FF${ns_hash.substring(0, 3)} D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 6 -v 0x${ns_hash.substring(0, 3)} -l4port_mask 1 -ra 0 -l2Type 1`));
	expr_arr.push(`  echo "{'${ns}':{'PROFILE_IDS':[\${PROFILE_IDS}],'ACTION_IDS':[\${ACTION_IDS}],'FORWARDER_IDS':[\${FORWARDER_IDS}],'SERVICE_IDS':[\${SERVICE_IDS}],'PM_IDS':[\${PM_IDS}]}}" | sed -s 's/ //g' | sed -s 's/,\\]/\\]/g' | sed -s 's/\\[,/\\[/g' | sed -s "s/'/\\"/g"`);
	expr_arr.push(`}`);
};

function mea_expr_port_add_outbound(expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const gw_ip_hex = ip_to_hex(vpn_cfg.vpn_gw_ip);
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/${vpn_inst}/${gw_inst}/conns`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# [host]:${mea_shared_dir}/mea_port_add_outbound.sh`);
	expr_arr.push(`mea_port_add_outbound() {`);
	expr_arr.push(`  local PROFILE_IDS=''`);
	expr_arr.push(`  local ACTION_IDS=''`);
	expr_arr.push(`  local FORWARDER_IDS=''`);
	expr_arr.push(`  local SERVICE_IDS=''`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ACE-NIC# Add Port Outbound Classification ${gw_inst}:'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + mea_wrapper(nic_cfg, `service set create ${port} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 0 -ra 0 -l2Type 0 -v ${port} -p 0 -h 0 0 0 0`));
	expr_arr.push(`  echo "{'${gw_inst}':{'SERVICE_IDS':[\${SERVICE_IDS}]}}" | sed -s 's/ //g' | sed -s 's/,\\]/\\]/g' | sed -s 's/\\[,/\\[/g' | sed -s "s/'/\\"/g"`);
	expr_arr.push(`}`);
};

function mea_expr_fwd_add_inbound(expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/${vpn_inst}/${gw_inst}/conns`;
	
	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# [host]:${mea_shared_dir}/mea_fwd_add_inbound.sh`);
	expr_arr.push(`mea_fwd_add_inbound() {`);
	expr_arr.push(`  local ACTION_IDS=''`);
	expr_arr.push(`  local FORWARDER_IDS=''`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ACE-NIC# Add Inbound Forwarders:'`);
	expr_arr.push(`  echo '=================================================================='`);
	
	expr_arr.push(`  while IFS= read -r FWD_MAPPING`);
	expr_arr.push(`  do`);
	expr_arr.push(`    eval "\${FWD_MAPPING}"`);
	expr_arr.push(`    ` + mea_wrapper(nic_cfg, `action set create -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r \${LAN_MAC} \${NS_MAC} 0000 -hType 3`));
	mea_expr_action_id_parse(expr_arr);
	expr_arr.push(`    ` + mea_wrapper(nic_cfg, `forwarder add 6 \${LAN_IP} 0 0x\${TUN_ID} 3 1 0 1 \${LAN_PORT} -action 1 \${ACTION_ID}`));
	expr_arr.push(`    FORWARDER_IDS="\${FORWARDER_IDS},\${FORWARDER_ID}"`);
	expr_arr.push(`  done < <(echo "\${FWD_MAPPINGS}")`);
	expr_arr.push(`  echo "{'${gw_inst}':{'ACTION_IDS':[\${ACTION_IDS}],'FORWARDER_IDS':[\${FORWARDER_IDS}]}}" | sed -s 's/ //g' | sed -s 's/,\\]/\\]/g' | sed -s 's/\\[,/\\[/g' | sed -s "s/'/\\"/g"`);
	expr_arr.push(`}`);
};


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function port_dictionary_append_mea(port_dictionary, cfg, port) {

	var expr_arr = [];
	expr_arr = []; mea_expr_port_add_outbound(expr_arr, cfg, port); port_dictionary[`${port}`][`mea_port_add_outbound`] = expr_arr;
	expr_arr = []; mea_expr_fwd_add_inbound(expr_arr, cfg, port); port_dictionary[`${port}`][`mea_fwd_add_inbound`] = expr_arr;
};

function conn_dictionary_append_mea(conn_dictionary, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	
	var expr_arr = [];
	expr_arr = []; mea_expr_conn_add_outbound(expr_arr, cfg, conn_id); conn_dictionary[`${ns}`][`mea_add_outbound`] = expr_arr;
	expr_arr = []; mea_expr_conn_add_inbound(expr_arr, cfg, conn_id); conn_dictionary[`${ns}`][`mea_add_inbound`] = expr_arr;
};
