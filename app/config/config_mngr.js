
var log4js = require('log4js');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
var fs = require('fs');

const enet_vpn_config = '/shared/enet_vpn_config.json';
const enet_vpn_log = '/tmp/enet_vpn_log.log';
const config_mngr_port = 2766;

log4js.configure({
  appenders: { vpncfg: { type: 'file', filename: enet_vpn_log } },
  categories: { default: { appenders: ['vpncfg'], level: 'debug' } }
});
var logger = log4js.getLogger('host');
const app = express();
const server = require('http').createServer(app);
const { parse } = require('querystring');
const { exec } = require('child_process');

function conn_libreswan_cfg_add(ipsec_conf, ipsec_secrets, json_cfg, conn_json_cfg) {

	ipsec_conf += 'conn ' + conn_json_cfg.name + '\n';
	var libreswan_specific_config = conn_json_cfg.libreswan_config;
	var libreswan_specific_config_arr = libreswan_specific_config.split('\n');
	libreswan_specific_config_arr.forEach(function(param) {
		ipsec_conf += '  ' + param + '\n';
	});
	ipsec_conf += '  left=' + json_cfg.libreswan_config.vpn_gw_ip + '\n';
	ipsec_conf += '  right=' + conn_json_cfg.remote_vpn_gw_ip + '\n';
	ipsec_conf += '  leftsubnet=' + conn_json_cfg.local_subnet + '\n';
	ipsec_conf += '  rightsubnet=' + conn_json_cfg.remote_subnet + '\n';
	ipsec_conf += '  esp=' + conn_json_cfg.encryption_type + '\n';
	ipsec_conf += '#\n';
	
	ipsec_secrets += json_cfg.libreswan_config.vpn_gw_ip + ' ';
	ipsec_secrets += conn_json_cfg.remote_vpn_gw_ip + ' ';
	ipsec_secrets += ': PSK \"' + conn_json_cfg.pre_shared_secret + '\"\n';
};

function libreswan_cfg_init(ipsec_conf_arr, ipsec_secrets_arr, json_cfg) {

	ipsec_conf_arr.foreach(function(ipsec_conf) {
		
		ipsec_conf += '# /etc/ipsec.conf\n';
		ipsec_conf += '# # #\n';
		ipsec_conf += 'config setup\n';
		ipsec_conf += '  protostack=netkey\n';
		ipsec_conf += '  logfile=' + json_cfg.ace_nic_config.log_file + '\n';
		ipsec_conf += '  plutodebug=all\n';
		ipsec_conf += '#\n';
	});
	ipsec_secrets_arr.foreach(function(ipsec_secrets) {
		
		ipsec_secrets += 'include /etc/ipsec.d/*.secrets\n';
	});
};

function libreswan_cfg_build(ipsec_conf_arr, ipsec_secrets_arr, json_cfg) {

	json_cfg.conns.foreach(function(conn_json_cfg) {
		
		const tunnel_port_idx = (conn_json_cfg.tunnel_port - 104);
		if((conn_json_cfg.inbound_accel == "full") && (conn_json_cfg.outbound_accel == "full")) {
			conn_libreswan_cfg_add(ipsec_conf_arr[tunnel_port_idx], ipsec_secrets_arr[tunnel_port_idx], json_cfg, conn_json_cfg);
		}
		else {
			conn_libreswan_cfg_add(ipsec_conf_arr[tunnel_port_idx], ipsec_secrets_arr[tunnel_port_idx], json_cfg, conn_json_cfg);
		};
	});
};

function send_curr_config(res) {

	logger.info('Sending config file %s', enet_vpn_config);
	fs.readFile(enet_vpn_config, 'utf8', function (error, data) {

		if(error) {
			logger.error(`readFile error: ${error}`);
			return { };
		};
		try {
			logger.info('Sending config %s', data);
			const curr_cfg = JSON.parse(data);
			return res.send(JSON.stringify(curr_cfg, null, 2))
		} catch (error) {
			logger.error(`JSON send error: ${error}`);
			return { };
		};
	});
};

app.use(morgan('dev'));
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.header('Access-Control-Expose-Headers', 'Content-Length');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
	if (req.method === 'OPTIONS') {
		return res.send(200);
	}
	else if (req.method === 'GET') {
		res.setHeader('Content-Type', 'application/json');
		send_curr_config(res);
		//return res.send(200);
	} else {
		return next();
	}
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {

	res.setHeader('Content-Type', 'application/json');
	send_curr_config(res);
});

app.post('/', (req, res) => {
	
	let body = '';
	req.on('data', chunk => {
		
		body += chunk.toString();
	});
	req.on('end', () => {
		
		try {
			const json_body = JSON.parse(body);
			const update_cmd = json_body['UPDATE'];
			json_body['UPDATE'] = new Date().toUTCString();
			if(json_body['VPN'] != undefined) {
				fs.writeFile(enet_vpn_config, JSON.stringify(json_body, null, 2), function(error) {
					
					if(error) {
						logger.error(`fs.writeFile enet_vpn_config error: ${error}`);
						return;
					};
				});
				let ipsec_conf_arr = [ '\n', '\n', '\n', '\n' ];
				let ipsec_secrets_arr = [ '\n', '\n', '\n', '\n' ];
				libreswan_cfg_init(ipsec_conf_arr, ipsec_secrets_arr, json_cfg);
				libreswan_cfg_build(ipsec_conf_arr, ipsec_secrets_arr, json_cfg);
				ipsec_conf_arr.foreach(function(ipsec_conf, i) {
					
					const ipsec_conf_path = '/shared/enet' + json_cfg.ace_nic_config.nic_id + '_libreswan' + (104 + i) + '/ipsec.conf';
					fs.writeFile(ipsec_conf_path, ipsec_conf, function(error) {
						
						if(error) {
							logger.error(`fs.writeFile ipsec_conf error: ${error}`);
						};
					});
				};
				ipsec_secrets_arr.foreach(function(ipsec_secrets) {
					
					const ipsec_secrets_path = '/shared/enet' + json_cfg.ace_nic_config.nic_id + '_libreswan' + (104 + i) + '/ipsec.secrets';
					fs.writeFile(ipsec_secrets_path, ipsec_secrets, function(error) {
						
						if(error) {
							logger.error(`fs.writeFile ipsec_secrets error: ${error}`);
						};
					});
				};
			};
		} catch (error) {
			logger.error(`JSON.parse error: ${error}`);
			return;
		};
		res.end('ok');
	});
});

server.listen(config_mngr_port, () => {
	
	logger.info('VPN Config Manager active on port: %d [ config file: %s ]', config_mngr_port, enet_vpn_config);
});

