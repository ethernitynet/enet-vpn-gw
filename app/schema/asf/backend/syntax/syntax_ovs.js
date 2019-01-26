
/////////////////////////////////////
/////////////////////////////////////
// ovs
/////////////////////////////////////
/////////////////////////////////////

function ovs_expr_conn_add_ctl_by_vlan(expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];

	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Add Control-Plane Forwarding (by VLAN): ${vpn_cfg.vpn_gw_ip}@${port}'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=127,dl_vlan=${port}`, `strip_vlan,output:${port}`, 100));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=${port}`, `push_vlan:0x8100,mod_vlan_vid=${port},output:127`, 100));
};

function ovs_expr_conn_add_ctl_by_mac(expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];

	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Add Control-Plane Forwarding (by MAC): ${vpn_cfg.vpn_gw_ip}@${port}'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=127,dl_dst=${gw_port_mac(nic_cfg, port)}`, `strip_vlan,output:${port}`, 100));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=${port}`, `mod_dl_src=${gw_port_mac(nic_cfg, port)},output:127`, 100));
};

function ovs_expr_conn_add_ctl(expr_key, expr_path, expr_arr, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	ovs_expr_conn_add_ctl_by_mac(expr_arr, cfg, port);
};

function ovs_expr_conn_del_outbound(expr_key, expr_path, expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_dev = tun_ns_dev(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Delete Outbound Tunnel (HW offload: ${conn.outbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=127,dl_vlan=${conn.lan_port},dl_type=0x0806,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=${conn.tunnel_port},dl_src=${ns_mac},dl_type=0x0806,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`));
};

function ovs_expr_conn_add_outbound(expr_key, expr_path, expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_key}`);
	expr_arr.push(`############################`);
	expr_arr.push(`# ${expr_path}`);
	expr_arr.push(`############################`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Add Outbound Tunnel (HW offload: ${conn.outbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=127,dl_vlan=${conn.lan_port},dl_type=0x0806,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`, `strip_vlan,output:${conn.tunnel_port}`, 2000));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=${conn.tunnel_port},dl_src=${ns_mac},dl_type=0x0806,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`, `push_vlan:0x8100,mod_vlan_vid=${conn.lan_port},output:127`, 2000));
};

function ovs_expr_conn_del_outbound_no_offload(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const ovs_shared_dir = `/shared/${gw_inst}/conns/${ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/ovs_del.sh'`);
	expr_arr.push(`ovs_del() {`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Delete Outbound Tunnel (HW offload: ${conn.outbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=127,dl_vlan=${conn.lan_port},dl_type=0x0806,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=${conn.tunnel_port},dl_src=${ns_mac},dl_type=0x0806,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=127,dl_vlan=${conn.lan_port},ip,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'del-flows', `in_port=${conn.tunnel_port},dl_src=${ns_mac},ip,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`));
	expr_arr.push(`}`);
};

function ovs_expr_conn_add_outbound_no_offload(expr_arr, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const ns_mac = tun_ns_mac(nic_cfg, conn);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const ovs_shared_dir = `/shared/${gw_inst}/conns/${ns}`;

	expr_arr.push(`#!/bin/bash`);
	expr_arr.push(`# enet${nic_cfg.nic_name}-vpn:${ovs_shared_dir}/ovs_add.sh'`);
	expr_arr.push(`ovs_add() {`);
	expr_arr.push(`  sleep ${delay_long}`);
	expr_arr.push(`  echo 'ovs# Add Outbound Tunnel (HW offload: ${conn.outbound_accel}): ${vpn_cfg.vpn_gw_ip}>>${conn.remote_tunnel_endpoint_ip}[${ns}]'`);
	expr_arr.push(`  echo '=================================================================='`);
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=127,dl_vlan=${conn.lan_port},dl_type=0x0806,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`, `strip_vlan,output:${conn.tunnel_port}`, 1000));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=${conn.tunnel_port},dl_src=${ns_mac},dl_type=0x0806,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`, `push_vlan:0x8100,mod_vlan_vid=${conn.lan_port},output:127`, 1000));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=127,dl_vlan=${conn.lan_port},ip,nw_src=${conn.local_subnet},nw_dst=${conn.remote_subnet}`, `strip_vlan,output:${conn.tunnel_port}`, 1000));
	expr_arr.push(`  ` + ovs_of_wrapper(nic_cfg, 'add-flow', `in_port=${conn.tunnel_port},dl_src=${ns_mac},ip,nw_src=${conn.remote_subnet},nw_dst=${conn.local_subnet}`, `push_vlan:0x8100,mod_vlan_vid=${conn.lan_port},output:127`, 1000));
	expr_arr.push(`}`);
};


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function port_dictionary_append_ovs(port_dictionary, cfg, port) {

	const nic_cfg = cfg.ace_nic_config[0];
	const gw_inst = enet_gw_inst(nic_cfg, port);
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const expr_dir = `/shared/${gw_inst}`;
	
	var expr_arr = [];
	expr_arr = []; ovs_expr_conn_add_ctl(`ovs_add_ctl`, `${vpn_inst}:${expr_dir}/ovs_add_ctl`, expr_arr, cfg, port); port_dictionary[`${port}`][`ovs_add_ctl`] = expr_arr;
};

function conn_dictionary_append_ovs(conn_dictionary, cfg, conn_id) {

	const nic_cfg = cfg.ace_nic_config[0];
	const conn = cfg.conns[conn_id];
	const ns = tun_ns(nic_cfg, conn);
	const gw_inst = enet_gw_inst(nic_cfg, conn.tunnel_port);
	const vpn_inst = enet_vpn_inst(nic_cfg);
	const expr_dir = `/shared/${gw_inst}/conns/${ns}`;
	
	var expr_arr = [];
	expr_arr = []; ovs_expr_conn_del_outbound(`ovs_del`, `${vpn_inst}:${expr_dir}/ovs_del`, expr_arr, cfg, conn_id); conn_dictionary[`${ns}`][`ovs_del`] = expr_arr;
	expr_arr = []; ovs_expr_conn_add_outbound(`ovs_add`, `${vpn_inst}:${expr_dir}/ovs_add`, expr_arr, cfg, conn_id); conn_dictionary[`${ns}`][`ovs_add`] = expr_arr;
};

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

module.exports = function () {

	this.json_cfg = { };
	
    this.update_cfg = function (json_cfg) {
	
		this.json_cfg = json_cfg;
    };
	
    this.port_dictionary_append = function (port_dictionary, port) {
	
		port_dictionary_append_ovs(port_dictionary, this.json_cfg, port);
    };
	
    this.conn_dictionary_append = function (conn_dictionary, conn_id) {
	
		conn_dictionary_append_ovs(conn_dictionary, this.json_cfg, conn_id);
    };
};
