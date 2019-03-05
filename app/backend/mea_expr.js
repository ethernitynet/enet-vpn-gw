
var http_request = require('request');
var vpn_common = require('./vpn_common.js');


/////////////////////////////////////////////////
///////////////////// init //////////////////////

var mea_shaper_add = function (nic_id, port, port_hex) {
	
	const mea_cmd = vpn_common.mea_cli(nic_id);
	
	var expr = ``;
	expr += `${mea_cmd} deb mod if_write_ind 100 20 3 ${port_hex} 10 1dc0000\n`;
	expr += `${mea_cmd} port egress set ${port} -s 1 9500000000 64 1 1 0 0 -shaper_mode 0\n`;
	expr += `${mea_cmd} queue priqueue set ${port} 0 -mp 512\n`;
	return expr;
};
	
var mea_init_expr = function (cfg) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const mea_cmd = vpn_common.mea_cli(nic_id);
	
	var expr = ``;
	expr += `${mea_cmd} port ingress set all -a 1 -c 0\n`;
	expr += `${mea_cmd} port egress set all -a 1 -c 1\n`;
	expr += `${mea_cmd} IPSec global set ttl 40\n`;
	expr += `${mea_cmd} forwarder delete all\n`;
	expr += `${mea_cmd} action set delete all\n`;
	expr += `${mea_cmd} service set delete all\n`;
	expr += `${mea_cmd} IPSec ESP set delete all\n`;
	return expr;
};

var mea_ports_init_expr = function (cfg) {
	
	var expr = ``;
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const vpn_cfg = cfg.vpn_gw_config[0];
	const service_add = vpn_common.mea_service_add(nic_id);
	const port_macs = vpn_common.mea_port_macs(nic_id);
	const mea_cmd = vpn_common.mea_cli(nic_id);
	
	expr += `${mea_cmd} interface config set ${vpn_common.mea_cipher_port} -lb 7\n`;
	expr += `${service_add} ${vpn_common.mea_cipher_port} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${vpn_common.mea_cipher_port} -p 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} interface config set ${vpn_common.mea_tunnel_port} -lb 0\n`;
	expr += `${mea_cmd} interface config set ${vpn_common.mea_lan_ports[0]} -lb 0\n`;
	expr += `${mea_cmd} interface config set ${vpn_common.mea_lan_ports[1]} -lb 0\n`;
	//expr += `${service_add} ${mea_tunnel_port} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${mea_tunnel_port} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[mea_tunnel_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} ${vpn_common.mea_lan_ports[0]} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${vpn_common.mea_lan_ports[0]} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_lan_ports[0]]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} ${vpn_common.mea_lan_ports[1]} FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 0 -ra 0 -l2Type 0 -v ${vpn_common.mea_lan_ports[1]} -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_lan_ports[1]]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} port egress set ${vpn_common.mea_cipher_port} -s 1 8000000000 64 1 1 0 0\n`;
	expr += `${mea_cmd} IPSec global set my_Ipsec_Ipv4 ${vpn_cfg.vpn_gw_ip}\n`;
	expr += mea_shaper_add(nic_id, 104, `68`);
	expr += mea_shaper_add(nic_id, 105, `69`);
	expr += mea_shaper_add(nic_id, 106, `6A`);
	expr += mea_shaper_add(nic_id, 107, `6B`);
	return expr;
};


/////////////////////////////////////////////////
////////////////// stats_get ////////////////////

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
			++vpn_common.influxdb_error_count;
			console.log(`====  ${JSON.stringify(error)}  ====`);
			if(response !== undefined) {
				console.log(`====  ${response.json({name : error})}  ====`);
			}
		} else {
			++vpn_common.influxdb_success_count;
			//console.log(`====  SUCCESS  ====`);
		}
	});
/////////
};

