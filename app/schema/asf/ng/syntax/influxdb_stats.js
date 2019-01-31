
var http_request = require('request');
var sh = require('shelljs');
sh.config.silent = true;

function influxdb_expr_stats_add(line_proto_arr, cfg, tunnel_config, stats) {
	
	const conn = cfg.conns[tunnel_config.CONN_ID];
	const vpn_cfg = cfg.vpn_gw_config[0];
	
	var line_proto_expr = ``;
	line_proto_expr += `${tunnel_config.DIRECTION}-${conn.tunnel_port},`;
	line_proto_expr += `side=${tunnel_config.SIDE},`;
	line_proto_expr += `remote_tunnel_endpoint_ip=${conn.remote_tunnel_endpoint_ip},`;
	line_proto_expr += `remote_subnet=${conn.remote_subnet},`;
	line_proto_expr += `lan_port=${conn.lan_port},`;
	line_proto_expr += `vpn_gw_ip=${vpn_cfg.vpn_gw_ip},`;
	line_proto_expr += `local_subnet=${conn.local_subnet},`;
	line_proto_expr += `encryption_type=${conn.encryption_type} `;
	line_proto_expr += `FwdGreenPkt=${stats.pkts[0]},`;
	line_proto_expr += `FwdYellowPkt=${stats.pkts[1]},`;
	line_proto_expr += `DisGreenPkt=${stats.pkts[2]},`;
	line_proto_expr += `FwdGreenByte=${stats.bytes[0]},`;
	line_proto_expr += `FwdYellowByte=${stats.bytes[1]},`;
	line_proto_expr += `DisGreenByte=${stats.bytes[2]}`;
	line_proto_arr.push(line_proto_expr);
};

function stats_collect(stats_collect_cmd) {
	
	const ws_pattern = '\\s\\s*';
	const dec_pattern = '[0-9][0-9]*';
	const txt_pattern = '[0-9a-zA-Z][0-9a-zA-Z]*';
	const delimiter_line = '^------ ---------------- ---------------- ---------------- ---------------- ---------------- ---------------- ----------------$';
	const bottom_line = '^===========================================================================================================================$';
	const pmid_line = `^${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}FwdGreen${ws_pattern}FwdYellow${ws_pattern}DisGreen${ws_pattern}DisYellow${ws_pattern}DisRed${ws_pattern}DisOther${ws_pattern}DisMtu$`;
	const pkts_line = `^${ws_pattern}Pkt${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}$`;
	const bytes_line = `^${ws_pattern}Byte${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}$`;
	const cmd_out = sh.exec(`${stats_collect_cmd} | sed -e '/${bottom_line}/,$d' | sed -n -e '/${delimiter_line}/,$p' | grep -v '${delimiter_line}' | sed -s 's/${pmid_line}/"STATS\\1":{/g' | sed -s 's/${pkts_line}/"pkts":[\\1,\\2,\\3],/g' | sed -s 's/${bytes_line}/"bytes":[\\1,\\2,\\3]},/g'`).stdout;
	return JSON.parse(`{${cmd_out}"sentinel":0}`);
};

function influxdb_stats_block_parse(json_cfg, tunnels_config, stats_container) {
	
	var line_proto_arr = [];
	for(var i = 0; i < tunnels_config.length; ++i) {
		const config_lan = tunnels_config[i].LAN;
		const stats_lan = stats_container[config_lan.STATS_ID];
		influxdb_expr_stats_add(line_proto_arr, json_cfg.VPN, config_lan, stats_lan);
		const config_tunnel = tunnels_config[i].TUNNEL;
		const stats_tunnel = stats_container[config_tunnel.STATS_ID];
		influxdb_expr_stats_add(line_proto_arr, json_cfg.VPN, config_tunnel, stats_tunnel);
	};
	return line_proto_arr;
};

function influxdb_send(db_ip, db_port, db_name, msg) {
	
/////////
const influxdb_url = `http://${db_ip}:${db_port}/write?db=${db_name}`;
console.log(influxdb_url);
http_request({
		url: influxdb_url,
		encoding: null,
		method: 'POST',
		body: msg
	}, (error, response, body) => {
		if (error) {
			console.log(`====  ${JSON.stringify(error)}  ====`);
			console.log(`====  ${response.json({name : error})}  ====`);
		} else {
			console.log(`====  SUCCESS  ====`);
		};
	});
/////////
};

function influxdb_send_batch(db_ip, db_port, db_name, line_proto_arr) {
	
	var line_proto_str = ``;
	for(var rec_id = 0; rec_id < line_proto_arr.length; ++rec_id) {
		line_proto_str += `${line_proto_arr[rec_id]}\n`;
	};
	influxdb_send(`172.16.10.151`, 8086, `enet_vpn_db`, line_proto_str);
};


module.exports = function (db_ip, db_port, db_name) {

	this.db_ip = db_ip;
	this.db_port = db_port;
	this.db_name = db_name;
	this.json_cfg = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
    };
	
    this.stats_collect = function (tunnels_config, stats_collect_cmd) {
	
		const stats_container = stats_collect(stats_collect_cmd);
		const line_proto_arr = influxdb_stats_block_parse(this.json_cfg, tunnels_config, stats_container);
		influxdb_send_batch(this.db_ip, this.db_port, this.db_name, line_proto_arr);
    };
};
