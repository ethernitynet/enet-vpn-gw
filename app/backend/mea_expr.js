
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

global.enet_mac_pfx = `CC:D3:9D:D`;
global.ipsec_debug = false;

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mea_host_port = 127;
global.mea_cipher_port = 104;
global.mea_lan_ports = [ 105, 106 ];
global.mea_tunnel_port = 107;

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

global.vpn_conn_tag_base = function (conn_id) {
	
	return (64 + conn_id);
};

global.vpn_conn_tag_hex_base = function (conn_id) {
	
	const conn_tag = vpn_conn_tag_base(conn_id);
	const conn_tag_hex = uint32_to_hex(conn_tag);
	
	return conn_tag_hex.substring(conn_tag_hex.length - 2);
};

global.vpn_conn_mac_base = function (nic_id, conn_id, tunnel_port) {
	
	const conn_tag_hex = vpn_conn_tag_hex_base(conn_id);
	
	return `${enet_mac_pfx}1:${conn_tag_hex}:${nic_id}${tunnel_port - 100}`;
};

global.vpn_conn_tag = function (cfg, conn_state) {
	
	return vpn_conn_tag_base(conn_state.id);
};

global.vpn_conn_tag_hex = function (cfg, conn_state) {
	
	return vpn_conn_tag_hex_base(conn_state.id);
};

