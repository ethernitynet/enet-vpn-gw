
var fs = require('fs');
var path = require('path');
var node_ssh = require('node-ssh');
var ssh = new node_ssh();
var http_request = require('request');
var sh = require('shelljs');
sh.config.silent = true;

function influxdb_expr_stats_add(line_proto_arr, cfg, tunnel_config, stats_container, timestamp_usec) {
	
	if(tunnel_config != undefined) {
		const stats = stats_container[tunnel_config.STATS_ID];
		if(stats != undefined) {
			
			const conn = cfg.conns[tunnel_config.CONN_ID];
			const nic_cfg = cfg.ace_nic_config[0];
			const vpn_inst = enet_vpn_inst(nic_cfg);
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
			line_proto_expr += `DisGreenByte=${stats.bytes[2]} `;
			line_proto_expr += `${timestamp_usec * 1000}`;
			line_proto_arr.push(line_proto_expr);
		};
	};
};

function stats_collect_cmd_format(stats_collect_cmd) {
	
	const delimiter_line = '^------ ---------------- ---------------- ---------------- ---------------- ---------------- ---------------- ----------------$';
	const bottom_line = '^===========================================================================================================================$';
	const pmid_line = `^${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}FwdGreen${ws_pattern}FwdYellow${ws_pattern}DisGreen${ws_pattern}DisYellow${ws_pattern}DisRed${ws_pattern}DisOther${ws_pattern}DisMtu$`;
	const pkts_line = `^${ws_pattern}Pkt${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}$`;
	const bytes_line = `^${ws_pattern}Byte${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}\\(${dec_pattern}\\)${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}${ws_pattern}${txt_pattern}$`;
	return `${stats_collect_cmd} | sed -e '/${bottom_line}/,$d' | sed -n -e '/${delimiter_line}/,$p' | grep -v '${delimiter_line}' | sed -s 's/${pmid_line}/"STATS\\1":{/g' | sed -s 's/${pkts_line}/"pkts":[\\1,\\2,\\3],/g' | sed -s 's/${bytes_line}/"bytes":[\\1,\\2,\\3]},/g'`;
};

function influxdb_stats_batch_update(db_ip, db_port, db_name, json_cfg, conns_config, stats_container) {
	
	const line_proto_arr = influxdb_stats_block_parse(json_cfg, conns_config, stats_container);
	influxdb_send_batch(db_ip, db_port, db_name, line_proto_arr);
};

function influxdb_stats_block_parse(json_cfg, conns_config, stats_container) {
	
	var line_proto_arr = [];
	var usec_now = (1000 * new Date().getTime());
	Object.keys(conns_config).forEach(function(conn_key) {
		
		const conn_config = conns_config[conn_key];
		if(conn_config != undefined) {
			if(conn_config.OUTBOUND != undefined) {
				influxdb_expr_stats_add(line_proto_arr, json_cfg, conn_config.OUTBOUND.LAN, stats_container, ++usec_now);
				influxdb_expr_stats_add(line_proto_arr, json_cfg, conn_config.OUTBOUND.TUNNEL, stats_container, ++usec_now);
			};
			if(conn_config.INBOUND != undefined) {
				influxdb_expr_stats_add(line_proto_arr, json_cfg, conn_config.INBOUND.LAN, stats_container, ++usec_now);
				influxdb_expr_stats_add(line_proto_arr, json_cfg, conn_config.INBOUND.TUNNEL, stats_container, ++usec_now);
			};
		};
	});
	return line_proto_arr;
};

function influxdb_send(db_ip, db_port, db_name, msg) {
	
/////////
const influxdb_url = `http://${db_ip}:${db_port}/write?db=${db_name}`;
	console.log(`${influxdb_url} => ${msg}`);
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
			//console.log(`====  SUCCESS  ====`);
		};
	});
/////////
};

function influxdb_send_batch(db_ip, db_port, db_name, line_proto_arr) {
	
	var line_proto_str = ``;
	for(var rec_id = 0; rec_id < line_proto_arr.length; ++rec_id) {
		line_proto_str += `${line_proto_arr[rec_id]}\n`;
	};
	influxdb_send(`172.16.11.152`, 8086, db_name, line_proto_str);
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

module.exports = function (remote_ip, remote_user, remote_password, db_ip, db_port, db_name, stats_collect_cmd) {

	this.remote_ip = remote_ip;
	this.remote_user = remote_user;
	this.remote_password = remote_password;
	this.db_ip = db_ip;
	this.db_port = db_port;
	this.db_name = db_name;
	this.stats_collect_cmd = stats_collect_cmd_format(stats_collect_cmd);
	this.json_cfg = { };
	this.conns_config = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
		//console.log(this.stats_collect_cmd);
    };
	
    this.update_conns_config = function (conns_config) {
	
		this.conns_config = conns_config;
		console.log(JSON.stringify(this.conns_config));
    };
	
    this.stats_collect_remote = function () {
	
		var that = this;
		console.log(that.stats_collect_cmd);
		ssh.connect({
			host: that.remote_ip,
			username: that.remote_user,
			password: that.remote_password
		})
		.then(function() {

			ssh.execCommand(that.stats_collect_cmd, { cwd:'/' }).then(function(result) {
				
				console.log('STDOUT: ' + result.stdout);
				console.log('STDERR: ' + result.stderr);
				ssh.dispose();
				const stats_container = JSON.parse(`{${result.stdout}"sentinel":0}`);
				influxdb_stats_batch_update(that.db_ip, that.db_port, that.db_name, that.json_cfg, that.conns_config, stats_container);
			});
		});
    };
};
