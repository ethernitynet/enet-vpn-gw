
var log4js = require('log4js');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
var fs = require('fs');

const enet_vpn_config = '/shared/enet_vpn_config.json';
const enet_vpn_log = '/shared/enet_vpn_log.log';
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

function tun_ls_cfg_add(ipsec_conf, ipsec_secrets, json_cfg, tun_json_cfg) {

	ipsec_conf += 'conn ' + tun_json_cfg['Name'] + '\n';
	var libreswan_specific_config = tun_json_cfg['Tunnel Configuration'][0]['LibreSwan-Specific Configuration'];
	var libreswan_specific_config_arr = libreswan_specific_config.split('\n');
	libreswan_specific_config_arr.forEach(function(param) {
		ipsec_conf += '  ' + param + '\n';
	});
	ipsec_conf += '  left=' + json_cfg['Advanced']['LibreSwan Configuration']['VPN GW IP'] + '\n';
	ipsec_conf += '  right=' + tun_json_cfg['Forwarding Policy'][0]['Tunnel Connectivity']['Remote VPN GW IP'] + '\n';
	ipsec_conf += '  leftsubnet=' + tun_json_cfg['Forwarding Policy'][0]['Local']['Local Subnet'] + '\n';
	ipsec_conf += '  rightsubnet=' + tun_json_cfg['Forwarding Policy'][0]['Remote']['Remote Subnet'] + '\n';
	ipsec_conf += '  esp=' + tun_json_cfg['Forwarding Policy'][0]['Remote']['Remote Subnet'] + '\n';
	ipsec_conf += '#\n';
	
	ipsec_secrets += json_cfg['Advanced']['LibreSwan Configuration']['VPN GW IP'] + ' ';
	ipsec_secrets += tun_json_cfg['Forwarding Policy'][0]['Tunnel Connectivity']['Remote VPN GW IP'] + ' ';
	ipsec_secrets += ': PSK \"' + tun_json_cfg['Forwarding Policy'][0]['Tunnel Connectivity']['Pre-Shared Secret'] + '\"\n';
};

function ls_cfg_build(json_cfg) {

	let ipsec_conf = '\n';
	let ipsec_secrets = '\n';
	json_cfg['VPN Tunnels'].foreach(function(tun_json_cfg) {
		
		switch(tun_json_cfg['Tunnel Configuration']['HW Acceleration Choice']) {
			case 'Outbound Full Acceleration, Inbound Full Acceleration':
				tun_ls_cfg_add(ipsec_conf, ipsec_secrets, json_cfg, tun_json_cfg);
				break;
			default:
				tun_ls_cfg_add(ipsec_conf, ipsec_secrets, json_cfg, tun_json_cfg);
				break;
		};
	});
	logger.info('ipsec_conf: %s', ipsec_conf);
	logger.info('ipsec_secrets: %s', ipsec_secrets);
};

function get_curr_config() {

	logger.info('Sending config file %s', enet_vpn_config);
	fs.readFile(enet_vpn_config, 'utf8', function (error, data) {

		if(error) {
			logger.error(`readFile error: ${error}`);
			return { };
		};
		try {
			logger.info('Sending config %s', data);
			return JSON.parse(data);
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
		const curr_cfg = get_curr_config();
		return res.send(JSON.stringify(curr_cfg, null, 2));
		//return res.send(200);
	} else {
		return next();
	}
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {

	res.setHeader('Content-Type', 'application/json');
	const curr_cfg = get_curr_config();
	return res.send(JSON.stringify(curr_cfg, null, 2));
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
						logger.error(`JSON.stringify error: ${error}`);
						return;
					};
				});
				ls_cfg_build(json_cfg);
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

