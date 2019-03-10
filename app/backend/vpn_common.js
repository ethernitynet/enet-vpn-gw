
(function(exports) {

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var bitwise_and = function (x, y) {
	
	return (x & y);
};

var bitwise_xor = function (x, y) {
	
	return (x ^ y);
};

var bitwise_shift_right = function (x, bits) {
	
	return (x >>> bits);
};

var to_unsigned = function (x) {
	
	return bitwise_shift_right(x, 0);
};

var influxdb_error_count = 0;
var influxdb_success_count = 0;


const mea_host_port_local = 127;
const mea_cipher_port_local = 104;
const mea_tunnel_port_local = 107;
const mea_lan_ports_local = [ 105, 106 ];

const enet_mac_pfx_local = `CC:D3:9D:D`;

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
	
	var mask = bitwise_and(num, mask_arr[mask_bits]);
	mask = to_unsigned(mask);
	return mask;
};

var ip_to_dec = function (ip) {
	
	// a not-perfect regex for checking a valid ip address
	// It checks for (1) 4 numbers between 0 and 3 digits each separated by dots (IPv4)
	// or (2) 6 numbers between 0 and 3 digits each separated by dots (IPv6)
	var ip_regex = /^(\d{0,3}\.){3}.(\d{0,3})$|^(\d{0,3}\.){5}.(\d{0,3})$/;
	var valid = ip_regex.test(ip);
	if (!valid) {
		return 0;
	}
	var dots = ip.split('.');
	// make sure each value is between 0 and 255
	for (var i = 0; i < dots.length; i++) {
		var dot = dots[i];
		if (dot > 255 || dot < 0) {
			return 0;
		}
	}
	if (dots.length === 4) {
		// IPv4
		return to_unsigned( ((((((+dots[0]) * 256) + (+dots[1])) * 256) + (+dots[2])) * 256) + (+dots[3]) );
		} else if (dots.length === 6) {
		// IPv6
		return to_unsigned( ((((((((+dots[0]) * 256) + (+dots[1])) * 256) + (+dots[2])) * 256) + (+dots[3]) * 256) + (+dots[4]) * 256) + (+dots[5]) );
	}
	return 0;
};

var uint32_to_hex_local = function (num) {
	
	var num_hex = '00000000' + num.toString(16);
	num_hex = num_hex.substring(num_hex.length - 8);	
	return num_hex;
};

exports.hex_to_uint32 = function (hex_num) {
	
	return parseInt(hex_num, 16);
};

var str_hash = function (str, mask_bits) {
	
	var hash = 5381;
	var i = str.length;

	while(i) {
		hash = bitwise_xor((hash * 33), str.charCodeAt(--i));
	}
	const hash_32 = to_unsigned(hash);
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

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var mea_cli_local = function (nic_id) {

	if(nic_id > 0) {
		return `meaCli -card ${nic_id} mea`;
	}
	else {
		return `meaCli mea`;
	}
};

var vpn_conn_tag_base = function (conn_id) {
	
	return (64 + conn_id);
};

var vpn_conn_tag_hex_base_local = function (conn_id) {
	
	const conn_tag = vpn_conn_tag_base(conn_id);
	const conn_tag_hex = uint32_to_hex_local(conn_tag);
	
	return conn_tag_hex.substring(conn_tag_hex.length - 2);
};

var vpn_conn_mac_base_local = function (nic_id, conn_id, tunnel_port) {
	
	const conn_tag_hex = vpn_conn_tag_hex_base_local(conn_id);
	
	return `${enet_mac_pfx_local}1:${conn_tag_hex}:${nic_id}${tunnel_port - 100}`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

exports.ip_to_hex = function (ip) {
	
	const ip_dec = ip_to_dec(ip);
	return uint32_to_hex_local(ip_dec);
};

exports.uint32_to_hex = function (num) {
	
	return uint32_to_hex_local(num);
};

exports.vpn_conn_tag_hex_base = function (conn_id) {
	
	return vpn_conn_tag_hex_base_local(conn_id);
};

exports.vpn_conn_mac_base = function (nic_id, conn_id, tunnel_port) {
	
	return vpn_conn_mac_base_local(nic_id, conn_id, tunnel_port);
};

exports.vpn_conn_tag = function (cfg, tunnel_state) {
	
	return vpn_conn_tag_base(tunnel_state.conn_id);
};

exports.vpn_conn_tag_hex = function (cfg, tunnel_state) {
	
	return vpn_conn_tag_hex_base_local(tunnel_state.conn_id);
};

exports.vpn_conn_mac = function (cfg, tunnel_state) {
	
	const nic_id = cfg.ace_nic_config[0].nic_name;
	const conn_cfg = cfg.conns[tunnel_state.conn_id];
	
	return vpn_conn_mac_base_local(nic_id, tunnel_state.conn_id, conn_cfg.tunnel_port);
};

const hexc = [ `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `A`, `B`, `C`, `D`, `E`, `F` ];

exports.mea_port_macs = function (nic_id) {
	
	const port_macs = {
		24: `${enet_mac_pfx_local}0:00:${hexc[10 + nic_id]}4`,
		27: `${enet_mac_pfx_local}0:00:${hexc[10 + nic_id]}7`,
		104: `${enet_mac_pfx_local}0:00:04`,
		105: `${enet_mac_pfx_local}0:00:05`,
		106: `${enet_mac_pfx_local}0:00:06`,
		107: `${enet_mac_pfx_local}0:00:07`
	};
	return port_macs;
};

exports.mea_ipsec_format_keys = function (auth_key, cipher_key) {
	
	var tunnel_keys = {
		integrity_key: `0x0000000000000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		integrity_iv: `0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_key: `0x${cipher_key.substring(0, 8)} 0x${cipher_key.substring(8, 16)} 0x${cipher_key.substring(16, 24)} 0x${cipher_key.substring(24, 32)} 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_iv: `0x${cipher_key.substring(32, 40)} 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`
	};
	return tunnel_keys;
};

exports.mea_ipsec_format_security_type = function (auth_algo, cipher_algo) {
	
	return `0xCA`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

exports.mea_service_add = function (nic_id) {
	
	return `${mea_cli_local(nic_id)} service set create`;
};

exports.mea_action_add = function (nic_id) {
	
	return `${mea_cli_local(nic_id)} action set create`;
};

exports.mea_forwarder_add = function (nic_id) {
	
	return `${mea_cli_local(nic_id)} forwarder add`;
};

exports.mea_ipsec_profile_add = function (nic_id) {
	
	return `${mea_cli_local(nic_id)} IPSec ESP set create`;
};

exports.mea_ipsec_add_parse = function (cmd, profiles_obj, profile_key, mea_output) {
	
	var ipsec_profile_regex = /Done\s+create\s+IPSecESP\s+with\s+Id\s+=\s+(\d+)/;
	mea_output.replace(ipsec_profile_regex, function(match, profile_id) {
		
		var match_count = 0;
		if (profile_id) {
			profiles_obj[profile_key] = { id: parseInt(profile_id, 10) };
			match_count = 1;
		}
		else {
			profiles_obj.no_match = (profiles_obj.no_match) ? (profiles_obj.no_match + 1) : 1;
		}
		if(cmd.return_cb && cmd.return_cb.length > 0) {
			var return_cb = cmd.return_cb.pop();
			if(return_cb) {
				return_cb(cmd);
			}
		}
	});
};

exports.mea_action_add_parse = function (cmd, actions_obj, action_key, mea_output) {
	
	var action_regex = /Done.\s+ActionId=(\d+)\s+\(PmId=([YESNO]+)\/([^,]+),tmId=[YESNO]+\/[^,]+,edId=[YESNO]+\/[^,]+\)/;
	mea_output.replace(action_regex, function(match, action_id, pm_flag, pm_id) {
		
		var match_count = 0;
		if(action_id) {
			actions_obj[action_key] = { id: parseInt(action_id, 10) };
			if (pm_flag && (pm_flag === `YES`) && pm_id) {
				actions_obj[action_key].pm = parseInt(pm_id, 10);
			}
			match_count = 1;
		}
		else {
			actions_obj.no_match = (actions_obj.no_match) ? (actions_obj.no_match + 1) : 1;
		}
		if(cmd.return_cb && cmd.return_cb.length > 0) {
			var return_cb = cmd.return_cb.pop();
			if(return_cb) {
				return_cb(cmd);
			}
		}
	});
};

exports.mea_actions_add_parse = function (cmd, actions_arr, mea_output) {
	
	var action_regex = /Done.\s+ActionId=(\d+)\s+\(PmId=([YESNO]+)\/([^,]+),tmId=[YESNO]+\/[^,]+,edId=[YESNO]+\/[^,]+\)/g;
	
	var formatted_output = mea_output.replace(action_regex, `{"action_id":$1,"add_pm":"$2","action_pm":$3}`);
	formatted_output = formatted_output.replace(/}\s*{/, `},{`);
	var actions_obj = JSON.parse(`[${formatted_output}]`);
	for(var i = 0; i < actions_obj.length; ++i) {
		if(actions_obj[i].add_pm === `NO`) {
			delete actions_obj[i].action_pm;
		}
		delete actions_obj[i].add_pm;
		actions_arr.push(actions_obj[i]);
	}
	if(cmd.return_cb && cmd.return_cb.length > 0) {
		var return_cb = cmd.return_cb.pop();
		if(return_cb) {
			return_cb(cmd);
		}
	}
};

exports.mea_forwarder_add_parse = function (cmd, forwarders_obj, forwarder_key, forwarder_expr, mea_output) {
	
	var match_count = 0;
	if(mea_output === ``) {
		forwarders_obj[forwarder_key] = { expr: forwarder_expr };
		match_count = 1;
	}
	else {
		forwarders_obj.no_match = (forwarders_obj.no_match) ? (forwarders_obj.no_match + 1) : 1;
	}
	if(cmd.return_cb && cmd.return_cb.length > 0) {
		var return_cb = cmd.return_cb.pop();
		if(return_cb) {
			return_cb(cmd);
		}
	}
};

exports.mea_service_add_parse = function (cmd, services_obj, service_key, mea_output) {
	
	var service_regex = /Done.\s+External\s+serviceId=(\d+)\s+Port=\d+\s+\(PmId=(\d+)\s+TmId=\d+\s+EdId=\d+\s+pol_prof_id=\d+\)/;
	mea_output.replace(service_regex, function(match, service_id, pm_id) {
		
		var match_count = 0;
		if(service_id) {
			services_obj[service_key] = { id: parseInt(service_id, 10) };
			if (pm_id) {
				services_obj[service_key].pm = parseInt(pm_id, 10);
			}
			match_count = 1;
		}
		else {
			services_obj.no_match = (services_obj.no_match) ? (services_obj.no_match + 1) : 1;
		}
		if(cmd.return_cb && cmd.return_cb.length > 0) {
			var return_cb = cmd.return_cb.pop();
			if(return_cb) {
				return_cb(cmd);
			}
		}
	});
};

exports.mea_rmon_parse_pkts = function(rmon_line) {
	
	return rmon_line.replace(/\s*(\d+)\s+Total\s+Pkts\s+(\d+)\s+(\d+)/, `"rmon$1":{"PktsRX":$2,"PktsTX":$3,`);
};

exports.mea_rmon_parse_bytes = function(rmon_line) {
	
	return rmon_line.replace(/\s*Total\s+Bytes\s+(\d+)\s+(\d+)/, `"BytesRX":$1,"BytesTX":$2,`);
};

exports.mea_rmon_parse_crc_errors = function(rmon_line) {
	
	return rmon_line.replace(/\s*CRC\s+Error\s+Pkts\s+(\d+)\s+(\d+)/, `"CRCErrorPktsRX":$1,"CRCErrorPktsTX":$2,`);
};

exports.mea_rmon_parse_mac_drops = function(rmon_line) {
	
	return rmon_line.replace(/\s*Rx\s+Mac\s+Drop\s+Pkts\s+(\d+)/, `"RxMacDropPktsRX":$1}`);
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

exports.enet_mac_pfx = enet_mac_pfx_local;

exports.mea_host_port = mea_host_port_local;
exports.mea_cipher_port = mea_cipher_port_local;
exports.mea_tunnel_port = mea_tunnel_port_local;
exports.mea_lan_ports = mea_lan_ports_local;

exports.mea_cli = function (nic_id) {
	
	return mea_cli_local(nic_id);
};

exports.mea_cli_prefix = function (nic_id) {
	
	const lock_timeout = 10;
	
	var expr = ``;
	if(nic_id > 0) {
		expr += `meaCli -card ${nic_id} top\n`;
	}
	else {
		expr += `meaCli top\n`;
	}
	return expr;
};

exports.mea_cli_suffix = function () {
	
	var expr = ``;
	return expr;
};

})(typeof exports === 'undefined' ? this.vpn_common = {} : exports);
