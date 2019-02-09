
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mea_ipsec_format_keys = function (auth_key, cipher_key) {
	
	var tunnel_keys = {
		integrity_key: `0x0000000000000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		integrity_iv: `0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_key: `0x${cipher_key.substring(0, 8)} 0x${cipher_key.substring(8, 16)} 0x${cipher_key.substring(16, 24)} 0x${cipher_key.substring(24, 32)} 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_iv: `0x${cipher_key.substring(32, 40)} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`
	};
	return tunnel_keys;
};

global.mea_ipsec_format_security_type = function (auth_algo, cipher_algo) {
	
	return `0xCA`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mask_arr = [
	0x0000000000000000,
	0x0000000080000000,
	0x00000000C0000000,
	0x00000000E0000000,
	0x00000000F0000000,
	0x00000000F8000000,
	0x00000000FC000000,
	0x00000000FE000000,
	0x00000000FF000000,
	0x00000000FF800000,
	0x00000000FFC00000,
	0x00000000FFE00000,
	0x00000000FFF00000,
	0x00000000FFF80000,
	0x00000000FFFC0000,
	0x00000000FFFE0000,
	0x00000000FFFF0000,
	0x00000000FFFF8000,
	0x00000000FFFFC000,
	0x00000000FFFFE000,
	0x00000000FFFFF000,
	0x00000000FFFFF800,
	0x00000000FFFFFC00,
	0x00000000FFFFFE00,
	0x00000000FFFFFF00,
	0x00000000FFFFFF80,
	0x00000000FFFFFFC0,
	0x00000000FFFFFFE0,
	0x00000000FFFFFFF0,
	0x00000000FFFFFFF8,
	0x00000000FFFFFFFC,
	0x00000000FFFFFFFE,
	0x00000000FFFFFFFF
    ];

global.uint32_mask = function (num, mask_bits) {
	
	return (num & mask_arr[mask_bits]) >>> 0;
};

global.ip_to_dec = function (ip) {
	
	// a not-perfect regex for checking a valid ip address
	// It checks for (1) 4 numbers between 0 and 3 digits each separated by dots (IPv4)
	// or (2) 6 numbers between 0 and 3 digits each separated by dots (IPv6)
	var ip_regex = /^(\d{0,3}\.){3}.(\d{0,3})$|^(\d{0,3}\.){5}.(\d{0,3})$/;
	var valid = ip_regex.test(ip);
	if (!valid) {
		return 0;
	};
	var dots = ip.split('.');
	// make sure each value is between 0 and 255
	for (var i = 0; i < dots.length; i++) {
		var dot = dots[i];
		if (dot > 255 || dot < 0) {
			return 0;
		};
	};
	if (dots.length == 4) {
		// IPv4
		return ((((((+dots[0])*256)+(+dots[1]))*256)+(+dots[2]))*256)+(+dots[3]) >>> 0;
		} else if (dots.length == 6) {
		// IPv6
		return ((((((((+dots[0])*256)+(+dots[1]))*256)+(+dots[2]))*256)+(+dots[3])*256)+(+dots[4])*256)+(+dots[5]) >>> 0;
	};
	return 0;
};

global.uint32_to_hex = function (num) {
	
	var num_hex = '00000000' + num.toString(16);
	num_hex = num_hex.substring(num_hex.length - 8);	
	return num_hex;
};

global.hex_to_uint32 = function (hex_num) {
	
	return parseInt(hex_num, 16);
};

global.ip_to_hex = function (ip) {
	
	const ip_dec = ip_to_dec(ip);
	return uint32_to_hex(ip_dec);
};

global.str_hash = function (str, mask_bits) {
	
	var hash = 5381;
	var i = str.length;

	while(i) {
		hash = (hash * 33) ^ str.charCodeAt(--i);
	};
	const hash_32 = hash >>> 0;
	const hash_32_masked = uint32_mask(hash_32, mask_bits);
	return hash_32_masked.toString(16).toUpperCase();
};

global.vpn_conn_ns = function (cfg, conn_id) {
	
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_cfg = cfg.conns[conn_id];
	
	const conn_ns = `${vpn_cfg.vpn_gw_ip}:${conn_cfg.remote_tunnel_endpoint_ip}[v-${conn_cfg.local_subnet}@${conn_cfg.lan_port}:${conn_cfg.remote_subnet}@${conn_cfg.tunnel_port}]`;
	return conn_ns.replace(/\//g, '#');
};

global.vpn_conn_hash = function (cfg, conn_id) {
	
	const conn_ns = vpn_conn_ns(cfg, conn_id);
	
	return str_hash(`${conn_ns}`, 24);
};

global.vpn_conn_tag_hex = function (cfg, conn_id) {
	
	const hash_str = vpn_conn_hash(cfg, conn_id);
	
	return `${hash_str.substring(4, 6)}`;
};

global.vpn_conn_tag = function (cfg, conn_id) {
	
	const conn_tag_hex = vpn_conn_tag_hex(cfg, conn_id);
	
	return hex_to_uint32(conn_tag_hex);
};

global.vpn_conn_mac = function (cfg, conn_id) {
	
	const conn_tag_hex = vpn_conn_tag_hex(cfg, conn_id);
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cfg.conns[conn_id];
	
	return `CC:D3:9D:D1:${conn_tag_hex}:${nic_id}${conn_cfg.tunnel_port - 100}`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


global.mea_port_macs = [
	{
		24: `CC:D3:9D:D0:00:A4`,
		27: `CC:D3:9D:D0:00:A7`,
		104: `CC:D3:9D:D0:00:04`,
		105: `CC:D3:9D:D0:00:05`,
		106: `CC:D3:9D:D0:00:06`,
		107: `CC:D3:9D:D0:00:07`
	},
	{
		24: `CC:D3:9D:D0:00:B4`,
		27: `CC:D3:9D:D0:00:B7`,
		104: `CC:D3:9D:D0:00:14`,
		105: `CC:D3:9D:D0:00:15`,
		106: `CC:D3:9D:D0:00:16`,
		107: `CC:D3:9D:D0:00:17`
	}
];

global.mea_cli = function (nic_id) {
	
	if(nic_id > 0) {
		return `meaCli -card ${nic_id} mea`;
	}
	else {
		return `meaCli mea`;
	};
};

global.mea_cli_top = function (nic_id) {
	
	if(nic_id > 0) {
		return `meaCli -card ${nic_id} top`;
	}
	else {
		return `meaCli top`;
	};
};

global.mea_service_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} service set create`;
};

global.mea_action_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} action set create`;
};

global.mea_forwarder_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} forwarder add`;
};

