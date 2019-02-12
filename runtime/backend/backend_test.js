
var VPN_BACKEND_SERVICE = require('./vpn_backend_service.js');
const request = require('request');
var fs = require('fs');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

const host_profile = {
	host: `172.17.0.1`,
	username: `root`,
	password: `devops123`
};

var gw0_profiles = {};
gw0_profiles[mea_tunnel_port] = {
	host: `172.17.0.2`,
	username: `root`,
	password: `root`
};

var gw1_profiles = {};
gw1_profiles[mea_tunnel_port] = {
	host: `172.17.0.5`,
	username: `root`,
	password: `root`
};

var vpn0_backend_service = new VPN_BACKEND_SERVICE(host_profile, gw0_profiles, 3000);
var vpn1_backend_service = new VPN_BACKEND_SERVICE(host_profile, gw1_profiles, 3001);

var enet_load_vpn_cfg = function (nic_id, backend_ip, backend_port) {
	
	const enet_json_cfg = fs.readFileSync(`/shared/enet${nic_id}-vpn/enet_vpn_config.json`, `utf8`);
	const post_content = {
		op: `load_vpn_cfg`,
		vpn_cfg: JSON.parse(enet_json_cfg)
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if(error) {
			console.error(error);
		}
		else {
			console.log(`enet_load_vpn_cfg(${nic_id}, ${backend_ip}, ${backend_port}) statusCode: ${res.statusCode}`);
			console.log(body);
		};
	});
};

var enet_outbound_tunnel_add = function (nic_id, backend_ip, backend_port, id) {

	var post_content = {};	
	switch(nic_id) {
		
		case 0:
		post_content = {
			op: `add_outbound_tunnel`,
			tunnel_spec: {
				"local_subnet": `${10 + id}.0.1.0/24`,
				"remote_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[0]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, mea_tunnel_port)
			},
			ipsec_cfg: {
				spi: (1000 + id),
				auth_algo: null,
				cipher_algo: `aes_gcm128-null`,
				auth_key: `00`,
				cipher_key: `666666660000000033333333111111115555${1000 + id}`
			}
		};
		break;
		
		case 1:
		post_content = {
			op: `add_outbound_tunnel`,
			tunnel_spec: {
				"remote_subnet": `${10 + id}.0.1.0/24`,
				"local_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[1]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, mea_tunnel_port)
			},
			ipsec_cfg: {
				spi: (1100 + id),
				auth_algo: null,
				cipher_algo: `aes_gcm128-null`,
				auth_key: `00`,
				cipher_key: `666666660000000033333333111111115555${1100 + id}`
			}
		};
		break;
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if(error) {
			console.error(error);
		}
		else {
			console.log(`enet_outbound_tunnel_add(${nic_id}, ${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		};
	});
};

var enet_inbound_tunnel_add = function (nic_id, backend_ip, backend_port, id) {
	
	var post_content = {};	
	switch(nic_id) {
		
		case 0:
		post_content = {
			op: `add_inbound_tunnel`,
			tunnel_spec: {
				"local_subnet": `${10 + id}.0.1.0/24`,
				"remote_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[0]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, mea_tunnel_port)
			},
			ipsec_cfg: {
				spi: (1100 + id),
				auth_algo: null,
				cipher_algo: `aes_gcm128-null`,
				auth_key: `00`,
				cipher_key: `666666660000000033333333111111115555${1100 + id}`
			}
		};
		break;
		
		case 1:
		post_content = {
			op: `add_inbound_tunnel`,
			tunnel_spec: {
				"remote_subnet": `${10 + id}.0.1.0/24`,
				"local_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[1]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, mea_tunnel_port)
			},
			ipsec_cfg: {
				spi: (1000 + id),
				auth_algo: null,
				cipher_algo: `aes_gcm128-null`,
				auth_key: `00`,
				cipher_key: `666666660000000033333333111111115555${1000 + id}`
			}
		};
		break;
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if(error) {
			console.error(error);
		}
		else {
			console.log(`enet_inbound_tunnel_add(${nic_id}, ${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		};
	});
};

var enet_inbound_fwd_add = function (nic_id, backend_ip, backend_port, id) {
	
	var post_content = {};	
	switch(nic_id) {
		
		case 0:
		post_content = {
			op: `add_inbound_fwd`,
			tunnel_spec: {
				"local_subnet": `${10 + id}.0.1.0/24`,
				"remote_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[0]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, mea_tunnel_port)
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
		break;
		
		case 1:
		post_content = {
			op: `add_inbound_fwd`,
			tunnel_spec: {
				"remote_subnet": `${10 + id}.0.1.0/24`,
				"local_subnet": `${10 + id}.0.2.0/24`,
				"lan_port": `${mea_lan_ports[1]}`,
				"tunnel_port": `${mea_tunnel_port}`,
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, mea_tunnel_port)
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
		break;
	};

	request.post(`http://${backend_ip}:${backend_port}`, { json: post_content }, (error, res, body) => {
		
		if(error) {
			console.error(error);
		}
		else {
			console.log(`enet_inbound_fwd_add(${nic_id}, ${backend_ip}, ${backend_port}, ${id}) statusCode: ${res.statusCode}`);
			console.log(body);
		};
	});
};

enet_load_vpn_cfg(0, `172.17.0.1`, 3000);
enet_load_vpn_cfg(1, `172.17.0.1`, 3001);

for(var id0 = 0; id0 < 4; ++id0) {
	enet_outbound_tunnel_add(0, `172.17.0.1`, 3000, id0);
	enet_inbound_tunnel_add(0, `172.17.0.1`, 3000, id0);
	enet_inbound_fwd_add(0, `172.17.0.1`, 3000, id0);
};

for(var id1 = 0; id1 < 4; ++id1) {
	enet_outbound_tunnel_add(1, `172.17.0.1`, 3001, id1);
	enet_inbound_tunnel_add(1, `172.17.0.1`, 3001, id1);
	enet_inbound_fwd_add(1, `172.17.0.1`, 3001, id1);
};

/*
function myFunc2() {

	vpn0_backend_service.dump();
};
setInterval(myFunc2, 2000);
*/


/*
var log_processor = function () {
	
	const stdout_count = Object.keys(vpn_backend.output_processor.stdout).length;
	console.log(`stdout_count: ${stdout_count}`);
	if(stdout_count > 0) {
		
		Object.keys(vpn_backend.output_processor.stdout).forEach(cmd_key => {
			
			console.log(`[${cmd_key}]: ${vpn_backend.output_processor.stdout[cmd_key]}`);
		});
	};
};
*/

/*
function myFunc2() {

	//console.log(`==> ${j}. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
	//vpn_backend.dump_output_processor(0);
	vpn_backend.dump_tunnel_states();
	//++j;
};
setInterval(myFunc2, 2000);
*/
//console.log(`7. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);

/*
gw_config_inst.host_cmd(`echo 'HOST'; hostname; whoami; uptime; uname -a`);
gw_config_inst.vpn_cmd(`echo 'VPN'; hostname; whoami; uptime; uname -a`);
gw_config_inst.gw_cmd(`echo 'GW'; hostname; whoami; uptime; uname -a`);

console.log(JSON.stringify(gw_config_inst.cmd_arr));
console.log(JSON.stringify(gw_config_inst.stdout_arr));
console.log(JSON.stringify(gw_config_inst.stderr_arr));
*/
