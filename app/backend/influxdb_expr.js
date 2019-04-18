
var http_request = require('request');
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////
//////////////////// RMONs //////////////////////

var rmons_collect_expr = function (nic_id) {
	
	const mea_cmd = vpn_common.mea_cli(nic_id);
	
	var expr = ``;
	expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
	expr += `${mea_cmd} counters rmon collect 104:127\n`;
	expr += `${mea_cmd} counters rmon show 104:127\n`;
	expr += `date +%s%N\n`;
	expr += `${vpn_common.mea_cli_suffix()}\n`;
	return expr;
};

var influxdb_send = function (db, msg) {
	
	//console.log(`${db.name}@${db.ip}:${db.port} <= ${msg}`);
	/////////
	const influxdb_url = `http://${db.ip}:${db.port}/write?db=${db.name}`;
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
	
var influxdb_update_rmon = function (host_profile, db, rmons_container, port) {
	
	const port_key = `rmon${port}`;
	if (rmons_container[port_key] !== undefined) {
		var record_head = `${port_key}`;
		if (host_profile !== undefined) {
			record_head += `,host=${host_profile.host}`;
		}
		var rx_str = `${record_head},direction=rx PktsRX=${rmons_container[port_key].PktsRX},BytesRX=${rmons_container[port_key].BytesRX},CRCErrorPktsRX=${rmons_container[port_key].CRCErrorPktsRX},RxMacDropPktsRX=${rmons_container[port_key].RxMacDropPktsRX} ${rmons_container.timestamp + (1000 * port)}`;
		var tx_str = `${record_head},direction=tx PktsTX=${rmons_container[port_key].PktsTX},BytesTX=${rmons_container[port_key].BytesTX},CRCErrorPktsTX=${rmons_container[port_key].CRCErrorPktsTX} ${rmons_container.timestamp + (1000 * port) + 10000}`;
		influxdb_send(db, rx_str);
		influxdb_send(db, tx_str);
	}
};

var rmons_db_update = function (host_profile, db, prev_stdout) {
	
	const max_ports_count = 5;

	const rmon_arr = prev_stdout.split(/\r?\n/);
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
		if (ports_count >= max_ports_count) {
			rmons_container_str += `,"timestamp":${rmon_arr[rmon_arr.length - 2]}`;
			rmons_container_str += `}`;
			rmons_container = JSON.parse(rmons_container_str);
			break;
		} else {
			rmons_container_str += `,`;
		}
	}
	
	//console.log(JSON.stringify(rmons_container, null, 2));
	influxdb_update_rmon(host_profile, db, rmons_container, 104);
	influxdb_update_rmon(host_profile, db, rmons_container, 105);
	influxdb_update_rmon(host_profile, db, rmons_container, 106);
	influxdb_update_rmon(host_profile, db, rmons_container, 107);
	influxdb_update_rmon(host_profile, db, rmons_container, 127);
	//console.log(`${Date.now()}> influxdb_success_count: ${stats_state.influxdb_success_count} influxdb_error_count: ${stats_state.influxdb_error_count}`);
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function () {
	
	//var periodic_rmons = {};

	this.rmons_collect = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += rmons_collect_expr(nic_id);
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.influxdb_rmons_update = function (cmd, return_cb) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const host_profile = output_processor.cfg.host_profile;
		const db = output_processor.db;
	
		if (output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			cmd.return_cb = [ return_cb ];
			rmons_db_update(host_profile, db, prev_stdout);
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