var mea_influxdb_update_rmon = function (db_ip, db_port, db_name, rmons_container, port) {
	
	const port_key = `rmon${port}`;
	if(rmons_container[port_key] !== undefined) {
		var rx_str = `${port_key},direction=rx PktsRX=${rmons_container[port_key].PktsRX},BytesRX=${rmons_container[port_key].BytesRX},CRCErrorPktsRX=${rmons_container[port_key].CRCErrorPktsRX},RxMacDropPktsRX=${rmons_container[port_key].RxMacDropPktsRX} ${rmons_container.timestamp + port}`;
		var tx_str = `${port_key},direction=tx PktsTX=${rmons_container[port_key].PktsTX},BytesTX=${rmons_container[port_key].BytesTX},CRCErrorPktsTX=${rmons_container[port_key].CRCErrorPktsTX}`;
		console.log(`${db_name}@${db_ip}:${db_port} <= ${rx_str}`);
		console.log(`${db_name}@${db_ip}:${db_port} <= ${tx_str}`);
		influxdb_send(db_ip, db_port, db_name, rx_str);
		influxdb_send(db_ip, db_port, db_name, tx_str);
	}
};

var mea_rmons_db_update = function (stats_state, prev_output) {
	
	const rmon_arr = prev_output.split(/\r?\n/);
	var rmons_container ={};
	var rmons_container_str = `{`;
	var ports_count = 0;
	for(var line_idx = 2; line_idx < rmon_arr.length; line_idx += 5) {
		//console.log(`${rmon_arr.length} ${line_idx}`);
		rmons_container_str += vpn_common.mea_rmon_parse_pkts(rmon_arr[line_idx]);
		rmons_container_str += vpn_common.mea_rmon_parse_bytes(rmon_arr[line_idx + 1]);
		rmons_container_str += vpn_common.mea_rmon_parse_crc_errors(rmon_arr[line_idx + 2]);
		rmons_container_str += vpn_common.mea_rmon_parse_mac_drops(rmon_arr[line_idx + 3]);
		++ports_count;
		if(ports_count >= 5) {
			rmons_container_str += `,"timestamp":${rmon_arr[rmon_arr.length - 1]}`;
			rmons_container_str += `}`;
			rmons_container = JSON.parse(rmons_container_str);
			break;
		}
		else {
			rmons_container_str += `,`;
		}
	}
	
	//console.log(JSON.stringify(rmons_container, null, 2));
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon104`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon105`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon106`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon107`);
	mea_influxdb_update_rmon(stats_state, rmons_container, `rmon127`);
	//console.log(`${Date.now()}> influxdb_success_count: ${stats_state.influxdb_success_count} influxdb_error_count: ${stats_state.influxdb_error_count}`);
};

var mea_stats_collect_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const mea_cmd = vpn_common.mea_cli(nic_id);
	
	var expr = ``;
	expr += `${mea_cmd} counters rmon collect 104:127\n`;
	expr += `${mea_cmd} counters rmon show 104:127\n`;
	expr += `date +%s%N\n`;
	return expr;
};


/////////////////////////////////////////////////
/////////////// inbound_fwd_add /////////////////

