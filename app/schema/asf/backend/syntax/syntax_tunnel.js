
/////////////////////////////////////
/////////////////////////////////////
// Tunnel
/////////////////////////////////////
/////////////////////////////////////

function expr_outbound_tunnel_del(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const netns_shared_dir = `/shared/conns/${ns}`;
	const ovs_shared_dir = `/shared/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${ns}`;
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/enet${nic_cfg.nic_name}-vpn/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/tunnel_del.sh`);
	expr_arr.push(`tunnel_del() {`);
	expr_arr.push(`  echo 'TUNNEL# Delete Outbound Tunnel: ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
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
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const netns_shared_dir = `/shared/conns/${ns}`;
	const ovs_shared_dir = `/shared/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${ns}`;
	const mea_shared_dir = `${nic_cfg.install_dir}/shared/enet${nic_cfg.nic_name}-vpn/enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port}/conns/${ns}`;
	const mea_env = `SPI=\${SPI} AUTH_ALGO=\${AUTH_ALGO} AUTH_KEY=\${AUTH_KEY} CIPHER_ALGO=\${CIPHER_ALGO} CIPHER_KEY=\${CIPHER_KEY}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/tunnel_add.sh`);
	expr_arr.push(`tunnel_add() {`);
	expr_arr.push(`  echo 'TUNNEL# Add Outbound Tunnel: ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	ssh_wrapper_append(expr_arr, nic_cfg, conn, '', docker_wrapper(nic_cfg, conn, '', `${netns_shared_dir}/netns_add.sh`));
	ssh_wrapper_append(expr_arr, nic_cfg, conn, mea_env, `${mea_shared_dir}/mea_add.sh`);
	expr_arr.push(`  ${ovs_shared_dir}/ovs_add.sh`);
	expr_arr.push(`}`);
};

function conn_dictionary_append(conn_dictionary, cfg, conn_id) {
	
	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);

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
	conn_dictionary[`${ns}`] = conn_expr;
};

function expr_dictionary_append_conn(expr_dictionary, conn_dictionary, cfg, conn_id) {
	
	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);

	expr_dictionary[`${ns}`] = { };
	expr_dictionary[`${ns}`][`netns_del`] = expr_arr_serialize(conn_dictionary[`${ns}`][`netns_del`]);
	expr_dictionary[`${ns}`][`ovs_del`] = expr_arr_serialize(conn_dictionary[`${ns}`][`ovs_del`]);
	expr_dictionary[`${ns}`][`tun_del`] = expr_arr_serialize(conn_dictionary[`${ns}`][`tun_del`]);
	expr_dictionary[`${ns}`][`netns_add`] = expr_arr_serialize(conn_dictionary[`${ns}`][`netns_add`]);
	expr_dictionary[`${ns}`][`mea_add`] = expr_arr_serialize(conn_dictionary[`${ns}`][`mea_add`]);
	expr_dictionary[`${ns}`][`mea_add_in`] = expr_arr_serialize(conn_dictionary[`${ns}`][`mea_add_in`]);
	expr_dictionary[`${ns}`][`ovs_add`] = expr_arr_serialize(conn_dictionary[`${ns}`][`ovs_add`]);
	expr_dictionary[`${ns}`][`tun_add`] = expr_arr_serialize(conn_dictionary[`${ns}`][`tun_add`]);
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
		const ns = tun_ns(nic_cfg, conn);
		expr_dictionary[`${ns}`] = { };
		conn_dictionary_append_mea(expr_dictionary, cfg, conn_id);
		conn_dictionary_append_ovs(expr_dictionary, cfg, conn_id);
		conn_dictionary_append_netns(expr_dictionary, cfg, conn_id);
	};
	return expr_dictionary;
};

function expr_dictionary_display(expr_dictionary) {
	
	var expr = ``;
	Object.keys(expr_dictionary).forEach(function(key) {
		
		if(key == `ports`) {
			expr += `\n`;
			const port_dictionary = expr_dictionary[`ports`];
			Object.keys(port_dictionary).forEach(function(port_key) {
				expr += `\n`;
				expr += `#===================\n`;
				expr += `# Port: ${port_key}:\n`;
				expr += `#===================\n`;
				const port_cmd_dictionary = port_dictionary[`${port_key}`];
				Object.keys(port_cmd_dictionary).forEach(function(port_cmd_key) {
					expr += `\n`;
					expr += `    ###########################\n`;
					expr += `    # Command: ${port_cmd_key}:\n`;
					expr += `    ###########################\n`;
					const port_cmd = port_cmd_dictionary[port_cmd_key];
					for(var line_id = 0; line_id < port_cmd.length; ++line_id) {
						expr += `${port_cmd[line_id]}\n`;
					};
				});
				expr += `\n`;
				expr += port_dictionary[`ipsec.secrets`];
			});
		}
		else {
			expr += `##########################\n`;
			expr += `# Tunnel: ${key}:\n`;
			expr += `##########################\n`;
			const conn_dictionary = expr_dictionary[key];
			Object.keys(conn_dictionary).forEach(function(tun_cmd_key) {
				expr += `\n`;
				expr += `    ##########################\n`;
				expr += `    # Command: ${tun_cmd_key}:\n`;
				expr += `    ##########################\n`;
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
