
/////////////////////////////////////
/////////////////////////////////////
// netns
/////////////////////////////////////
/////////////////////////////////////

function netns_expr_conn_del_all(expr_key, expr_path, expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const netns_shared_dir = `/shared/conns`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'netns# Delete All Connection Namespaces:'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  for NS in $(ip netns)`);
	expr_arr.push(`  do`);
	expr_arr.push(`    for NS_DEV in $(ip netns exec \${NS} ip link | grep -vw lo | sed -n 's~^[0-9][0-9]*\\:\s\\(.*\\)\\:\\s.*$~\\1~p')`);
	expr_arr.push(`    do`);
	expr_arr.push(`      ip netns exec \${NS} ip link set \${NS_DEV} netns 1`);
	expr_arr.push(`      ip link del \${NS_DEV}`);
	expr_arr.push(`    done`);
	expr_arr.push(`    ip netns del \${NS}`);
	expr_arr.push(`  done`);
};

function netns_expr_fwd_get(expr_key, expr_path, expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const gw_inst = enet_gw_inst(nic_cfg, port);

	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  ` + log_wrapper(`netns# Get All Forwarding Rules: ${gw_inst}`));
	expr_arr.push(`  ` + log_wrapper(`==================================================================`));
	expr_arr.push(`  for NS in $(ip netns)`);
	expr_arr.push(`  do`);
	expr_arr.push(`    ip netns exec \${NS} ip neigh | sed -n 's~^\\([0-9\\.][0-9\\.]*\\) dev macv\\([0-9a-fA-F]\\)\\([0-9a-fA-F][0-9a-fA-F]\\) lladdr \\([0-9a-fA-F\\:][0-9a-fA-F\\:]*\\) .*$~TUN_ID=\\2\\3;LAN_IP=\\1;LAN_MAC=\\4;NS_MAC=${enet_mac_prefix}\\2:\\3:${nic_cfg.nic_name}${port - port_offset};LAN_PORT=10\\2;~p'`);
	expr_arr.push(`  done`);
};

function netns_expr_conn_del(expr_key, expr_path, expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const ns_dev = conn_ns_dev(vpn_cfg, conn);

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'netns# Delete Connection Namespace: ${vpn_cfg.vpn_gw_ip}:${conn.remote_tunnel_endpoint_ip}[${conn_ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip link set ${ns_dev} netns 1`);
	expr_arr.push(`  ip link del ${ns_dev}`);
	expr_arr.push(`  ip netns del ${conn_ns}`);
};

function netns_expr_conn_add(expr_key, expr_path, expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const ns_dev = conn_ns_dev(vpn_cfg, conn);
	const ns_mac = conn_ns_mac(nic_cfg, vpn_cfg, conn);
	const ns_ip = tun_ns_ip(nic_cfg, conn);
	const gw_dev = tun_gw_dev(nic_cfg, conn);

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'netns# Add Connection Namespace: ${vpn_cfg.vpn_gw_ip}:${conn.remote_tunnel_endpoint_ip}[${conn_ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ip netns add ${conn_ns}`);
	expr_arr.push(`  ip link add link ${gw_dev} ${ns_dev} address ${ns_mac} type macvlan mode bridge`);
	expr_arr.push(`  ip link set dev ${ns_dev} netns ${conn_ns}`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip link set dev ${ns_dev} up`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip link set dev lo up`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip addr add ${ns_ip} dev ${ns_dev}`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip route add local ${conn.remote_subnet} dev lo`);
	expr_arr.push(`  ip netns exec ${conn_ns} ip route add ${conn.local_subnet} dev ${ns_dev}`);
};


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function port_dictionary_append_netns(port_dictionary, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const expr_dir = `/shared/conns`;
	
	var expr_arr = [];
	expr_arr = []; netns_expr_conn_del_all(`netns_del_all`, `${gw_inst}:${expr_dir}/netns_del_all`, expr_arr, cfg, port); port_dictionary[`${port}`][`netns_del_all`] = expr_arr;
	expr_arr = []; netns_expr_fwd_get(`netns_fwd_get`, `${gw_inst}:${expr_dir}/netns_fwd_get`, expr_arr, cfg, port); port_dictionary[`${port}`][`netns_fwd_get`] = expr_arr;
};

function conn_dictionary_append_netns(conn_dictionary, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const expr_dir = `/shared/conns/${conn_ns}`;
	
	var expr_arr = [];
	expr_arr = []; netns_expr_conn_del(`netns_del`, `${gw_inst}:${expr_dir}/netns_del`, expr_arr, cfg, conn_id); conn_dictionary[`${conn_ns}`][`netns_del`] = expr_arr;
	expr_arr = []; netns_expr_conn_add(`netns_add`, `${gw_inst}:${expr_dir}/netns_add`, expr_arr, cfg, conn_id); conn_dictionary[`${conn_ns}`][`netns_add`] = expr_arr;
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

module.exports = function () {

	this.json_cfg = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
    };
	
    this.port_dictionary_append = function (port_dictionary, port) {
	
		port_dictionary_append_netns(port_dictionary, this.json_cfg, port);
    };
	
    this.conn_dictionary_append = function (conn_dictionary, conn_id) {
	
		conn_dictionary_append_netns(conn_dictionary, this.json_cfg, conn_id);
    };
	
    this.port_exec = function (mea_inst, exec_dictionary, port, env, expr_key) {
	
		mea_inst.gw_exec(exec_dictionary, port, env, expr_key);
    };
};
