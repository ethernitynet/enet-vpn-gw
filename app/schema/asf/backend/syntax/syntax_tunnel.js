
var syntax_mea = require('./syntax_mea.js');
var syntax_ovs = require('./syntax_ovs.js');
var syntax_netns = require('./syntax_netns.js');
var syntax_libreswan = require('./syntax_libreswan.js');

/////////////////////////////////////
/////////////////////////////////////
// Tunnel
/////////////////////////////////////
/////////////////////////////////////

function expr_outbound_tunnel_del(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const netns_shared_dir = `/shared/conns/${conn_ns}`;
	const ovs_shared_dir = `/shared/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${conn_ns}`;
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/enet${nic_cfg.nic_name}-vpn/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${conn_ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/tunnel_del.sh`);
	expr_arr.push(`tunnel_del() {`);
	expr_arr.push(`  echo 'TUNNEL# Delete Outbound Tunnel: ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${conn_ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	ssh_wrapper_append(expr_arr, nic_cfg, conn, '', docker_wrapper(nic_cfg, conn, '', `${netns_shared_dir}/netns_del.sh`));
	ssh_wrapper_append(expr_arr, nic_cfg, conn, '', `${mea_shared_dir}/mea_del.sh`);
	expr_arr.push(`${ovs_shared_dir}/ovs_del.sh`);
	expr_arr.push(`}`);
};

function expr_outbound_tunnel_add(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const netns_shared_dir = `/shared/conns/${conn_ns}`;
	const ovs_shared_dir = `/shared/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${conn_ns}`;
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/enet${nic_cfg.nic_name}-vpn/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${conn_ns}`;
	const mea_env = `SPI=\${SPI} AUTH_ALGO=\${AUTH_ALGO} AUTH_KEY=\${AUTH_KEY} CIPHER_ALGO=\${CIPHER_ALGO} CIPHER_KEY=\${CIPHER_KEY}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/tunnel_add.sh`);
	expr_arr.push(`tunnel_add() {`);
	expr_arr.push(`  echo 'TUNNEL# Add Outbound Tunnel: ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${conn_ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	ssh_wrapper_append(expr_arr, nic_cfg, conn, '', docker_wrapper(nic_cfg, conn, '', `${netns_shared_dir}/netns_add.sh`));
	ssh_wrapper_append(expr_arr, nic_cfg, conn, mea_env, `${mea_shared_dir}/mea_add.sh`);
	expr_arr.push(`  ${ovs_shared_dir}/ovs_add.sh`);
	expr_arr.push(`}`);
};

function conn_dictionary_append(conn_dictionary, cfg, conn_id) {
	
	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);

	var conn_expr = { };
	var expr_arr = [];
	expr_arr = []; netns_expr_conn_del_outbound(expr_arr, cfg, conn_id); conn_expr[`netns_del`] = expr_arr;
	expr_arr = []; ovs_expr_conn_del_outbound(expr_arr, cfg, conn_id); conn_expr[`ovs_del`] = expr_arr;
	expr_arr = []; expr_outbound_tunnel_del(expr_arr, cfg, conn_id); conn_expr[`tun_del`] = expr_arr;
	expr_arr = []; netns_expr_conn_add_outbound(expr_arr, cfg, conn_id); conn_expr[`netns_add`] = expr_arr;
	expr_arr = []; mea_expr_conn_add_outbound(expr_arr, cfg, conn_id); conn_expr[`mea_add`] = expr_arr;
	expr_arr = []; mea_expr_conn_add_inbound(expr_arr, cfg, conn_id); conn_expr[`mea_add_in`] = expr_arr;
	expr_arr = []; ovs_expr_conn_add_outbound(expr_arr, cfg, conn_id); conn_expr[`ovs_add`] = expr_arr;
	expr_arr = []; expr_outbound_tunnel_add(expr_arr, cfg, conn_id); conn_expr[`tun_add`] = expr_arr;
	conn_dictionary[`${conn_ns}`] = conn_expr;
};

function expr_dictionary_append_conn(expr_dictionary, conn_dictionary, cfg, conn_id) {
	
	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);

	expr_dictionary[`${conn_ns}`] = { };
	expr_dictionary[`${conn_ns}`][`netns_del`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`netns_del`]);
	expr_dictionary[`${conn_ns}`][`ovs_del`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`ovs_del`]);
	expr_dictionary[`${conn_ns}`][`tun_del`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`tun_del`]);
	expr_dictionary[`${conn_ns}`][`netns_add`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`netns_add`]);
	expr_dictionary[`${conn_ns}`][`mea_add`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`mea_add`]);
	expr_dictionary[`${conn_ns}`][`mea_add_in`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`mea_add_in`]);
	expr_dictionary[`${conn_ns}`][`ovs_add`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`ovs_add`]);
	expr_dictionary[`${conn_ns}`][`tun_add`] = expr_arr_serialize(conn_dictionary[`${conn_ns}`][`tun_add`]);
};