var mea_ipsec_inbound_fwd_action_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const action_add = vpn_common.mea_action_add(nic_id);
	
	var expr = ``;
	expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${cmd.next_hop.mac} ${cmd.state.tunnel.local_tunnel_mac} 0000 -hType 3\n`;
	cmd.state.fwd.next_hops.push(cmd.next_hop);
	return expr;
};

var mea_ipsec_inbound_fwd_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
	const conn_tag_hex = vpn_common.vpn_conn_tag_hex(cmd.cfg, cmd.state);
	
	var expr = ``;
	expr += `${forwarder_add} 6 ${cmd.next_hop.ip} 0 0x1${conn_tag_hex} 3 1 0 1 ${cmd.state.fwd.lan_port} -action 1 ${cmd.state.fwd.actions[cmd.next_hop.ip]}\n`;
	cmd.state.fwd.next_hops.push(cmd.next_hop);
	return expr;
};

var mea_ipsec_inbound_fwd_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const action_add = vpn_common.mea_action_add(nic_id);
	const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
	const conn_tag_hex = vpn_common.vpn_conn_tag_hex(cmd.cfg, cmd.state);
	const next_hops_count = cmd.state.fwd.next_hops.length;
	const actions_count = Object.keys(cmd.state.fwd.actions).length;
	const forwarders_count = Object.keys(cmd.state.fwd.forwarders).length;
	
	console.log(`mea_ipsec_inbound_fwd_add_expr() next_hops_count: ${next_hops_count} actions_count: ${actions_count} forwarders_count: ${forwarders_count}`);
	var expr = ``;
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
		}
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
		}
		break;
	}
	return expr;
};

var mea_ipsec_inbound_fwd_add_parse = function (cmd) {

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
		}
		break;
		
		case `action_parse`:
		if(actions_count < next_hops_count) {
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			const next_hop_idx = actions_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			const result = vpn_common.mea_action_add_parse(cmd.state.fwd, `${next_hop.ip}`, prev_output);
			return `forwarder_add`;
		}
		else {
			return `done`;
		}
		break;
		
		case `forwarder_parse`:
		if(forwarders_count < next_hops_count) {
			const prev_output = cmd.output_processor[cmd.key].stdout;
			cmd.output_processor[cmd.key] = {};
			const next_hop_idx = forwarders_count;
			const next_hop = cmd.state.fwd.next_hops[next_hop_idx];
			const conn_tag_hex = vpn_common.vpn_conn_tag_hex(cmd.cfg, cmd.state);
			const result = vpn_common.mea_forwarder_add_parse(cmd.state.fwd, `${next_hop.ip}`, `6 ${next_hop.ip} 0 0x1${conn_tag_hex}`, prev_output);
			return `action_add`;
		}
		else {
			return `done`;
		}
		break;
	}
};


/////////////////////////////////////////////////
////////////// inbound_tunnel_add ///////////////

var mea_ipsec_inbound_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
	const service_add = vpn_common.mea_service_add(nic_id);
	const remote_ip_hex = vpn_common.ip_to_hex(conn_cfg.remote_tunnel_endpoint_ip);
	const conn_tag_hex = vpn_common.vpn_conn_tag_hex(cmd.cfg, cmd.state);
	const conn_tag = vpn_common.vpn_conn_tag(cmd.cfg, cmd.state);
	const port_macs = vpn_common.mea_port_macs(nic_id);
	
	var expr = ``;
	if(cmd.state.services.in_l3fwd === undefined) {
		const security_type = vpn_common.mea_ipsec_format_security_type(cmd.state.ipsec.auth_algo, cmd.state.ipsec.cipher_algo);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(cmd.state.ipsec.auth_key, cmd.state.ipsec.cipher_key);
		const tunnel_keys_str = `-Integrity_key ${tunnel_keys.integrity_key} -Integrity_IV ${tunnel_keys.integrity_iv} -Confident_key ${tunnel_keys.confidentiality_key} -Confident_IV ${tunnel_keys.confidentiality_iv}`;

		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${cmd.state.ipsec.spi} ${tunnel_keys_str}\n`;
		expr += `${service_add} ${vpn_common.mea_cipher_port} FF1${conn_tag_hex} FF1${conn_tag_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 6 -v ${256 + conn_tag} -l4port_mask 1 -ra 0 -l2Type 1 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
	}
	else {
		//if(ipsec_debug) {
		//	expr += `${service_add} ${conn_cfg.tunnel_port} FF000 FF000 D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_cipher_port} -ra 0 -h 0 0 0 0 -hType 0 -l2Type 0\n`;
		//}
		//else {
			expr += `${service_add} ${conn_cfg.tunnel_port} ${remote_ip_hex} ${remote_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_cipher_port} -ra 0 -inf 1 0x${vpn_common.uint32_to_hex(cmd.state.ipsec.spi)} -l2Type 0 -subType 19 -h 810001${conn_tag_hex} 0 0 0 -hType 1 -hESP 2 ${cmd.state.profiles.inbound_profile_id} -lmid 1 0 1 0 -r ${port_macs[conn_cfg.tunnel_port]} 00:00:00:00:00:00 0000\n`;
		//}
	}
	return expr;
};

var mea_ipsec_inbound_add_parse = function (cmd) {

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
		vpn_common.mea_ipsec_add_parse(cmd.state, `inbound_profile_id`, prev_output);
		vpn_common.mea_service_add_parse(cmd.state, `in_l3fwd`, prev_output);
		return true;
	}
	else if(cmd.state.services.in_decrypt === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		vpn_common.mea_service_add_parse(cmd.state, `in_decrypt`, prev_output);
		return false;
	}
};


/////////////////////////////////////////////////
////////////// outbound_tunnel_add //////////////

/*
var mea_ipsec_outbound_add_expr = function (cmd) {
	
	const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cmd.cfg.conns[cmd.state.id];
	const action_add = vpn_common.mea_action_add(nic_id);
	const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
	const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
	
	var expr = ``;
	if(cmd.state.actions.out_l3fwd === undefined) {
		const security_type = vpn_common.mea_ipsec_format_security_type(cmd.state[`ipsec`][`auth_algo`], cmd.state[`ipsec`][`cipher_algo`]);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(cmd.state[`ipsec`][`auth_key`], cmd.state[`ipsec`][`cipher_key`]);
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
		}
	}
	else {
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.local_tunnel_mac} ${conn_cfg.lan_port} 3 1 0 1 ${vpn_common.mea_cipher_port} -action 1 ${cmd.state.actions.out_encrypt}\n`;
		expr += `${forwarder_add} 0 ${cmd.state.tunnel.local_tunnel_mac} ${vpn_common.mea_cipher_port} 3 1 0 1 ${conn_cfg.tunnel_port} -action 1 ${cmd.state.actions.out_l3fwd}\n`;
	}
	return expr;
};