global.mea_ipsec_profile_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} IPSec ESP set create`;
};
	
global.mea_init_expr = function (cfg) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const mea_top = mea_cli_top(nic_id);
	const mea_cmd = mea_cli(nic_id);
	
	var expr = `${mea_top}\n`;
	expr += `${mea_cmd} port ingress set all -a 1 -c 0\n`;
	expr += `${mea_cmd} port egress set all -a 1 -c 1\n`;
	expr += `${mea_cmd} IPSec global set ttl 40\n`;
	expr += `${mea_cmd} forwarder delete all\n`;
	expr += `${mea_cmd} action set delete all\n`;
	expr += `${mea_cmd} service set delete all\n`;
	expr += `${mea_cmd} IPSec ESP set delete all\n`;
	return expr;
};

global.mea_ipsec_add_parse = function (conn_state, profile_key, prev_output) {
	
	var ipsec_profile_regex = /Done\s+create\s+IPSecESP\s+with\s+Id\s+=\s+(\d+)/;
	prev_output.replace(ipsec_profile_regex, function(match, profile_id) {
		
		if (profile_id) {
			conn_state.profiles[profile_key] = parseInt(profile_id, 10);
		};
	});
};

global.mea_action_add_parse = function (conn_state, action_key, prev_output) {
	
	var action_regex = /Done.\s+ActionId=(\d+)\s+\(PmId=([YESNO]+)\/([^,]+),tmId=[YESNO]+\/[^,]+,edId=[YESNO]+\/[^,]+\)/;
	prev_output.replace(action_regex, function(match, action_id, pm_flag, pm_id) {
		
		if(action_id) {
			conn_state.actions[action_key] = parseInt(action_id, 10);
			if (pm_flag && (pm_flag === `YES`) && pm_id) {
				conn_state.pms[action_key] = parseInt(pm_id, 10);
			};
		};
	});
};

global.mea_service_add_parse = function (conn_state, service_key, prev_output) {
	
	var action_regex = /Done.\s+External\s+serviceId=(\d+)\s+Port=\d+\s+\(PmId=(\d+)\s+TmId=\d+\s+EdId=\d+\s+pol_prof_id=\d+\)/;
	prev_output.replace(action_regex, function(match, service_id, pm_id) {
		
		if(service_id) {
			conn_state.services[service_key] = parseInt(service_id, 10);
			if (pm_id) {
				conn_state.pms[service_key] = parseInt(pm_id, 10);
			};
		};
	});
};

global.mea_forwarder_add_parse = function (conn_state, forwarder_key, forwarder_str, prev_output) {
	
	if(prev_output === ``) {
		conn_state.forwarders[forwarder_key] = forwarder_str;
	};
};

global.mea_ports_init_expr = function (cfg) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const mea_top = mea_cli_top(nic_id);
	const service_add = mea_service_add(nic_id);
	const port_macs = mea_port_macs[nic_id];
	
	var expr = `${mea_top}\n`;
	expr += `${service_add} 24 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 0 -ra 0 -l2Type 0 -v 24 -p 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[24]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 104 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 104 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[104]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 105 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 105 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[105]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 106 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 106 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[106]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 107 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 107 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[107]} 00:00:00:00:00:00 0000 -hType 0\n`;
	return expr;
};

global.mea_ipsec_inbound_fwd_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const mea_top = mea_cli_top(nic_id);
	const action_add = mea_action_add(nic_id);
	const forwarder_add = mea_forwarder_add(nic_id);
	const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state.id);
	const next_hops_count = cmd.state.fwd.next_hops.length;
	const actions_count = Object.keys(cmd.state.fwd.actions).length;
	
	var expr = `${mea_top}\n`;
	if(actions_count < next_hops_count) {
		const next_hop_idx = actions_count;
		const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
		if(cmd.state.fwd.actions[next_hop.ip] = -1) {
			expr += `${action_add} -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${next_hop.mac} ${cmd.state.tunnel.local_tunnel_mac} 0000 -hType 3\n`;
		}
		else if(cmd.state.fwd.forwarders[next_hop.ip] === ``) {
			expr += `${forwarder_add} 6 ${next_hop.ip} 0 0x1${conn_tag_hex} 3 1 0 1 ${conn_cfg.lan_port} -action 1 ${cmd.state.fwd.actions[next_hop.ip]}\n`;
		};
	};
	return expr;
};

global.mea_ipsec_inbound_fwd_add_parse = function (cmd) {

	console.log(`cmd.output_processor[${cmd.key}]: ${JSON.stringify(cmd.output_processor[cmd.key], null, 2)}`);
	const next_hops_count = cmd.state.fwd.next_hops.length;
	const actions_count = Object.keys(cmd.state.fwd.actions).length;
	const forwarders_count = Object.keys(cmd.state.fwd.forwarders).length;
	const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state.id);
	
	if(forwarders_count < next_hops_count) {
		const next_hop_idx = actions_count;
		const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
		if(cmd.state.fwd.actions[next_hop.ip] === undefined) {
			cmd.state.fwd.actions[next_hop.ip] = -1;
			cmd.output_processor[cmd.key] = {};
			return true;
		}
		else if(cmd.state.fwd.actions[next_hop.ip] === -1) {
			cmd.state.fwd.forwarders[next_hop.ip] = ``;
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			mea_action_add_parse(cmd.state.fwd, `${next_hop.ip}`, prev_output);
			return true;
		}
		else if(cmd.state.fwd.forwarders[next_hop.ip] === ``) {
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			mea_forwarder_add_parse(cmd.state, `${next_hop.ip}`, `6 ${next_hop.ip} 0 0x1${conn_tag_hex}`, prev_output);
			return false;
		};
	}
	else {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		return false;
	};
};

global.mea_ipsec_inbound_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const mea_top = mea_cli_top(nic_id);
	const ipsec_add = mea_ipsec_profile_add(nic_id);
	const service_add = mea_service_add(nic_id);
	const remote_ip_hex = ip_to_hex(conn_cfg.remote_tunnel_endpoint_ip);
	const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state.id);
	const conn_tag = vpn_conn_tag(cmd.cfg, cmd.state.id);
	const port_macs = mea_port_macs[nic_id];
	
	var expr = `${mea_top}\n`;
	if(cmd.state.services.in_l3fwd === undefined) {
		const security_type = mea_ipsec_format_security_type(cmd.state.ipsec.auth_algo, cmd.state.ipsec.cipher_algo);
		const tunnel_keys = mea_ipsec_format_keys(cmd.state.ipsec.auth_key, cmd.state.ipsec.cipher_key);
		const tunnel_keys_str = `-Integrity_key ${tunnel_keys.integrity_key} -Integrity_IV ${tunnel_keys.integrity_iv} -Confident_key ${tunnel_keys.confidentiality_key} -Confident_IV ${tunnel_keys.confidentiality_iv}`;

		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${cmd.state.ipsec.spi} ${tunnel_keys_str}\n`;
		expr += `${service_add} 27 FF1${conn_tag_hex} FF1${conn_tag_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 6 -v ${conn_tag} -l4port_mask 1 -ra 0 -l2Type 1 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[27]} 00:00:00:00:00:00 0000 -hType 0\n`;
	}
	else {
		expr += `${service_add} ${conn_cfg.tunnel_port} ${remote_ip_hex} ${remote_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 27 -ra 0 -inf 1 0x${uint32_to_hex(cmd.state.ipsec.spi)} -l2Type 0 -subType 19 -h 810001${conn_tag_hex} 0 0 0 -hType 1 -hESP 2 ${cmd.state.profiles.inbound_profile_id} -lmid 1 0 1 0 -r ${port_macs[104]} 00:00:00:00:00:00 0000\n`;
	};
	return expr;
};

