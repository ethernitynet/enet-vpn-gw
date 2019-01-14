
const config_mngr_port = process.env.ENET_VPN_CONFIG_PORT;
const enet_vpn_config = '/shared/enet_vpn_config.json';
const enet_vpn_log = '/tmp/enet_vpn_log.log';

var fs = require('fs');
var log4js = require('log4js');
log4js.configure({
	appenders: { vpncfg: { type: 'file', filename: enet_vpn_log } },
	categories: { default: { appenders: ['vpncfg'], level: 'debug' } }
});
var logger = log4js.getLogger('vpncfg');

var express = require('express');
var app = express();
app.get('/', function (req, res) { res.sendStatus(200) });
app.post('/', function (req, res, next) {

    var data = '';
    req.on('data', function (chunk) {
	
        data += chunk;
    });
    req.on('end', function () {
	
		try {
			return enet_vpn_config_update(JSON.parse(data));
		} catch (error) {
			logger.error(`JSON send error: ${error}`);
			return { };
		};
    });
    res.sendStatus(200);
});
module.exports = app;

app.listen(config_mngr_port, function () {

	console.log('VPN GW config-manager listening on port %d', config_mngr_port);
});


var ipsec_conf_arr = [ ];
var ipsec_secrets_arr = [ ];

function enet_vpn_config_update(json_cfg) {

	const update_cmd = json_cfg.UPDATE;
	json_cfg.UPDATE = new Date().toUTCString();
	if(json_cfg.VPN != undefined) {
		try {
			fs.writeFileSync(enet_vpn_config, JSON.stringify(json_cfg, null, 2));
			libreswan_cfg_create(json_cfg.VPN);
		} catch (error) {
			logger.error(`writeFileSync enet_vpn_config error: ${error}`);
		};
	};
	return { };
};

function libreswan_cfg_create(json_cfg) {

	libreswan_cfg_init(json_cfg);
	console.log('ipsec_conf_arr[0]: %s', ipsec_conf_arr[0]);
	libreswan_cfg_build(json_cfg);
	ipsec_conf_arr.forEach(function(ipsec_conf, i) {
		
		const ipsec_conf_path = '/shared/enet' + json_cfg.ace_nic_config[0].nic_id + '_libreswan' + (104 + i) + '/ipsec.conf';
		fs.writeFileSync(ipsec_conf_path, ipsec_conf, { encoding: 'utf8', flag: 'w'});
	});
	ipsec_secrets_arr.forEach(function(ipsec_secrets, i) {
		
		const ipsec_secrets_path = '/shared/enet' + json_cfg.ace_nic_config[0].nic_id + '_libreswan' + (104 + i) + '/ipsec.secrets';
		fs.writeFileSync(ipsec_secrets_path, ipsec_secrets, { encoding: 'utf8', flag: 'w'});
	});
};

function libreswan_cfg_init(json_cfg) {

	ipsec_conf_arr = [ ];
	ipsec_secrets_arr = [ ];
	for(var i = 104; i <= 107; ++i) {
		var ipsec_conf = '\n';
		ipsec_conf += '# /etc/ipsec.conf\n';
		ipsec_conf += '# # #\n';
		ipsec_conf += 'config setup\n';
		ipsec_conf += '  protostack=netkey\n';
		ipsec_conf += '  logfile=' + json_cfg.ace_nic_config[0].log_file + '\n';
		ipsec_conf += '  plutodebug=all\n';
		ipsec_conf += '#\n';
		ipsec_conf_arr.push(ipsec_conf);
		var ipsec_secrets = '\n';
		ipsec_secrets += 'include /etc/ipsec.d/*.secrets\n';
		ipsec_secrets_arr.push(ipsec_secrets);
	};
};

function libreswan_cfg_build(json_cfg) {

	json_cfg.conns.forEach(function(conn_json_cfg) {
		
		const tunnel_port_idx = (conn_json_cfg.tunnel_port - 104);
		if((conn_json_cfg.inbound_accel == "full") && (conn_json_cfg.outbound_accel == "full")) {
			conn_libreswan_cfg_add(tunnel_port_idx, json_cfg, conn_json_cfg);
		}
		else {
			conn_libreswan_cfg_add(tunnel_port_idx, json_cfg, conn_json_cfg);
		};
	});
};

function conn_libreswan_cfg_add(tunnel_port_idx, json_cfg, conn_json_cfg) {

	var ipsec_conf = ipsec_conf_arr[tunnel_port_idx];
	ipsec_conf += 'conn ' + conn_json_cfg.name + '\n';
	var libreswan_specific_config = conn_json_cfg.libreswan_config;
	var libreswan_specific_config_arr = libreswan_specific_config.split('\n');
	libreswan_specific_config_arr.forEach(function(param) {
		ipsec_conf += '  ' + param + '\n';
	});
	ipsec_conf += '  left=' + json_cfg.libreswan_config[0].vpn_gw_ip + '\n';
	ipsec_conf += '  right=' + conn_json_cfg.remote_vpn_gw_ip + '\n';
	ipsec_conf += '  leftsubnet=' + conn_json_cfg.local_subnet + '\n';
	ipsec_conf += '  rightsubnet=' + conn_json_cfg.remote_subnet + '\n';
	ipsec_conf += '  esp=' + conn_json_cfg.encryption_type + '\n';
	ipsec_conf += '#\n';
	ipsec_conf_arr[tunnel_port_idx] = ipsec_conf;
	
	var ipsec_secrets = ipsec_secrets_arr[tunnel_port_idx];
	ipsec_secrets += json_cfg.libreswan_config[0].vpn_gw_ip + ' ';
	ipsec_secrets += conn_json_cfg.remote_vpn_gw_ip + ' ';
	ipsec_secrets += ': PSK \"' + conn_json_cfg.pre_shared_secret + '\"\n';
	ipsec_secrets_arr[tunnel_port_idx] = ipsec_secrets;
};