function expr_dictionary_append_protected_port(ports_expr_dictionary, port_dictionary, protected_port) {
	
	ports_expr_dictionary[`${protected_port}`] = { };
	ports_expr_dictionary[`${protected_port}`][`ipsec.conf`] = expr_arr_serialize(port_dictionary[`${protected_port}`][`ipsec.conf`]);
	ports_expr_dictionary[`${protected_port}`][`ipsec.secrets`] = expr_arr_serialize(port_dictionary[`${protected_port}`][`ipsec.secrets`]);
};

function expr_dictionary_build(cfg) {
	
	var expr_dictionary = { };
	var conn_dictionary = { };
	expr_dictionary[`ports`] = { };
	for(var protected_port = 104; protected_port <= 107; ++protected_port) {
		expr_dictionary[`ports`][`${protected_port}`] = { };
		port_dictionary_append_libreswan(expr_dictionary[`ports`], cfg, protected_port);
		port_dictionary_append_mea(expr_dictionary[`ports`], cfg, protected_port);
		port_dictionary_append_ovs(expr_dictionary[`ports`], cfg, protected_port);
		port_dictionary_append_netns(expr_dictionary[`ports`], cfg, protected_port);
	};
	for(var conn_id = 0; conn_id < cfg.conns.length; ++conn_id) {
		const conn = cfg.conns[conn_id];
		const nic_cfg = cfg.ace_nic_config[0];
		const vpn_cfg = cfg.vpn_gw_config[0];
		const conn_ns = vpn_conn_ns(vpn_cfg, conn);
		expr_dictionary[`${conn_ns}`] = { };
		conn_dictionary_append_mea(expr_dictionary, cfg, conn_id);
		conn_dictionary_append_ovs(expr_dictionary, cfg, conn_id);
		conn_dictionary_append_netns(expr_dictionary, cfg, conn_id);
	};
	return expr_dictionary;
};

function expr_dictionary_serialize(expr_dictionary) {
	
	var exec_dictionary = { };
	Object.keys(expr_dictionary).forEach(function(key) {
		
		if(key == `ports`) {
			exec_dictionary[`ports`] = { };
			const port_dictionary = expr_dictionary[`ports`];
			Object.keys(port_dictionary).forEach(function(port_key) {
				exec_dictionary[`ports`][`${port_key}`] = { };
				const port_cmd_dictionary = port_dictionary[`${port_key}`];
				Object.keys(port_cmd_dictionary).forEach(function(port_cmd_key) {
					var expr = ``;
					const port_cmd = port_cmd_dictionary[port_cmd_key];
					for(var line_id = 0; line_id < port_cmd.length; ++line_id) {
						expr += `${port_cmd[line_id]}\n`;
					};
					exec_dictionary[`ports`][`${port_key}`][`${port_cmd_key}`] = expr;
				});
			});
		}
		else {
			exec_dictionary[`${key}`] = { };
			const conn_dictionary = expr_dictionary[key];
			Object.keys(conn_dictionary).forEach(function(tun_cmd_key) {
				var expr = ``;
				const tun_cmd = conn_dictionary[tun_cmd_key];
				for(var line_id = 0; line_id < tun_cmd.length; ++line_id) {
					expr += `${tun_cmd[line_id]}\n`;
				};
				exec_dictionary[`${key}`][`${tun_cmd_key}`] = expr;
			});
		};
	});
	return exec_dictionary;
};