global.vpn_conn_mac = function (cfg, conn_state) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cfg.conns[conn_state.id];
	
	return vpn_conn_mac_base(nic_id, conn_state.id, conn_cfg.tunnel_port);
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.hexc = [ `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `A`, `B`, `C`, `D`, `E`, `F` ];

global.mea_port_macs = function (nic_id) {
	
	const port_macs = {
		24: `${enet_mac_pfx}0:00:${hexc[10 + nic_id]}4`,
		27: `${enet_mac_pfx}0:00:${hexc[10 + nic_id]}7`,
		104: `${enet_mac_pfx}0:00:04`,
		105: `${enet_mac_pfx}0:00:05`,
		106: `${enet_mac_pfx}0:00:06`,
		107: `${enet_mac_pfx}0:00:07`
	};
	return port_macs;
};

global.mea_cli = function (nic_id) {
	
	const lockfile = `/var/lock/mea_cli_lockfile`;
	const lock_timeout = 10;
	
	if(nic_id > 0) {
		return `flock -o -x -w ${lock_timeout} ${lockfile} meaCli -card ${nic_id} mea`;
	}
	else {
		return `flock -o -x -w ${lock_timeout} ${lockfile} meaCli mea`;
	};
};

global.mea_cli_top = function (nic_id) {
	
	const lockfile = `/var/lock/mea_cli_lockfile`;
	const lock_timeout = 10;
	
	if(nic_id > 0) {
		return `flock -o -x -w ${lock_timeout} ${lockfile} meaCli -card ${nic_id} top`;
	}
	else {
		return `flock -o -x -w ${lock_timeout} ${lockfile} meaCli top`;
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

global.mea_shaper_add = function (nic_id, port, port_hex) {
	
	const mea_top = mea_cli_top(nic_id);
	const mea_cmd = mea_cli(nic_id);
	
	var expr = `${mea_top}\n`;
	expr += `${mea_cmd} deb mod if_write_ind 100 20 3 ${port_hex} 10 1dc0000\n`;
	expr += `${mea_cmd} port egress set ${port} -s 1 9500000000 64 1 1 0 0 -shaper_mode 0\n`;
	expr += `${mea_cmd} queue priqueue set ${port} 0 -mp 512\n`;
	return expr;
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
	
	var result = false;
	var ipsec_profile_regex = /Done\s+create\s+IPSecESP\s+with\s+Id\s+=\s+(\d+)/;
	prev_output.replace(ipsec_profile_regex, function(match, profile_id) {
		
		if (profile_id) {
			conn_state.profiles[profile_key] = parseInt(profile_id, 10);
			result = true;
		};
	});
	return result;
};

global.mea_action_add_parse = function (conn_state, action_key, prev_output) {
	
	var result = false;
	var action_regex = /Done.\s+ActionId=(\d+)\s+\(PmId=([YESNO]+)\/([^,]+),tmId=[YESNO]+\/[^,]+,edId=[YESNO]+\/[^,]+\)/;
	prev_output.replace(action_regex, function(match, action_id, pm_flag, pm_id) {
		
		if(action_id) {
			conn_state.actions[action_key] = parseInt(action_id, 10);
			if (pm_flag && (pm_flag === `YES`) && pm_id) {
				conn_state.pms[action_key] = parseInt(pm_id, 10);
			};
			result = true;
		};
	});
	return result;
};

global.mea_service_add_parse = function (conn_state, service_key, prev_output) {
	
	var result = false;
	var action_regex = /Done.\s+External\s+serviceId=(\d+)\s+Port=\d+\s+\(PmId=(\d+)\s+TmId=\d+\s+EdId=\d+\s+pol_prof_id=\d+\)/;
	prev_output.replace(action_regex, function(match, service_id, pm_id) {
		
		if(service_id) {
			conn_state.services[service_key] = parseInt(service_id, 10);
			if (pm_id) {
				conn_state.pms[service_key] = parseInt(pm_id, 10);
			};
		};
		result = true;
	});
	return result;
};

global.mea_forwarder_add_parse = function (conn_state, forwarder_key, forwarder_str, prev_output) {
	
	var result = false;
	console.log(`mea_forwarder_add_parse(${forwarder_str}) <= ${prev_output}`);	
	if(prev_output === ``) {
		conn_state.forwarders[forwarder_key] = forwarder_str;
		result = true;
	};
	return result;
};

var mea_rmon_parse_pkts = function(rmon_line) {
	
	return rmon_line.replace(/\s*(\d+)\s+Total\s+Pkts\s+(\d+)\s+(\d+)/, `"rmon$1":{"PktsRX":$2,"PktsTX":$3,`);
};

var mea_rmon_parse_bytes = function(rmon_line) {
	
	return rmon_line.replace(/\s*Total\s+Bytes\s+(\d+)\s+(\d+)/, `"BytesRX":$1,"BytesTX":$2,`);
};

var mea_rmon_parse_crc_errors = function(rmon_line) {
	
	return rmon_line.replace(/\s*CRC\s+Error\s+Pkts\s+(\d+)\s+(\d+)/, `"CRCErrorPktsRX":$1,"CRCErrorPktsTX":$2,`);
};

var mea_rmon_parse_mac_drops = function(rmon_line) {
	
	return rmon_line.replace(/\s*Rx\s+Mac\s+Drop\s+Pkts\s+(\d+)/, `"RxMacDropPktsRX":$1}`);
};

var influxdb_send = function (db_ip, db_port, db_name, msg) {
	
/////////
const influxdb_url = `http://${db_ip}:${db_port}/write?db=${db_name}`;
//console.log(influxdb_url);
http_request({
		url: influxdb_url,
		encoding: null,
		method: 'POST',
		body: msg
	}, (error, response, body) => {
		if (error) {
			++influxdb_error_count;
			console.log(`====  ${JSON.stringify(error)}  ====`);
			if(response != undefined) {
				console.log(`====  ${response.json({name : error})}  ====`);
			};
		} else {
			++influxdb_success_count;
			//console.log(`====  SUCCESS  ====`);
		};
	});
/////////
};

var mea_influxdb_update_rmon = function (db_ip, db_port, db_name, rmons_container, port) {
	
	const port_key = `rmon${port}`;
	if(rmons_container[port_key] != undefined) {
		var rx_str = `${port_key},direction=rx PktsRX=${rmons_container[port_key].PktsRX},BytesRX=${rmons_container[port_key].BytesRX},CRCErrorPktsRX=${rmons_container[port_key].CRCErrorPktsRX},RxMacDropPktsRX=${rmons_container[port_key].RxMacDropPktsRX} ${rmons_container.timestamp + port}`
		var tx_str = `${port_key},direction=tx PktsTX=${rmons_container[port_key].PktsTX},BytesTX=${rmons_container[port_key].BytesTX},CRCErrorPktsTX=${rmons_container[port_key].CRCErrorPktsTX}`
		console.log(`${db_name}@${db_ip}:${db_port} <= ${rx_str}`);
		console.log(`${db_name}@${db_ip}:${db_port} <= ${tx_str}`);
		influxdb_send(db_ip, db_port, db_name, rx_str);
		influxdb_send(db_ip, db_port, db_name, tx_str);
	};
};

