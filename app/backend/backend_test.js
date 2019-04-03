
/////////////////////////////
process.title = `backend_test`;
/////////////////////////////

var vpn_common = require('./vpn_common.js');
const request = require('request');
var fs = require('fs');

const argc_nic_id = 2;

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var enet_load_vpn_cfg = function (nic_id, backend_ip, backend_port) {
	
	const enet_json_cfg = fs.readFileSync(`/shared/enet${nic_id}-vpn/enet_vpn_config.json`, `utf8`);
	const post_content = {
		op: `load_vpn_cfg`,
		vpn_cfg: JSON.parse(enet_json_cfg)
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`enet_load_vpn_cfg(${nic_id}, ${backend_ip}, ${backend_port}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic0_outbound_tunnel_add = function (backend_ip, backend_port, id) {

	const post_content = {
		op: `add_outbound_tunnel`,
		tunnel_spec: {
			local_subnet: `${10 + id}.0.1.0/24`,
			remote_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[0]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(1, id, vpn_common.mea_tunnel_port)
		},
		ipsec_cfg: {
			spi: (1000 + id),
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: `666666660000000033333333111111115555${1000 + id}`
		}
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic0_outbound_tunnel_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic1_outbound_tunnel_add = function (backend_ip, backend_port, id) {

	const post_content = {
		op: `add_outbound_tunnel`,
		tunnel_spec: {
			remote_subnet: `${10 + id}.0.1.0/24`,
			local_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[1]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(0, id, vpn_common.mea_tunnel_port)
		},
		ipsec_cfg: {
			spi: (1100 + id),
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: `666666660000000033333333111111115555${1100 + id}`
		}
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic1_outbound_tunnel_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic0_inbound_tunnel_add = function (backend_ip, backend_port, id) {
	
	const post_content = {
		op: `add_inbound_tunnel`,
		tunnel_spec: {
			local_subnet: `${10 + id}.0.1.0/24`,
			remote_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[0]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(1, id, vpn_common.mea_tunnel_port)
		},
		ipsec_cfg: {
			spi: (1100 + id),
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: `666666660000000033333333111111115555${1100 + id}`
		}
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic0_inbound_tunnel_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic1_inbound_tunnel_add = function (backend_ip, backend_port, id) {
	
	const post_content = {
		op: `add_inbound_tunnel`,
		tunnel_spec: {
			remote_subnet: `${10 + id}.0.1.0/24`,
			local_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[1]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(0, id, vpn_common.mea_tunnel_port)
		},
		ipsec_cfg: {
			spi: (1000 + id),
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: `666666660000000033333333111111115555${1000 + id}`
		}
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic1_inbound_tunnel_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic0_inbound_fwd_add = function (backend_ip, backend_port, id) {
	
	const post_content = {
		op: `add_inbound_fwd`,
		tunnel_spec: {
			local_subnet: `${10 + id}.0.1.0/24`,
			remote_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[0]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(1, id, vpn_common.mea_tunnel_port)
		},
		next_hops: [
			{
				ip: `${10 + id}.0.1.5`,
				mac: `6a:5f:ee:92:${10 + id}:${10 + id}`
			},
			{
				ip: `${10 + id}.0.1.8`,
				mac: `6a:00:ee:00:${10 + id}:${10 + id}`
			}
		]
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic0_inbound_fwd_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

var nic1_inbound_fwd_add = function (backend_ip, backend_port, id) {
	
	const post_content = {
		op: `add_inbound_fwd`,
		tunnel_spec: {
			remote_subnet: `${10 + id}.0.1.0/24`,
			local_subnet: `${10 + id}.0.2.0/24`,
			lan_port: `${vpn_common.mea_lan_ports[1]}`,
			tunnel_port: `${vpn_common.mea_tunnel_port}`,
			remote_tunnel_mac: vpn_common.vpn_conn_mac_base(0, id, vpn_common.mea_tunnel_port)
		},
		next_hops: [
			{
				ip: `${10 + id}.0.2.5`,
				mac: `6a:5f:55:92:${20 + id}:${20 + id}`
			},
			{
				ip: `${10 + id}.0.2.6`,
				mac: `6a:5f:66:92:${20 + id}:${20 + id}`
			},
			{
				ip: `${10 + id}.0.2.7`,
				mac: `6a:5f:77:92:${20 + id}:${20 + id}`
			}
		]
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if (error) {
			console.error(error);
		} else {
			console.log(`nic1_inbound_fwd_add(${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		}
	});
};

const nic0_host_profile = {
	host: `172.17.0.1`,
	username: `root`,
	password: `devops123`
};

const nic1_host_profile = {
	host: `172.17.0.1`,
	username: `root`,
	password: `devops123`
};

var nic0_backend_start = function (host_profile) {

	var nic0_gw0_profiles = {};
	nic0_gw0_profiles[vpn_common.mea_tunnel_port] = {
		host: `172.17.0.2`,
		username: `root`,
		password: `root`
	};

	enet_load_vpn_cfg(0, `172.17.0.1`, 4400);

	for (var id0 = 0; id0 < 0; ++id0) {
		nic0_outbound_tunnel_add(`172.17.0.1`, 4400, id0);
		nic0_inbound_tunnel_add(`172.17.0.1`, 4400, id0);
		nic0_inbound_fwd_add(`172.17.0.1`, 4400, id0);
	}
};

var nic1_backend_start = function (host_profile) {
	
	var nic1_gw0_profiles = {};
	nic1_gw0_profiles[vpn_common.mea_tunnel_port] = {
		host: `172.17.0.5`,
		username: `root`,
		password: `root`
	};
	
	enet_load_vpn_cfg(1, `172.17.0.1`, 4401);

	for (var id1 = 0; id1 < 0; ++id1) {
		nic1_outbound_tunnel_add(`172.17.0.1`, 4401, id1);
		nic1_inbound_tunnel_add(`172.17.0.1`, 4401, id1);
		nic1_inbound_fwd_add(`172.17.0.1`, 4401, id1);
	}
};

var backend_test_start = function () {
	
	console.log(JSON.stringify(process.argv));
	const nic_id = process.argv[argc_nic_id];
	
	switch (nic_id) {
		
		case `0`:
		nic0_backend_start(nic0_host_profile);
		break;
		
		case `1`:
		nic1_backend_start(nic1_host_profile);
		break;
		
		default:
		console.log(`Please enter NIC ID (0 or 1)`);
		break;
	}
};

backend_test_start();