function expr_dictionary_display(expr_dictionary) {
	
	var expr = ``;
	Object.keys(expr_dictionary).forEach(function(key) {
		
		if(key == `ports`) {
			expr += `\n`;
			const port_dictionary = expr_dictionary[`ports`];
			expr += `#######\n`;
			expr += `# Ports\n`;
			expr += `#######\n`;
			Object.keys(port_dictionary).forEach(function(port_key) {
				expr += `\n`;
				expr += `#===================\n`;
				expr += `# Port: ${port_key}:\n`;
				expr += `#===================\n`;
				const port_cmd_dictionary = port_dictionary[`${port_key}`];
				Object.keys(port_cmd_dictionary).forEach(function(port_cmd_key) {
					expr += `\n`;
					const port_cmd = port_cmd_dictionary[port_cmd_key];
					for(var line_id = 0; line_id < port_cmd.length; ++line_id) {
						expr += `${port_cmd[line_id]}\n`;
					};
				});
				expr += `\n`;
			});
			expr += `#######\n`;
			expr += `#######\n`;
			expr += `#######\n`;
		}
		else {
			expr += `\n`;
			expr += `#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
			expr += `# Tunnel: ${key}:\n`;
			expr += `#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
			const conn_dictionary = expr_dictionary[key];
			Object.keys(conn_dictionary).forEach(function(tun_cmd_key) {
				expr += `\n`;
				const tun_cmd = conn_dictionary[tun_cmd_key];
				for(var line_id = 0; line_id < tun_cmd.length; ++line_id) {
					expr += `${tun_cmd[line_id]}\n`;
				};
			});
		};
	});
	expr += `#============================\n`;
	return expr;
};

function exec_dictionary_display(exec_dictionary) {
	
	var expr = ``;
	Object.keys(exec_dictionary).forEach(function(key) {
		
		if(key == `ports`) {
			expr += `\n`;
			const port_dictionary = exec_dictionary[`ports`];
			expr += `#######\n`;
			expr += `# Ports\n`;
			expr += `#######\n`;
			Object.keys(port_dictionary).forEach(function(port_key) {
				expr += `\n`;
				expr += `#===================\n`;
				expr += `# Port: ${port_key}:\n`;
				expr += `#===================\n`;
				const port_cmd_dictionary = port_dictionary[`${port_key}`];
				Object.keys(port_cmd_dictionary).forEach(function(port_cmd_key) {
					expr += `\n`;
					expr += port_cmd_dictionary[port_cmd_key];
				});
				expr += `\n`;
			});
			expr += `#######\n`;
			expr += `#######\n`;
			expr += `#######\n`;
		}
		else {
			expr += `\n`;
			expr += `#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
			expr += `# Tunnel: ${key}:\n`;
			expr += `#>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
			const conn_dictionary = exec_dictionary[key];
			Object.keys(conn_dictionary).forEach(function(tun_cmd_key) {
				expr += `\n`;
				expr += conn_dictionary[tun_cmd_key];
			});
		};
	});
	expr += `#============================\n`;
	return expr;
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

module.exports = function (remote_ip, remote_user, remote_password) {

	this.mea = new syntax_mea(remote_ip, remote_user, remote_password);
	this.ovs = new syntax_ovs();
	this.netns = new syntax_netns();
	this.libreswan = new syntax_libreswan();
	this.json_cfg = { };
	this.expr_dictionary = { };
	this.exec_dictionary = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
		this.mea.update_cfg(this.json_cfg);
		this.ovs.update_cfg(this.json_cfg);
		this.netns.update_cfg(this.json_cfg);
		this.libreswan.update_cfg(this.json_cfg);
		
		this.expr_dictionary = { };
		var conn_dictionary = { };
		this.expr_dictionary[`ports`] = { };
		for(var protected_port = 104; protected_port <= 107; ++protected_port) {
			this.expr_dictionary[`ports`][`${protected_port}`] = { };
			this.libreswan.port_dictionary_append(this.expr_dictionary[`ports`], protected_port);
			this.mea.port_dictionary_append(this.expr_dictionary[`ports`], protected_port);
			this.ovs.port_dictionary_append(this.expr_dictionary[`ports`], protected_port);
			this.netns.port_dictionary_append(this.expr_dictionary[`ports`], protected_port);
		};
		for(var conn_id = 0; conn_id < this.json_cfg.conns.length; ++conn_id) {
			const conn = this.json_cfg.conns[conn_id];
			const nic_cfg = this.json_cfg.ace_nic_config[0];
			const vpn_cfg = this.json_cfg.vpn_gw_config[0];
			const conn_ns = vpn_conn_ns(vpn_cfg, conn);
			this.expr_dictionary[`${conn_ns}`] = { };
			this.mea.conn_dictionary_append(this.expr_dictionary, conn_id);
			this.ovs.conn_dictionary_append(this.expr_dictionary, conn_id);
			this.netns.conn_dictionary_append(this.expr_dictionary, conn_id);
		};
		this.exec_dictionary = expr_dictionary_serialize(this.expr_dictionary);
    };
	
    this.json_cfg_get = function () {
	
		return this.json_cfg;
    };
	
    this.expr_dictionary_get = function () {
	
		return this.expr_dictionary;
    };
	
    this.expr_dictionary_display = function () {
	
		return expr_dictionary_display(this.expr_dictionary);
    };
	
    this.exec_dictionary_display = function () {
	
		return exec_dictionary_display(this.exec_dictionary);
    };
	
    this.load_config = function () {
	
		this.mea.load_conns_config();
    };
	
    this.mea_exec = function (ns, env, expr_key) {
	
		this.mea.conn_exec(this.exec_dictionary, ns, env, expr_key);
    };
	
    this.libreswan_exec = function (ns, env, expr_key) {
	
		this.libreswan.conn_exec(this.exec_dictionary, ns, env, expr_key);
    };
};
