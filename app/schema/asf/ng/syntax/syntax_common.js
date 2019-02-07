
/////////////////////////////////////
/////////////////////////////////////
// common
/////////////////////////////////////
/////////////////////////////////////

const delay_long = 0.1;
const delay_short = 0.05;
const port_offset = 100;
const enet_mac_prefix = `CC:D3:9D:D`;

const ws_pattern = '\\s\\s*';
const dec_pattern = '[0-9][0-9]*';
const txt_pattern = '[0-9a-zA-Z][0-9a-zA-Z]*';

var log_wrapper = function (expr) {

	return `(>&2 echo "${expr}")`;
};

const mask_arr = [
	0x0000000000000000,
	0x0000000080000000,
	0x00000000C0000000,
	0x00000000E0000000,
	0x00000000F0000000,
	0x00000000F8000000,
	0x00000000FC000000,
	0x00000000FE000000,
	0x00000000FF000000,
	0x00000000FF800000,
	0x00000000FFC00000,
	0x00000000FFE00000,
	0x00000000FFF00000,
	0x00000000FFF80000,
	0x00000000FFFC0000,
	0x00000000FFFE0000,
	0x00000000FFFF0000,
	0x00000000FFFF8000,
	0x00000000FFFFC000,
	0x00000000FFFFE000,
	0x00000000FFFFF000,
	0x00000000FFFFF800,
	0x00000000FFFFFC00,
	0x00000000FFFFFE00,
	0x00000000FFFFFF00,
	0x00000000FFFFFF80,
	0x00000000FFFFFFC0,
	0x00000000FFFFFFE0,
	0x00000000FFFFFFF0,
	0x00000000FFFFFFF8,
	0x00000000FFFFFFFC,
	0x00000000FFFFFFFE,
	0x00000000FFFFFFFF
    ];

var uint32_mask = function (num, mask_bits) {
	
	return (num & mask_arr[mask_bits]) >>> 0;
};

var str_hash = function (str, mask_bits) {
	
	var hash = 5381;
	var i = str.length;

	while(i) {
		hash = (hash * 33) ^ str.charCodeAt(--i);
	};
	const hash_32 = hash >>> 0;
	const hash_32_masked = uint32_mask(hash_32, mask_bits);
	return hash_32_masked.toString(16).toUpperCase();
};

var ntoh_32_expr_append = function (expr_arr, var_name) {

	expr_arr.push(`  VAR_HEX=$(printf '%08x' \${${var_name}})`);
	expr_arr.push(`  ${var_name}_NTOH=$(printf '%u' "0x\${VAR_HEX:6:2}\${VAR_HEX:4:2}\${VAR_HEX:2:2}\${VAR_HEX:0:2}")`);
};

var uint32_hex_expr_append = function (expr_arr, var_name) {

	expr_arr.push(`  ${var_name}_HEX=$(printf '%08x' \${${var_name}})`);
};

var ip_to_dec = function (ip) {
	
	// a not-perfect regex for checking a valid ip address
	// It checks for (1) 4 numbers between 0 and 3 digits each separated by dots (IPv4)
	// or (2) 6 numbers between 0 and 3 digits each separated by dots (IPv6)
	var ipAddressRegEx = /^(\d{0,3}\.){3}.(\d{0,3})$|^(\d{0,3}\.){5}.(\d{0,3})$/;
	var valid = ipAddressRegEx.test(ip);
	if (!valid) {
		return 0;
	};
	var dots = ip.split('.');
	// make sure each value is between 0 and 255
	for (var i = 0; i < dots.length; i++) {
		var dot = dots[i];
		if (dot > 255 || dot < 0) {
			return 0;
		};
	};
	if (dots.length == 4) {
		// IPv4
		return ((((((+dots[0])*256)+(+dots[1]))*256)+(+dots[2]))*256)+(+dots[3]) >>> 0;
		} else if (dots.length == 6) {
		// IPv6
		return ((((((((+dots[0])*256)+(+dots[1]))*256)+(+dots[2]))*256)+(+dots[3])*256)+(+dots[4])*256)+(+dots[5]) >>> 0;
	};
	return 0;
};

var uint32_to_hex = function (num) {
	
	var num_hex = '00000000' + num.toString(16);
	num_hex = num_hex.substring(num_hex.length - 8);	
	return num_hex;
};