var mea_rmons_parse = function (stats_state, prev_output) {
	
	const rmon_arr = prev_output.split(/\r?\n/);
	var rmons_container ={};
	var rmons_container_str = `{`;
	var ports_count = 0;
	for(var line_idx = 2; line_idx < rmon_arr.length; line_idx += 5) {
		//console.log(`${rmon_arr.length} ${line_idx}`);
		rmons_container_str += mea_rmon_parse_pkts(rmon_arr[line_idx]);
		rmons_container_str += mea_rmon_parse_bytes(rmon_arr[line_idx + 1]);
		rmons_container_str += mea_rmon_parse_crc_errors(rmon_arr[line_idx + 2]);
		rmons_container_str += mea_rmon_parse_mac_drops(rmon_arr[line_idx + 3]);
		++ports_count;
		if(ports_count >= 5) {
			rmons_container_str += `,"timestamp":${rmon_arr[rmon_arr.length - 1]}`;
			rmons_container_str += `}`;
			rmons_container = JSON.parse(rmons_container_str);
			break;
		}
		else {
			rmons_container_str += `,`;
		};
	};
	
	//console.log(JSON.stringify(rmons_container, null, 2));
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon104`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon105`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon106`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon107`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon127`);
	console.log(`${Date.now()}> influxdb_success_count: ${stats_state.influxdb_success_count} influxdb_error_count: ${stats_state.influxdb_error_count}`);
};

global.mea_ports_init_expr = function (cfg) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const vpn_cfg = cfg.vpn_gw_config[0];
	const mea_top = mea_cli_top(nic_id);
	const service_add = mea_service_add(nic_id);
	const port_macs = mea_port_macs(nic_id);
	
	var expr = `${mea_top}\n`;
	expr += `${mea_cli(nic_id)} interface config set ${mea_cipher_port} -lb 7\n`;
	expr += `${service_add} ${mea_cipher_port} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${mea_cipher_port} -p 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cli(nic_id)} interface config set ${mea_tunnel_port} -lb 0\n`;
	expr += `${mea_cli(nic_id)} interface config set ${mea_lan_ports[0]} -lb 0\n`;
	expr += `${mea_cli(nic_id)} interface config set ${mea_lan_ports[1]} -lb 0\n`;
	//expr += `${service_add} ${mea_tunnel_port} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${mea_tunnel_port} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_tunnel_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} ${mea_lan_ports[0]} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${mea_lan_ports[0]} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_lan_ports[0]]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} ${mea_lan_ports[1]} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${mea_lan_ports[1]} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_lan_ports[1]]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cli(nic_id)} port egress set ${mea_cipher_port} -s 1 8000000000 64 1 1 0 0\n`;
	expr += `${mea_cli(nic_id)} IPSec global set my_Ipsec_Ipv4 ${vpn_cfg.vpn_gw_ip}\n`;
	expr += mea_shaper_add(nic_id, 104, `68`);
	expr += mea_shaper_add(nic_id, 105, `69`);
	expr += mea_shaper_add(nic_id, 106, `6A`);
	expr += mea_shaper_add(nic_id, 107, `6B`);
	return expr;
};

global.mea_stats_get_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const mea_top = mea_cli_top(nic_id);
	
	console.log(`mea_stats_get_expr() nic_id: ${nic_id}`);
	var expr = `${mea_top}\n`;
	switch(cmd.state.stats.phase) {
		case `stats_get`:
		expr += `${mea_cli(nic_id)} counters rmon collect 104:127\n`;
		expr += `${mea_cli(nic_id)} counters rmon show 104:127\n`;
		expr += `date +%s%N\n`;
		cmd.state.stats.phase = `stats_parse`;
		break;
	};
	return expr;
};

global.mea_stats_output_parse = function (cmd) {

	console.log(`cmd.output_processor[${cmd.key}]: ${JSON.stringify(cmd.output_processor[cmd.key], null, 2)}`);

	console.log(`mea_stats_output_parse(phase:${cmd.state.stats.phase})`);	
	switch(cmd.state.stats.phase) {
		
		case `stats_get`:
		cmd.output_processor[cmd.key] = {};
		return `stats_get`;
		break;
		
		case `stats_parse`:
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		const result = mea_rmons_parse(cmd.state, prev_output);
		return `done`;
		break;
	};
};

global.mea_ipsec_inbound_fwd_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const mea_top = mea_cli_top(nic_id);
	const action_add = mea_action_add(nic_id);
	const forwarder_add = mea_forwarder_add(nic_id);
	const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state);
	const next_hops_count = cmd.state.fwd.next_hops.length;
	const actions_count = Object.keys(cmd.state.fwd.actions).length;
	const forwarders_count = Object.keys(cmd.state.fwd.forwarders).length;
	
	console.log(`mea_ipsec_inbound_fwd_add_expr() next_hops_count: ${next_hops_count} actions_count: ${actions_count} forwarders_count: ${forwarders_count}`);
	var expr = `${mea_top}\n`;
	switch(cmd.state.fwd.phase) {
		case `action_add`:
		if(actions_count < next_hops_count) {
			const next_hop_idx = actions_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			console.log(`mea_ipsec_inbound_fwd_add_expr() cmd.state.fwd.actions[${next_hop.ip}]: ${cmd.state.fwd.actions[next_hop.ip]}`);
			expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${next_hop.mac} ${cmd.state.tunnel.local_tunnel_mac} 0000 -hType 3\n`;
			cmd.state.fwd.phase = `action_parse`;
		}
		else {
			cmd.state.fwd.phase = `done`;
		};
		break;
		case `forwarder_add`:
		if(forwarders_count < next_hops_count) {
			const next_hop_idx = forwarders_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			console.log(`mea_ipsec_inbound_fwd_add_expr() cmd.state.fwd.actions[${next_hop.ip}]: ${cmd.state.fwd.forwarders[next_hop.ip]}`);
			expr += `${forwarder_add} 6 ${next_hop.ip} 0 0x1${conn_tag_hex} 3 1 0 1 ${cmd.state.fwd.lan_port} -action 1 ${cmd.state.fwd.actions[next_hop.ip]}\n`;
			cmd.state.fwd.phase = `forwarder_parse`;
		}
		else {
			cmd.state.fwd.phase = `done`;
		};
		break;
	};
	return expr;
};

