
var http_request = require('request');
var vpn_common = require('./vpn_common.js');
var MEA_IPSEC_OUTBOUND = require('./mea_ipsec_outbound.js');
var MEA_IPSEC_INBOUND = require('./mea_ipsec_inbound.js');

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
			if (response !== undefined) {
				console.log(`====  ${response.json({ name: error })}  ====`);
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
	if (rmons_container[port_key] !== undefined) {
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
	var rmons_container = {};
	var rmons_container_str = `{`;
	var ports_count = 0;
	for (var line_idx = 2; line_idx < rmon_arr.length; line_idx += 5) {
		//console.log(`${rmon_arr.length} ${line_idx}`);
		rmons_container_str += vpn_common.mea_rmon_parse_pkts(rmon_arr[line_idx]);
		rmons_container_str += vpn_common.mea_rmon_parse_bytes(rmon_arr[line_idx + 1]);
		rmons_container_str += vpn_common.mea_rmon_parse_crc_errors(rmon_arr[line_idx + 2]);
		rmons_container_str += vpn_common.mea_rmon_parse_mac_drops(rmon_arr[line_idx + 3]);
		++ports_count;
		if (ports_count >= 5) {
			rmons_container_str += `,"timestamp":${rmon_arr[rmon_arr.length - 1]}`;
			rmons_container_str += `}`;
			rmons_container = JSON.parse(rmons_container_str);
			break;
		} else {
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
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function () {
	
	this.ipsec_outbound = new MEA_IPSEC_OUTBOUND();
	this.ipsec_inbound = new MEA_IPSEC_INBOUND();
	
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
	
	/////////////////////////////////////////////////
	////////////////////[vpn_test]///////////////////
	
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
		if (output_processor.output.length > 0) {
			var prev_stdout = output_processor.output[output_processor.output.length - 1].stdout;
			var test_regex = /(root)/;
			prev_stdout.replace(test_regex, function (match, match0, match1) {
				
				if (match0) {
					++output_processor.meta.matches_count;
				}
				if (match1) {
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
	/////////////////////////////////////////////////
};