var ip_to_hex = function (ip) {
	
	const ip_dec = ip_to_dec(ip);
	return uint32_to_hex(ip_dec);
};

var vpn_conn_ns = function (vpn_cfg, conn) {
	
	const conn_ns = `${vpn_cfg.vpn_gw_ip}:${conn.remote_tunnel_endpoint_ip}[t-${conn.local_subnet}@${conn.lan_port}:${conn.remote_subnet}@${conn.tunnel_port}]`;
	return conn_ns.replace(/\//g, '#');
};

var conn_ns_hash = function (vpn_cfg, conn) {
	
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	
	return str_hash(`${conn_ns}`, 24);
};

var conn_ns_tag_hex = function (vpn_cfg, conn) {
	
	const hash_str = conn_ns_hash(vpn_cfg, conn);
	
	//return `${conn.lan_port - port_offset - 4}${hash_str.substring(4, 6)}`;
	return `${hash_str.substring(4, 6)}`;
};


var conn_ns_tag_dec = function (vpn_cfg, conn) {
	
	const ns_tag_hex = conn_ns_tag_hex(vpn_cfg, conn);
	var char_code_high = (ns_tag_hex.charCodeAt(0) - 48);
	char_code_high = (char_code_high > 9) ? (char_code_high - 7) : char_code_high;
	var char_code_low = (ns_tag_hex.charCodeAt(1) - 48);
	char_code_low = (char_code_low > 9) ? (char_code_low - 7) : char_code_low;
	return ((char_code_high * 16) + char_code_low);
};

var conn_ns_dev = function (vpn_cfg, conn) {
	
	const hash_str = conn_ns_hash(vpn_cfg, conn);
	const ns_tag_hex = conn_ns_tag_hex(vpn_cfg, conn);
	
	return `macv1${ns_tag_hex}`;
};

var conn_ns_mac = function (nic_cfg, vpn_cfg, conn) {
	
	const hash_str = conn_ns_hash(vpn_cfg, conn);
	
	return `${enet_mac_prefix}${conn.lan_port - port_offset}:${hash_str.substring(4, 6)}:${nic_cfg.nic_name}${conn.tunnel_port - port_offset}`;
};

/*
var tun_ns = function (nic_cfg, conn) {
	
	const ns_name = `o-${conn.local_subnet}@${conn.lan_port}:${conn.remote_subnet}@${conn.tunnel_port}`;
	return ns_name.replace(/\//g, '#');
};

var tun_inbound_ns = function (nic_cfg, conn) {
	
	const ns_name = `i-${conn.remote_subnet}@${conn.tunnel_port}:${conn.local_subnet}@${conn.lan_port}`;
	return ns_name.replace(/\//g, '#');
};

var tun_ns_hash = function (nic_cfg, conn) {
	
	return str_hash(conn.local_subnet + '>>' + conn.remote_subnet, 24);
};

var tun_ns_dev = function (nic_cfg, conn) {
	
	const hash_str = tun_ns_hash(nic_cfg, conn);
	return `macv${conn.lan_port - port_offset}${hash_str.substring(4, 6)}`;
};

var tun_ns_mac = function (nic_cfg, conn) {
	
	const hash_str = tun_ns_hash(nic_cfg, conn);
	return `${enet_mac_prefix}${conn.lan_port - port_offset}:${hash_str.substring(4, 6)}:${nic_cfg.nic_name}${conn.tunnel_port - port_offset}`;
};
*/

var internal_port_mac = function (nic_cfg, internal_port) {
	
	return `${enet_mac_prefix}0:00:${parseInt(nic_cfg.nic_name, 10) + 2}${internal_port - 20}`;
};

var gw_port_mac = function (nic_cfg, port) {
	
	return `${enet_mac_prefix}0:00:${nic_cfg.nic_name}${port - port_offset}`;
};

var tun_ns_ip = function (nic_cfg, conn) {

	const cidr = conn.local_subnet.split('/');
	const ns_net_dec = uint32_mask(ip_to_dec(cidr[0]), cidr[1]);
	var ns_ip_hex = '00000000' + (ns_net_dec + 1).toString(16);
	ns_ip_hex = ns_ip_hex.substring(ns_ip_hex.length - 8);
	const ns_ip = parseInt(ns_ip_hex.substring(0, 2), 16) + '.' + parseInt(ns_ip_hex.substring(2, 4), 16) + '.' + parseInt(ns_ip_hex.substring(4, 6), 16) + '.' + parseInt(ns_ip_hex.substring(6, 8), 16) + '/' + cidr[1];
	return ns_ip;
};

var enet_gw_inst = function (nic_cfg, port) {
	
	return `enet${nic_cfg.nic_name}_libreswan${port}`;
};

var enet_port_shared_dir = function (nic_cfg, port) {
	
	const gw_inst = enet_gw_inst(nic_cfg, port);
	
	return `${process.env.VPN_SHARED_DIR}/${gw_inst}`;
};

var enet_conn_shared_dir = function (nic_cfg, conn) {
	
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	
	return `${process.env.VPN_SHARED_DIR}/conns/${conn_ns}`;
};

var enet_port_host_dir = function (nic_cfg, port) {
	
	const gw_inst = enet_gw_inst(nic_cfg, port);
	
	return `${process.env.HOST_SHARED_DIR}/${gw_inst}`;
};

var enet_conn_host_dir = function (nic_cfg, conn) {
	
	const conn_ns = vpn_conn_ns(vpn_cfg, conn);
	
	return `${process.env.HOST_SHARED_DIR}/conns/${conn_ns}`;
};

var enet_vpn_inst = function (nic_cfg) {
	
	return `enet${nic_cfg.nic_name}-vpn`;
};

var tun_gw_dev = function (nic_cfg, conn) {
	
	return `e${nic_cfg.nic_name}ls${conn.tunnel_port}`;
};

var ovs_of_wrapper = function (nic_cfg, cmd, match_expr, action_expr, priority) {
	
	if((cmd == 'add-flow') && (action_expr != undefined) && (priority != undefined)) {
		return `sleep ${delay_short}; ovs-ofctl -O OpenFlow13 add-flow vpnbr${nic_cfg.nic_name} priority=${priority},${match_expr},actions=${action_expr}`;
	}
	else if((cmd == 'del-flows') && (action_expr == undefined) && (priority == undefined)) {
		return `sleep ${delay_short}; ovs-ofctl -O OpenFlow13 del-flows vpnbr${nic_cfg.nic_name} ${match_expr}`;
	};
	return '';
};

var mea_wrapper = function (nic_cfg, expr) {
	
	if(nic_cfg.nic_name > 0) {
		var expr = `meaCli top; sleep ${delay_short}; MEA_CMD='meaCli -card ${nic_cfg.nic_name} mea '"${expr}"; MEA_RESULT=$(eval "\${MEA_CMD}")`;
		expr += `;`;
		expr += log_wrapper(`[MEA_CMD="\${MEA_CMD}"  ]`);
		expr += `;`;
		expr += log_wrapper(`[MEA_RESULT="\${MEA_RESULT}"  ]`);
		return expr;
	}
	else {
		var expr = `meaCli top; sleep ${delay_short}; MEA_CMD='meaCli mea '"${expr}"; MEA_RESULT=$(eval "\${MEA_CMD}")`;
		expr += `;`;
		expr += log_wrapper(`[MEA_CMD="\${MEA_CMD}"  ]`);
		expr += `;`;
		expr += log_wrapper(`[MEA_RESULT="\${MEA_RESULT}"  ]`);
		return expr;
	};
};

var docker_wrapper = function (nic_cfg, conn, docker_env, expr) {
	
	return `DOCKER_RESULT=$(docker exec enet${nic_cfg.nic_name}_libreswan${conn.tunnel_port} ${docker_env} ${expr})`;
};

var ssh_wrapper_append = function (expr_arr, nic_cfg, conn, ssh_env, expr) {
	
	expr_arr.push(`sshpass -p \${TGT_PASS} ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no \${TGT_USER}@\${TGT_IP} /bin/bash -c "${ssh_env} ${expr}"`);
};

var expr_arr_serialize = function (expr_arr) {
	
	var expr = '';
	const expr_lines = expr_arr.length;
	for(var i = 0; i < expr_lines; ++i) {
		expr += expr_arr[i] + '\n';
	};

	return expr;	
};