global.mea_ipsec_inbound_fwd_add_parse = function (cmd) {

	console.log(`cmd.output_processor[${cmd.key}]: ${JSON.stringify(cmd.output_processor[cmd.key], null, 2)}`);
	const next_hops_count = cmd.state.fwd.next_hops.length;
	const actions_count = Object.keys(cmd.state.fwd.actions).length;
	const forwarders_count = Object.keys(cmd.state.fwd.forwarders).length;

	console.log(`mea_ipsec_inbound_fwd_add_parse(phase:${cmd.state.fwd.phase}) next_hops_count: ${next_hops_count} actions_count: ${actions_count} forwarders_count: ${forwarders_count}`);	
	switch(cmd.state.fwd.phase) {
		
		case `action_add`:
		if(actions_count < next_hops_count) {
			const next_hop_idx = actions_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			cmd.output_processor[cmd.key] = {};
			return `action_add`;
		}
		else {
			return `done`;
		};
		break;
		
		case `action_parse`:
		if(actions_count < next_hops_count) {
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			const next_hop_idx = actions_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			const result = mea_action_add_parse(cmd.state.fwd, `${next_hop.ip}`, prev_output);
			return `forwarder_add`;
		}
		else {
			return `done`;
		};
		break;
		
		case `forwarder_parse`:
		if(forwarders_count < next_hops_count) {
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			const next_hop_idx = forwarders_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state);
			const result = mea_forwarder_add_parse(cmd.state.fwd, `${next_hop.ip}`, `6 ${next_hop.ip} 0 0x1${conn_tag_hex}`, prev_output);
			return `action_add`;
		}
		else {
			return `done`;
		};
		break;
	};
};