var mea_ipsec_outbound_add_parse = function (cmd) {

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
		vpn_common.mea_ipsec_add_parse(cmd.state, `outbound_profile_id`, prev_output);
		vpn_common.mea_action_add_parse(cmd.state, `out_l3fwd`, prev_output);
		return true;
	}
	else if(cmd.state.actions.out_encrypt === undefined) {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		vpn_common.mea_action_add_parse(cmd.state, `out_encrypt`, prev_output);
		return true;
	}
	else {
		const prev_output = cmd.output_processor[cmd.key].stdout;
		cmd.output_processor[cmd.key] = {};
		vpn_common.mea_forwarder_add_parse(cmd.state, `out_encrypt`, `0 ${cmd.state.tunnel.remote_tunnel_mac} ${conn_cfg.lan_port}`, prev_output);
		vpn_common.mea_forwarder_add_parse(cmd.state, `out_l3fwd`, `0 ${cmd.state.tunnel.local_tunnel_mac} ${vpn_common.mea_cipher_port}`, prev_output);
		return false;
	}
};

*/

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function () {
	
	this.test_begin = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		output_processor.meta.matches_count = 0;
		var expr = ``;
		expr += `pwd\n`;
		expr += `hostname\n`;
		expr += `ls /nosuchdir\n`;
		expr += `whoami\n`;
		return expr;
	};
	
	this.test_parse = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		if(output_processor.output.length > 0) {
			var prev_stdout = output_processor.output[output_processor.output.length - 1].stdout;
			var test_regex = /(root)/;
			prev_stdout.replace(test_regex, function(match, match0, match1) {
				
				if(match0) {
					++output_processor.meta.matches_count;
				}
				if(match1) {
					++output_processor.meta.matches_count;
				}
			});
		}
	};
	
	this.test_end = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		var expr = ``;
		expr += `echo $$\n`;
		expr += `echo "test_parse() result: ${output_processor.matches_count}"\n`;
		expr += `hostname\n`;
		expr += `ls /anothermissingdir\n`;
		expr += `echo $PPID\n`;
		return expr;
	};
	
	this.stats_fetch = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += mea_stats_collect_expr(cmd);
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.stats_db_update = function (cmd) {
	
		mea_rmons_db_update(cmd.state, cmd.output_processor[cmd.key].output[0]);
	};
	
	this.inbound_fwd_add = function (cmd) {
	
		const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
		
		cmd.state.fwd.phase = mea_ipsec_inbound_fwd_add_parse(cmd);
		if(cmd.state.fwd.phase !== `done`) {
			var expr = ``;
			expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
			expr += mea_ipsec_inbound_fwd_add_expr(cmd);
			expr += `${vpn_common.mea_cli_suffix()}\n`;
			return expr;
		}
		cmd.state.fwd.UPDATE = `${new Date()}`;
		return `exit`;
	};
	
	this.inbound_tunnel_add = function (cmd) {
	
		const nic_id = cmd.cfg.ace_nic_config[0].nic_name;
		
		if(mea_ipsec_inbound_add_parse(cmd)) {
			var expr = ``;
			expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
			expr += mea_ipsec_inbound_add_expr(cmd);
			expr += `${vpn_common.mea_cli_suffix()}\n`;
			return expr;
		}
		cmd.state.UPDATE = `${new Date()}`;
		return `exit`;
	};

	
	/////////////////////////////////////////////////
	//////////////////[load_vpn_cfg]/////////////////
	
	this.load_vpn_cfg = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += mea_init_expr(output_processor.cfg);
		expr += mea_ports_init_expr(output_processor.cfg);
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	
	/////////////////////////////////////////////////
	//////////////[outbound_tunnel_add]//////////////
	
	this.outbound_profile_add = function (cmd) {

		const tunnel_state = cmd.output_processor[cmd.key].tunnel_state;
		const security_type = vpn_common.mea_ipsec_format_security_type(tunnel_state.ipsec_cfg.auth_algo, tunnel_state.ipsec_cfg.cipher_algo);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(tunnel_state.ipsec_cfg.auth_key, tunnel_state.ipsec_cfg.cipher_key);
		var tunnel_keys_str = ``;
		tunnel_keys_str += `-Integrity_key ${tunnel_keys.integrity_key} `;
		tunnel_keys_str += `-Integrity_IV ${tunnel_keys.integrity_iv} `;
		tunnel_keys_str += `-Confident_key ${tunnel_keys.confidentiality_key} `;
		tunnel_keys_str += `-Confident_IV ${tunnel_keys.confidentiality_iv}`;
		const nic_id = tunnel_state.nic_id;
		const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
		const action_add = vpn_common.mea_action_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${tunnel_state.ipsec_cfg.spi} ${tunnel_keys_str}\n`;
		expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${tunnel_state.remote_tunnel_mac} ${tunnel_state.local_tunnel_mac} 0000\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.outbound_profile_parse = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			vpn_common.mea_ipsec_add_parse(tunnel_state, `encrypt_profile`, prev_stdout);
			vpn_common.mea_action_add_parse(tunnel_state, `l3fwd_action`, prev_stdout);			
		}
	};

	this.outbound_encrypt_action_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const action_add = vpn_common.mea_action_add(nic_id);		
		const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${action_add} -pm 1 0 -ed 1 0 -hIPSec 1 1 ${vpn_cfg.vpn_gw_ip} ${conn_cfg.remote_tunnel_endpoint_ip} -hESP 1 ${tunnel_state.encrypt_profile.id} -hType 71\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.outbound_encrypt_action_parse = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			vpn_common.mea_action_add_parse(tunnel_state, `encrypt_action`, prev_stdout);
		}
	};
	
	this.outbound_forwarders_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${forwarder_add} 0 ${tunnel_state.local_tunnel_mac} ${conn_cfg.lan_port} 3 1 0 1 ${vpn_common.mea_cipher_port} -action 1 ${tunnel_state.encrypt_action.id}\n`;
		expr += `${forwarder_add} 0 ${tunnel_state.local_tunnel_mac} ${vpn_common.mea_cipher_port} 3 1 0 1 ${conn_cfg.tunnel_port} -action 1 ${tunnel_state.l3fwd_action.id}\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.outbound_forwarders_parse = function (cmd, finish_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		
		if(output_processor.output.length === 3) {
			const prev_stdout = output_processor.output[2].stdout;
			vpn_common.mea_forwarder_add_parse(tunnel_state, `encrypt_forwarder`, `0 ${tunnel_state.local_tunnel_mac} ${conn_cfg.lan_port}`, prev_stdout);
			vpn_common.mea_forwarder_add_parse(tunnel_state, `l3fwd_forwarder`, `0 ${tunnel_state.local_tunnel_mac} ${vpn_common.mea_cipher_port}`, prev_stdout);
			if(finish_cb) {
				finish_cb(cmd);
			}
		}
	};

	
	/////////////////////////////////////////////////
	///////////////[inbound_tunnel_add]//////////////
	
	this.inbound_profile_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const security_type = vpn_common.mea_ipsec_format_security_type(tunnel_state.ipsec_cfg.auth_algo, tunnel_state.ipsec_cfg.cipher_algo);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(tunnel_state.ipsec_cfg.auth_key, tunnel_state.ipsec_cfg.cipher_key);
		var tunnel_keys_str = ``;
		tunnel_keys_str += `-Integrity_key ${tunnel_keys.integrity_key} `;
		tunnel_keys_str += `-Integrity_IV ${tunnel_keys.integrity_iv} `;
		tunnel_keys_str += `-Confident_key ${tunnel_keys.confidentiality_key} `;
		tunnel_keys_str += `-Confident_IV ${tunnel_keys.confidentiality_iv}`;
		const nic_id = tunnel_state.nic_id;
		const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
		const action_add = vpn_common.mea_action_add(nic_id);
		const service_add = vpn_common.mea_service_add(nic_id);
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		const conn_tag = vpn_common.vpn_conn_tag(output_processor.cfg, tunnel_state);
		const port_macs = vpn_common.mea_port_macs(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${tunnel_state.ipsec_cfg.spi} ${tunnel_keys_str}\n`;
		expr += `${service_add} ${vpn_common.mea_cipher_port} FF1${conn_tag_hex} FF1${conn_tag_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 6 -v ${256 + conn_tag} -l4port_mask 1 -ra 0 -l2Type 1 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_profile_parse = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			vpn_common.mea_ipsec_add_parse(tunnel_state, `decrypt_profile`, prev_stdout);
			vpn_common.mea_service_add_parse(tunnel_state, `l3fwd_service`, prev_stdout);
			return cmd;
		}
	};
	
	this.inbound_service_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const service_add = vpn_common.mea_service_add(nic_id);
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		const port_macs = vpn_common.mea_port_macs(nic_id);
		const remote_ip_hex = vpn_common.ip_to_hex(conn_cfg.remote_tunnel_endpoint_ip);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${service_add} ${conn_cfg.tunnel_port} ${remote_ip_hex} ${remote_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_cipher_port} -ra 0 -inf 1 0x${vpn_common.uint32_to_hex(tunnel_state.ipsec_cfg.spi)} -l2Type 0 -subType 19 -h 810001${conn_tag_hex} 0 0 0 -hType 1 -hESP 2 ${tunnel_state.decrypt_profile.id} -lmid 1 0 1 0 -r ${port_macs[conn_cfg.tunnel_port]} 00:00:00:00:00:00 0000\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_service_parse = function (cmd, finish_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			vpn_common.mea_service_add_parse(tunnel_state, `decrypt_service`, prev_stdout);
			if(finish_cb) {
				finish_cb(cmd);
			}
		}
	};

	
	/////////////////////////////////////////////////
	////////////////[inbound_fwd_add]////////////////

	this.inbound_fwd_action_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const nic_id = tunnel_state.nic_id;
		const action_add = vpn_common.mea_action_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		for(var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
			expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${next_hops[next_hop_idx].mac} ${tunnel_state.local_tunnel_mac} 0000 -hType 3\n`;
		}
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.inbound_fwd_action_parse = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		
		if(output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			if(next_hops.length === vpn_common.mea_actions_add_parse(tunnel_state.fwd, prev_stdout)) {
				const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
				for(var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
					tunnel_state.fwd[prev_next_hops_count + next_hop_idx].ip = next_hops[next_hop_idx].ip;
					tunnel_state.fwd[prev_next_hops_count + next_hop_idx].mac = next_hops[next_hop_idx].mac;
					if((next_hop_idx + 1) === next_hops.length) {
						return cmd;
					}
				}
			}
		}
	};

	this.inbound_fwd_forwarder_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const nic_id = tunnel_state.nic_id;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
		for(var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
			const fwd = tunnel_state.fwd[prev_next_hops_count + next_hop_idx];
			expr += `${forwarder_add} 6 ${fwd.ip} 0 0x1${conn_tag_hex} 3 1 0 1 ${conn_cfg.lan_port} -action 1 ${fwd.action_id}\n`;
		}
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_fwd_forwarder_parse = function (cmd, finish_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		
		if(output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
			for(var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
				var fwd = tunnel_state.fwd[prev_next_hops_count + next_hop_idx];
				vpn_common.mea_forwarder_add_parse(fwd, `forwarder`, `6 ${fwd.ip} 0 0x1${conn_tag_hex}`, prev_stdout);
				if((next_hop_idx + 1) === next_hops.length) {
					if(finish_cb) {
						finish_cb(cmd);
					}					
				}
			}
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
