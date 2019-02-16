/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

const enet_mac_pfx = `CC:D3:9D:D`;
const mea_host_port = 127;
const mea_cipher_port = 104;
const mea_lan_ports = [ 105, 106 ];
const mea_tunnel_port = 107;

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

var ip_to_dec = function (ip) {
	
	// a not-perfect regex for checking a valid ip address
	// It checks for (1) 4 numbers between 0 and 3 digits each separated by dots (IPv4)
	// or (2) 6 numbers between 0 and 3 digits each separated by dots (IPv6)
	var ip_regex = /^(\d{0,3}\.){3}.(\d{0,3})$|^(\d{0,3}\.){5}.(\d{0,3})$/;
	var valid = ip_regex.test(ip);
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

var hex_to_uint32 = function (hex_num) {
	
	return parseInt(hex_num, 16);
};

var ip_to_hex = function (ip) {
	
	const ip_dec = ip_to_dec(ip);
	return uint32_to_hex(ip_dec);
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

var vpn_conn_ns = function (cfg, conn_id) {
	
	const vpn_cfg = cfg.vpn_gw_config[0];
	const conn_cfg = cfg.conns[conn_id];
	
	const conn_ns = `${vpn_cfg.vpn_gw_ip}:${conn_cfg.remote_tunnel_endpoint_ip}[v-${conn_cfg.local_subnet}@${conn_cfg.lan_port}:${conn_cfg.remote_subnet}@${conn_cfg.tunnel_port}]`;
	return conn_ns.replace(/\//g, '#');
};

var vpn_conn_hash = function (cfg, conn_id) {
	
	const conn_ns = vpn_conn_ns(cfg, conn_id);
	
	return str_hash(`${conn_ns}`, 24);
};

var vpn_conn_tag_base = function (conn_id) {
	
	return (64 + conn_id);
};

var vpn_conn_tag_hex_base = function (conn_id) {
	
	const conn_tag = vpn_conn_tag_base(conn_id);
	const conn_tag_hex = uint32_to_hex(conn_tag);
	
	return conn_tag_hex.substring(conn_tag_hex.length - 2);
};

var vpn_conn_mac_base = function (nic_id, conn_id, tunnel_port) {
	
	const conn_tag_hex = vpn_conn_tag_hex_base(conn_id);
	
	return `${enet_mac_pfx}1:${conn_tag_hex}:${nic_id}${tunnel_port - 100}`;
};

var vpn_conn_tag = function (cfg, conn_state) {
	
	return vpn_conn_tag_base(conn_state.id);
};

var vpn_conn_tag_hex = function (cfg, conn_state) {
	
	return vpn_conn_tag_hex_base(conn_state.id);
};

var vpn_conn_mac = function (cfg, conn_state) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cfg.conns[conn_state.id];
	
	return vpn_conn_mac_base(nic_id, conn_state.id, conn_cfg.tunnel_port);
};

const hexc = [ `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `A`, `B`, `C`, `D`, `E`, `F` ];

var mea_port_macs = function (nic_id) {
	
	const port_macs = {
		24: `${enet_mac_pfx}0:00:${hexc[10 + nic_id]}4`,
		27: `${enet_mac_pfx}0:00:${hexc[10 + nic_id]}7`,
		104: `${enet_mac_pfx}0:00:04`,
		105: `${enet_mac_pfx}0:00:05`,
		106: `${enet_mac_pfx}0:00:06`,
		107: `${enet_mac_pfx}0:00:07`
	};
	return port_macs;
};

var mea_ipsec_format_keys = function (auth_key, cipher_key) {
	
	var tunnel_keys = {
		integrity_key: `0x0000000000000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		integrity_iv: `0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_key: `0x${cipher_key.substring(0, 8)} 0x${cipher_key.substring(8, 16)} 0x${cipher_key.substring(16, 24)} 0x${cipher_key.substring(24, 32)} 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_iv: `0x${cipher_key.substring(32, 40)} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`
	};
	return tunnel_keys;
};

var mea_ipsec_format_security_type = function (auth_algo, cipher_algo) {
	
	return `0xCA`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