global.mea_ipsec_inbound_add_parse = function (cmd) {

	if(cmd.state.actions === undefined) {
		cmd.state.actions = {};
		cmd.state.services = {};
		cmd.state.profiles = {};
		cmd.state.forwarders = {};
		cmd.state.pms = {};
		cmd.output_processor[cmd.key] = {};
		return true;
	}
	else if(cmd.state.services.in_l3fwd === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		mea_ipsec_add_parse(cmd.state, `inbound_profile_id`, prev_output);
		mea_service_add_parse(cmd.state, `in_l3fwd`, prev_output);
		return true;
	}
	else if(cmd.state.services.in_decrypt === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		mea_service_add_parse(cmd.state, `in_decrypt`, prev_output);
		return false;
	};
};

global.mea_ipsec_outbound_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const mea_top = mea_cli_top(nic_id);
	const action_add = mea_action_add(nic_id);
	const forwarder_add = mea_forwarder_add(nic_id);
	const ipsec_add = mea_ipsec_profile_add(nic_id);
	
	var expr = `${mea_top}\n`;
	if(cmd.state.actions.out_l3fwd === undefined) {
		const security_type = mea_ipsec_format_security_type(cmd.state[`ipsec`][`auth_algo`], cmd.state[`ipsec`][`cipher_algo`]);
		const tunnel_keys = mea_ipsec_format_keys(cmd.state[`ipsec`][`auth_key`], cmd.state[`ipsec`][`cipher_key`]);
		const tunnel_keys_str = `-Integrity_key ${tunnel_keys.integrity_key} -Integrity_IV ${tunnel_keys.integrity_iv} -Confident_key ${tunnel_keys.confidentiality_key} -Confident_IV ${tunnel_keys.confidentiality_iv}`;
		
		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${cmd.state.ipsec.spi} ${tunnel_keys_str}\n`;
		expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${cmd.state.tunnel.remote_tunnel_mac} ${cmd.state.tunnel.local_tunnel_mac} 0000\n`;
	}
	else if(cmd.state.actions.out_encrypt === undefined) {
		const vpn_cfg = cmd.cfg.vpn_gw_config[0];
		
		expr += `${action_add} -pm 1 0 -ed 1 0 -hIPSec 1 1 ${vpn_cfg.vpn_gw_ip} ${conn_cfg.remote_tunnel_endpoint_ip} -hESP 1 ${cmd.state.profiles.outbound_profile_id} -hType 71\n`;
	}
	else {
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.remote_tunnel_mac} 24 3 1 0 1 ${conn_cfg.tunnel_port} -action 1 ${cmd.state.actions.out_encrypt}\n`;
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.local_tunnel_mac} ${conn_cfg.lan_port} 3 1 0 1 24 -action 1 ${cmd.state.actions.out_l3fwd}\n`;
	};
	return expr;
};

