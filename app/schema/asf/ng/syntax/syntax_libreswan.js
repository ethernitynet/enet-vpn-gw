
var ipsec_conf_arr = [ ];
var ipsec_secrets_arr = [ ];

function libreswan_expr_ipsec_conf_init(expr_arr, cfg, protected_port) {

	const nic_cfg = cfg.ace_nic_config[0];
	
	expr_arr.push(`# enet${nic_cfg.nic_name}_libreswan${protected_port}:/etc/ipsec.conf`);
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
	const conn_ns = vpn_conn_ns(nic_cfg, conn);
	const libreswan_specific = conn.libreswan_specific;
	const libreswan_specific_arr = libreswan_specific.split('\n');

	expr_arr.push(`# Outbound Full HW Offload: ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${conn_ns}]`);
	expr_arr.push(`# Inbound  Full HW Offload: ${conn.remote_tunnel_endpoint_ip}>>${vpn_cfg.vpn_gw_ip}[${conn_ns}]`);
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

function libreswan_expr_ipsec_secrets_init(expr_arr, cfg, protected_port) {

	const nic_cfg = cfg.ace_nic_config[0];
	
	expr_arr.push(`# enet${nic_cfg.nic_name}_libreswan${protected_port}:/etc/ipsec.secrets`);
	expr_arr.push(`include /etc/ipsec.d/*.secrets`);
};

function libreswan_expr_ipsec_secrets_conn_append(expr_arr, cfg, conn_id) {

	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];

	expr_arr.push(`${vpn_cfg.vpn_gw_ip} ${conn.remote_tunnel_endpoint_ip} : PSK "${conn.pre_shared_secret}"`);
};

function libreswan_expr_ipsec_conf_build(expr_arr, cfg, protected_port) {

	libreswan_expr_ipsec_conf_init(expr_arr, cfg, protected_port);
	for(var conn_id = 0; conn_id < cfg.conns.length; ++conn_id) {
		const conn = cfg.conns[conn_id];
		if(conn.tunnel_port == protected_port) {
			libreswan_expr_ipsec_conf_conn_append(expr_arr, cfg, conn_id);
		};
	};
};

function libreswan_expr_ipsec_secrets_build(expr_arr, cfg, protected_port) {

	libreswan_expr_ipsec_secrets_init(expr_arr, cfg, protected_port);
	for(var conn_id = 0; conn_id < cfg.conns.length; ++conn_id) {
		const conn = cfg.conns[conn_id];
		if(conn.tunnel_port == protected_port) {
			libreswan_expr_ipsec_secrets_conn_append(expr_arr, cfg, conn_id);
		};
	};
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

	var expr_arr = [];
	expr_arr = []; libreswan_expr_ipsec_conf_build(expr_arr, cfg, port); port_dictionary[`${port}`][`ipsec.conf`] = expr_arr;
	expr_arr = []; libreswan_expr_ipsec_secrets_build(expr_arr, cfg, port); port_dictionary[`${port}`][`ipsec.secrets`] = expr_arr;
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/*
module.exports = function () {

	this.json_cfg = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
    };
	
    this.port_dictionary_append = function (port_dictionary, port) {
	
		port_dictionary_append_libreswan(port_dictionary, this.json_cfg, port);
    };
};
*/