global.mea_ipsec_inbound_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const mea_top = mea_cli_top(nic_id);
	const ipsec_add = mea_ipsec_profile_add(nic_id);
	const service_add = mea_service_add(nic_id);
	const remote_ip_hex = ip_to_hex(conn_cfg.remote_tunnel_endpoint_ip);
	const conn_tag_hex = vpn_conn_tag_hex(cmd.cfg, cmd.state);
	const conn_tag = vpn_conn_tag(cmd.cfg, cmd.state);
	const port_macs = mea_port_macs(nic_id);
	
	var expr = `${mea_top}\n`;
	if(cmd.state.services.in_l3fwd === undefined) {
		const security_type = mea_ipsec_format_security_type(cmd.state.ipsec.auth_algo, cmd.state.ipsec.cipher_algo);
		const tunnel_keys = mea_ipsec_format_keys(cmd.state.ipsec.auth_key, cmd.state.ipsec.cipher_key);
		const tunnel_keys_str = `-Integrity_key ${tunnel_keys.integrity_key} -Integrity_IV ${tunnel_keys.integrity_iv} -Confident_key ${tunnel_keys.confidentiality_key} -Confident_IV ${tunnel_keys.confidentiality_iv}`;

		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${cmd.state.ipsec.spi} ${tunnel_keys_str}\n`;
		expr += `${service_add} ${mea_cipher_port} FF1${conn_tag_hex} FF1${conn_tag_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 6 -v ${256 + conn_tag} -l4port_mask 1 -ra 0 -l2Type 1 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	}
	else {
		if(ipsec_debug) {
			expr += `${service_add} ${conn_cfg.tunnel_port} FF000 FF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_cipher_port} -ra 0 -h 0 0 0 0 -hType 0 -l2Type 0\n`;
		}
		else {
			expr += `${service_add} ${conn_cfg.tunnel_port} ${remote_ip_hex} ${remote_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_cipher_port} -ra 0 -inf 1 0x${uint32_to_hex(cmd.state.ipsec.spi)} -l2Type 0 -subType 19 -h 810001${conn_tag_hex} 0 0 0 -hType 1 -hESP 2 ${cmd.state.profiles.inbound_profile_id} -lmid 1 0 1 0 -r ${port_macs[conn_cfg.tunnel_port]} 00:00:00:00:00:00 0000\n`;
		};
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
		
		if(ipsec_debug) {
			expr += `${action_add} -pm 1 0 -ed 1 0 -h 81000000 0 0 0 -hType 0\n`;
		}
		else {
			expr += `${action_add} -pm 1 0 -ed 1 0 -hIPSec 1 1 ${vpn_cfg.vpn_gw_ip} ${conn_cfg.remote_tunnel_endpoint_ip} -hESP 1 ${cmd.state.profiles.outbound_profile_id} -hType 71\n`;
		};
	}
	else {
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.local_tunnel_mac} ${conn_cfg.lan_port} 3 1 0 1 ${mea_cipher_port} -action 1 ${cmd.state.actions.out_encrypt}\n`;
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.local_tunnel_mac} ${mea_cipher_port} 3 1 0 1 ${conn_cfg.tunnel_port} -action 1 ${cmd.state.actions.out_l3fwd}\n`;
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
		mea_forwarder_add_parse(cmd.state, `out_encrypt`, `0 ${cmd.state.tunnel.remote_tunnel_mac} ${conn_cfg.lan_port}`, prev_output);
		mea_forwarder_add_parse(cmd.state, `out_l3fwd`, `0 ${cmd.state.tunnel.local_tunnel_mac} ${mea_cipher_port}`, prev_output);
		return false;
	};
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mea_expr_init = function (cmd) {

	return mea_init_expr(cmd.cfg) + mea_ports_init_expr(cmd.cfg);
};

global.mea_expr_stats_get = function (cmd) {

	if(mea_stats_output_parse(cmd)) {
		return mea_stats_get_expr(cmd);
	};
	cmd.state.UPDATE = `${new Date()}`;
	return `exit`;
};

global.mea_expr_inbound_fwd_add = function (cmd) {

	cmd.state.fwd.phase = mea_ipsec_inbound_fwd_add_parse(cmd);
	if(cmd.state.fwd.phase != `done`) {
		return mea_ipsec_inbound_fwd_add_expr(cmd);
	};
	cmd.state.fwd.UPDATE = `${new Date()}`;
	return `exit`;
};

global.mea_expr_inbound_tunnel_add = function (cmd) {

	if(mea_ipsec_inbound_add_parse(cmd)) {
		return mea_ipsec_inbound_add_expr(cmd);
	};
	cmd.state.UPDATE = `${new Date()}`;
	return `exit`;
};

global.mea_expr_outbound_tunnel_add = function (cmd) {

	if(mea_ipsec_outbound_add_parse(cmd)) {
		return mea_ipsec_outbound_add_expr(cmd);
	};
	cmd.state.UPDATE = `${new Date()}`;
	return `exit`;
};