global.mea_ipsec_outbound_add_parse = function (cmd) {

	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	
	if(cmd.state.actions === undefined) {
		cmd.state.actions = {};
		cmd.state.services = {};
		cmd.state.profiles = {};
		cmd.state.forwarders = {};
		cmd.state.pms = {};
		cmd.output_processor[cmd.key] = {};
		return true;
	}
	else if(cmd.state.actions.out_l3fwd === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		mea_ipsec_add_parse(cmd.state, `outbound_profile_id`, prev_output);
		mea_action_add_parse(cmd.state, `out_l3fwd`, prev_output);
		return true;
	}
	else if(cmd.state.actions.out_encrypt === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		mea_action_add_parse(cmd.state, `out_encrypt`, prev_output);
		return true;
	}
	else {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		mea_forwarder_add_parse(cmd.state, `out_encrypt`, `0 ${cmd.state.tunnel.remote_tunnel_mac} 24`, prev_output);
		mea_forwarder_add_parse(cmd.state, `out_l3fwd`, `0 ${cmd.state.tunnel.local_tunnel_mac} ${conn_cfg.lan_port}`, prev_output);
		return false;
	};
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mea_expr_init = function (cmd) {

	return mea_init_expr(cmd.cfg) + mea_ports_init_expr(cmd.cfg);
};

global.mea_expr_inbound_fwd_add = function (cmd) {

	if(mea_ipsec_inbound_fwd_add_parse(cmd)) {
		return mea_ipsec_inbound_fwd_add_expr(cmd);
	};
	return `exit`;
};

global.mea_expr_inbound_tunnel_add = function (cmd) {

	if(mea_ipsec_inbound_add_parse(cmd)) {
		return mea_ipsec_inbound_add_expr(cmd);
	};
	return `exit`;
};

global.mea_expr_outbound_tunnel_add = function (cmd) {

	if(mea_ipsec_outbound_add_parse(cmd)) {
		return mea_ipsec_outbound_add_expr(cmd);
	};
	return `exit`;
};

