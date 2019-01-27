
var syntax_common = require('./syntax_common.js');

var ipsec_conf_arr = [ ];
var ipsec_secrets_arr = [ ];

function libreswan_expr_ipsec_conf_init(expr_key, expr_path, expr_arr, cfg) {

	const nic_cfg = cfg.ace_nic_config[0];
	
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# # #`);
	expr_arr.push(`config setup`);
	expr_arr.push(`  protostack=netkey`);
	expr_arr.push(`  logfile=${nic_cfg.log_file}`);
	expr_arr.push(`  plutodebug=all`);
	expr_arr.push(`#`);
};

function libreswan_expr_ipsec_conf_conn_append(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const libreswan_specific = conn.libreswan_specific;
	const libreswan_specific_arr = libreswan_specific.split('\n');

	expr_arr.push(`# Outbound (HW offload: ${conn.outbound_accel}): ${conn_ns}`);
	expr_arr.push(`# Inbound  (HW offload: ${conn.inbound_accel}): ${conn_ns}`);
	expr_arr.push(`conn ${conn.name}`);

	libreswan_specific_arr.forEach(function(param) {
		expr_arr.push(`  ${param}`);
	});

	expr_arr.push(`  left=${vpn_cfg.vpn_gw_ip}`);
	expr_arr.push(`  right=${conn.remote_tunnel_endpoint_ip}`);
	expr_arr.push(`  leftsubnet=${conn.local_subnet}`);
	expr_arr.push(`  rightsubnet=${conn.remote_subnet}`);
	expr_arr.push(`  esp=${conn.encryption_type}`);
	expr_arr.push(`#`);
};

function libreswan_expr_ipsec_secrets_init(expr_key, expr_path, expr_arr, cfg) {

	const nic_cfg = cfg.ace_nic_config[0];
	
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`include /etc/ipsec.d/*.secrets`);
};

function libreswan_expr_ipsec_secrets_conn_append(expr_arr, cfg, conn_id) {

	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];

	expr_arr.push(`${vpn_cfg.vpn_gw_ip} ${conn.remote_tunnel_endpoint_ip} : PSK "${conn.pre_shared_secret}"`);
};

function libreswan_expr_ipsec_conf_build(expr_key, expr_path, expr_arr, cfg, tunnel_port) {

	libreswan_expr_ipsec_conf_init(expr_key, expr_path, expr_arr, cfg);
	for(var conn_id = 0; conn_id < cfg.conns.length; ++conn_id) {
		const conn = cfg.conns[conn_id];
		if(conn.tunnel_port == tunnel_port) {
			libreswan_expr_ipsec_conf_conn_append(expr_arr, cfg, conn_id);
		};
	};
};

function libreswan_expr_ipsec_secrets_build(expr_key, expr_path, expr_arr, cfg, tunnel_port) {

	libreswan_expr_ipsec_secrets_init(expr_key, expr_path, expr_arr, cfg);
	for(var conn_id = 0; conn_id < cfg.conns.length; ++conn_id) {
		const conn = cfg.conns[conn_id];
		if(conn.tunnel_port == tunnel_port) {
			libreswan_expr_ipsec_secrets_conn_append(expr_arr, cfg, conn_id);
		};
	};
};

function libreswan_expr_tun_remote_mac_get(expr_key, expr_path, expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const gw_dev = tun_gw_dev(nic_cfg, conn);

	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	
	expr_arr.push(`  TUN_REMOTE_MAC=$(ip neigh | grep ${conn.remote_tunnel_endpoint_ip} | sed -s 's/^.* dev ${gw_dev} lladdr \\([0-9a-fA-F\:]*\\) .*$/\\1/')`);	
	expr_arr.push(`  echo "\${TUN_REMOTE_MAC}"`);
};

function libreswan_expr_cfg_build(cfg) {

	const nic_cfg = cfg.ace_nic_config[0];
	
	var port_dictionary = { };
	for(var protected_port = 104; protected_port <= 107; ++protected_port) {
		port_dictionary[`${protected_port}`] = { };
		port_dictionary[`${protected_port}`][`ipsec.conf`] = [ ];
		port_dictionary[`${protected_port}`][`ipsec.secrets`] = [ ];
		libreswan_expr_ipsec_conf_build(port_dictionary[`${protected_port}`][`ipsec.conf`], cfg, protected_port);
		libreswan_expr_ipsec_secrets_build(port_dictionary[`${protected_port}`][`ipsec.secrets`], cfg, protected_port);
	};
	return port_dictionary;
};


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function port_dictionary_append_libreswan(port_dictionary, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const expr_dir = `/etc`;
	
	var expr_arr = [];
	expr_arr = []; libreswan_expr_ipsec_conf_build(`ipsec.conf`, `${gw_inst}:${expr_dir}/ipsec.conf`, expr_arr, cfg, port); port_dictionary[`${port}`][`ipsec.conf`] = expr_arr;
	expr_arr = []; libreswan_expr_ipsec_secrets_build(`ipsec.secrets`, `${gw_inst}:${expr_dir}/ipsec.secrets`, expr_arr, cfg, port); port_dictionary[`${port}`][`ipsec.secrets`] = expr_arr;
};

function conn_dictionary_append_libreswan(conn_dictionary, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const conn = cfg.conns[conn_id];
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const ns = tun_ns(nic_cfg, conn);
	const expr_dir = `${nic_cfg.install_dir}/shared/${vpn_inst}/${gw_inst}/conns/${ns}`;
	
	var expr_arr = [];
	expr_arr = []; libreswan_expr_tun_remote_mac_get(`tun_remote_mac_get`, `${gw_inst}:${expr_dir}/tun_remote_mac_get`, expr_arr, cfg, conn_id); port_dictionary[`${ns}`][`tun_remote_mac_get`] = expr_arr;
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

module.exports = function () {

	this.json_cfg = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
    };
	
    this.port_dictionary_append = function (port_dictionary, port) {
	
		port_dictionary_append_libreswan(port_dictionary, this.json_cfg, port);
    };
	
    this.conn_dictionary_append = function (conn_dictionary, conn_id) {
	
		conn_dictionary_append_libreswan(conn_dictionary, this.json_cfg, conn_id);
    };
	
    this.conn_exec = function (exec_dictionary, conn_id, env, expr_key) {
	
		const nic_cfg = this.json_cfg.ace_nic_config[0];
		const conn = this.json_cfg.conns[conn_id];
		const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
		const ns = tun_ns(nic_cfg, conn);
		
		var that = this;
		var exec_cmd = `eval "${env}"\n`;
		exec_cmd += exec_dictionary[`${ns}`][`${expr_key}`];
		const docker_exec_cmd = `docker exec ${gw_inst} /bin/bash -c '${exec_cmd}'`;
		console.log(docker_exec_cmd);
		ssh.connect({
			host: that.remote_ip,
			username: that.remote_user,
			password: that.remote_password
		})
		.then(function() {

			ssh.execCommand(exec_cmd, { cwd:'/' }).then(function(result) {
				
				console.log(`STDOUT: \n${result.stdout}`);
				console.log(`STDERR: \n${result.stderr}`);
				ssh.dispose();
				console.log(`result.stdout: ${result.stdout}`);
				const TUNNEL_CONFIG = JSON.parse(result.stdout);
				console.log(`const TUNNEL_CONFIG = \n${JSON.stringify(TUNNEL_CONFIG, null, 2)};`);
			});
		});
    };
};
