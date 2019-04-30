
var ASYNC = require(`async`);
var FS = require('fs');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

var append_ipsec_conf = function (cmd, conn_id) {

	var output_processor = cmd.output_processor[cmd.key];
	const conn_cfg = output_processor.cfg.conns[conn_id];
	const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
	const vpn_gw_ip = (conn_cfg.local_tunnel_endpoint_ip === undefined) ? vpn_cfg.vpn_gw_ip : conn_cfg.local_tunnel_endpoint_ip;
	
	var ipsec_conf = `\n`;
	ipsec_conf += `conn ${conn_cfg.name}\n`;
	var libreswan_specific_config = conn_cfg.libreswan_specific;
	var libreswan_specific_config_arr = libreswan_specific_config.split(`\n`);
	libreswan_specific_config_arr.forEach(function (param) {
		ipsec_conf += `  ${param}\n`;
	});
	ipsec_conf += `  type=tunnel\n`;
	ipsec_conf += `  left=${vpn_gw_ip}\n`;
	ipsec_conf += `  right=${conn_cfg.remote_tunnel_endpoint_ip}\n`;
	ipsec_conf += `  leftsubnet=${conn_cfg.local_subnet}\n`;
	ipsec_conf += `  rightsubnet=${conn_cfg.remote_subnet}\n`;
	ipsec_conf += `  esp=${conn_cfg.encryption_type}\n`;
	ipsec_conf += `  auto=add\n`;
	ipsec_conf += `# inbound_accel=${conn_cfg.inbound_accel}\n`;
	ipsec_conf += `# outbound_accel=${conn_cfg.outbound_accel}\n`;
	ipsec_conf += `#\n`;
	return ipsec_conf;
};

var append_ipsec_secret = function (cmd, conn_id) {

	var output_processor = cmd.output_processor[cmd.key];
	const conn_cfg = output_processor.cfg.conns[conn_id];
	
	var ipsec_secret = ``;
	ipsec_secret += `PSK "${conn_cfg.pre_shared_secret}"\n`;
	return ipsec_secret;
};

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {
	
	/////////////////////////////////////////////////
	//////////////[build_libreswan_conf]/////////////

	this.init_ipsec_secrets = function (cmd, libreswan_inst) {

		var ipsec_secrets = `\n`;
		ipsec_secrets += `# ${libreswan_inst}:/etc/ipsec.secrets\n`;
		ipsec_secrets += `include /etc/ipsec.d/*.secrets\n`;
		return ipsec_secrets;
	};

	this.init_ipsec_conf = function (cmd, libreswan_inst) {

		var output_processor = cmd.output_processor[cmd.key];
		const log_file = output_processor.cfg.ace_nic_config[0].log_file;
		
		var ipsec_conf = `\n`;
		ipsec_conf += `# ${libreswan_inst}:/etc/ipsec.conf\n`;
		ipsec_conf += `# # #\n`;
		ipsec_conf += `config setup\n`;
		ipsec_conf += `  protostack=netkey\n`;
		ipsec_conf += `  logfile=${log_file}\n`;
		ipsec_conf += `  plutodebug=all\n`;
		ipsec_conf += `#\n`;
		return ipsec_conf;
	};
	
	this.build_libreswan_conf = function (cmd, finish_cb) {
	
		var output_processor = cmd.output_processor[cmd.key];
		var libreswan_states = output_processor.libreswan_states;
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
		const conns = output_processor.cfg.conns;
		
		libreswan_states.libreswan_conf = {};
		for (var conn_id = 0; conn_id < conns.length; ++conn_id) {
			const conn_cfg = conns[conn_id];
			const vpn_gw_ip = (conn_cfg.local_tunnel_endpoint_ip === undefined) ? vpn_cfg.vpn_gw_ip : conn_cfg.local_tunnel_endpoint_ip;
			var libreswan_conf = libreswan_states.libreswan_conf[`enet${nic_id}_libreswan${conn_cfg.tunnel_port}`];
			if (libreswan_conf === undefined) {
				libreswan_states.libreswan_conf[`enet${nic_id}_libreswan${conn_cfg.tunnel_port}`] = { ipsec_conf: ``, ipsec_secrets: {} };
				libreswan_conf = libreswan_states.libreswan_conf[`enet${nic_id}_libreswan${conn_cfg.tunnel_port}`];
			}
			libreswan_conf.ipsec_conf += append_ipsec_conf(cmd, conn_id);
			libreswan_conf.ipsec_secrets[`${vpn_gw_ip} ${conn_cfg.remote_tunnel_endpoint_ip}`] = append_ipsec_secret(cmd, conn_id);
			if ((conn_id + 1) === conns.length) {
				if (finish_cb) {
					finish_cb(this);
				}
			}
		}
	};
	
	/////////////////////////////////////////////////
	/////////////[update_libreswan_conf]/////////////
	
	this.init_libreswan_dir = function (cmd, libreswan_inst) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const vpn_shared_dir = `/shared/enet${nic_id}-vpn`;
		
		var expr = ``;
		expr += `mkdir -p ${vpn_shared_dir}/${libreswan_inst}\n`;
		expr += `rm -rf ${vpn_shared_dir}/${libreswan_inst}/*\n`;
		expr += `touch ${vpn_shared_dir}/${libreswan_inst}/ipsec.conf\n`;
		expr += `touch ${vpn_shared_dir}/${libreswan_inst}/ipsec.secrets\n`;
		return expr;
	};
	
	this.update_libreswan_conf = function (cmd, vpn_shared_dir, libreswan_inst) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const libreswan_conf = output_processor.libreswan_states.libreswan_conf[libreswan_inst];
		
		if (libreswan_conf !== undefined) {
			var ipsec_conf_str = this.init_ipsec_conf(cmd, libreswan_inst);
			var ipsec_secrets_str = this.init_ipsec_secrets(cmd, libreswan_inst);
			ipsec_conf_str += libreswan_conf.ipsec_conf;
			FS.writeFileSync(`${vpn_shared_dir}/${libreswan_inst}/ipsec.conf`, ipsec_conf_str);
			ASYNC.forEachOf(libreswan_conf.ipsec_secrets, (secret, secret_key, finish_cb) => {
				
				ipsec_secrets_str += `${secret_key} : ${secret}`;
				finish_cb();
			}, err => {
				
				if (err) {
					var errors_arr = output_processor.meta.errors_arr;
					if (errors_arr === undefined) {
						output_processor.meta.errors_arr = [];
						errors_arr = output_processor.meta.errors_arr;
					}
					errors_arr.push(err);
				} else {
					FS.writeFileSync(`${vpn_shared_dir}/${libreswan_inst}/ipsec.secrets`, ipsec_secrets_str);
				}
			});
		}
	};
	
	this.libreswan_conn_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const conn_cfg = output_processor.cfg.conns[output_processor.conn_id];
		
		var expr = ``;
		expr += `ipsec auto --add ${conn_cfg.name}; ipsec status`;
		return expr;
	};
	
	this.libreswan_conn_up = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const conn_cfg = output_processor.cfg.conns[output_processor.conn_id];
		
		var expr = ``;
		expr += `ipsec auto --add ${conn_cfg.name}; ipsec auto --up ${conn_cfg.name}; ipsec status`;
		return expr;
	};
	
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
