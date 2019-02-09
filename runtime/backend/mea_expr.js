
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

global.mea_ipsec_format_keys = function (auth_key, cipher_key) {
	
	var tunnel_keys = {
		integrity_key: `0x0000000000000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		integrity_iv: `0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_key: `0x11111111 0x22222222 0x33333333 0x44444444 0x00000000 0x00000000 0x00000000 0x00000000`,
		confidentiality_iv: `0x55555555 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000`
	};
	return tunnel_keys;
};

global.mea_ipsec_format_security_type = function (auth_algo, cipher_algo) {
	
	return `0xCA`;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


global.mea_port_macs = [
	{
		24: `CC:D3:9D:D0:00:A4`,
		27: `CC:D3:9D:D0:00:A7`,
		104: `CC:D3:9D:D0:00:04`,
		105: `CC:D3:9D:D0:00:05`,
		106: `CC:D3:9D:D0:00:06`,
		107: `CC:D3:9D:D0:00:07`
	},
	{
		24: `CC:D3:9D:D0:00:B4`,
		27: `CC:D3:9D:D0:00:B7`,
		104: `CC:D3:9D:D0:00:14`,
		105: `CC:D3:9D:D0:00:15`,
		106: `CC:D3:9D:D0:00:16`,
		107: `CC:D3:9D:D0:00:17`
	}
];

global.mea_cli = function (nic_id) {
	
	if(nic_id > 0) {
		return `meaCli -card ${nic_id} mea`;
	}
	else {
		return `meaCli mea`;
	};
};

global.mea_cli_top = function (nic_id) {
	
	if(nic_id > 0) {
		return `meaCli -card ${nic_id} top`;
	}
	else {
		return `meaCli top`;
	};
};

global.mea_service_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} service set create`;
};

global.mea_action_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} action set create`;
};

global.mea_forwarder_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} forwarder add`;
};

global.mea_ipsec_profile_add = function (nic_id) {
	
	return `${mea_cli(nic_id)} IPSec ESP set create`;
};
	
global.mea_init_expr = function (nic_id) {
	
	const mea_top = mea_cli_top(nic_id);
	const mea_cmd = mea_cli(nic_id);
	
	var expr = `${mea_top}\n`;
	expr += `${mea_cmd} port ingress set all -a 1 -c 0\n`;
	expr += `${mea_cmd} port egress set all -a 1 -c 1\n`;
	expr += `${mea_cmd} IPSec global set ttl 40\n`;
	expr += `${mea_cmd} forwarder delete all\n`;
	expr += `${mea_cmd} action set delete all\n`;
	expr += `${mea_cmd} service set delete all\n`;
	expr += `${mea_cmd} IPSec ESP set delete all\n`;
	return expr;
};
	
global.mea_ports_init_expr = function (nic_id) {
	
	const mea_top = mea_cli_top(nic_id);
	const service_add = mea_service_add(nic_id);
	const port_macs = mea_port_macs[nic_id];
	
	var expr = `${mea_top}\n`;
	expr += `${service_add} 24 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 0 -ra 0 -l2Type 0 -v 24 -p 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[24]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 104 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 104 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[104]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 105 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 105 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[105]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 106 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 106 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[106]} 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${service_add} 107 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 107 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[107]} 00:00:00:00:00:00 0000 -hType 0\n`;
	return expr;
};

global.mea_ipsec_outbound_tunnel_prepare_expr = function (nic_id, local_tunnel_mac, remote_tunnel_mac, spi, auth_algo, cipher_algo, auth_key, cipher_key) {
	
	const mea_top = mea_cli_top(nic_id);
	const action_add = mea_action_add(nic_id);
	const ipsec_add = mea_ipsec_profile_add(nic_id);
	const security_type = mea_ipsec_format_security_type(auth_algo, cipher_algo);
	const tunnel_keys = mea_ipsec_format_keys(auth_key, cipher_key);
	const tunnel_keys_str = `-Integrity_key ${tunnel_keys.integrity_key} -Integrity_IV ${tunnel_keys.integrity_iv} -Confident_key ${tunnel_keys.confidentiality_key} -Confident_IV ${tunnel_keys.confidentiality_iv}`;
	
	var expr = `${mea_top}\n`;
	expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${remote_tunnel_mac} ${local_tunnel_mac} 0000\n`;
	expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${spi} ${tunnel_keys_str}\n`;
	return expr;
};

global.mea_ipsec_outbound_tunnel_add_expr = function (nic_id, lan_port, tunnel_port, local_tunnel_mac, remote_tunnel_mac, local_tunnel_ip, remote_tunnel_ip, profile_id, lan_port_action, mid_port_action) {
	
	const mea_top = mea_cli_top(nic_id);
	const action_add = mea_action_add(nic_id);
	const forwarder_add = mea_forwarder_add(nic_id);
	
	var expr = `${mea_top}\n`;
	expr += `${action_add} -pm 1 0 -ed 1 0 -hIPSec 1 1 ${local_tunnel_ip} ${remote_tunnel_ip} -hESP 1 ${profile_id} -hType 71\n`;
	expr += `${forwarder_add} 0 ${remote_tunnel_mac} 24 3 1 0 1 ${tunnel_port} -action 1 ${mid_port_action}\n`;
	expr += `${forwarder_add} 0 ${local_tunnel_mac} ${lan_port} 3 1 0 1 24 -action 1 ${lan_port_action}\n`;
	return expr;
};
