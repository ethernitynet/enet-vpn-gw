
var VPN_BACKEND_SERVICE = require('./vpn_backend_service.js');
const request = require('request');
var fs = require('fs');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var vpn0_backend_service = new VPN_BACKEND_SERVICE(
	{
		host: `172.17.0.1`,
		username: `root`,
		password: `devops123`
	},
	{
		104: {
			host: `172.17.0.2`,
			username: `root`,
			password: `root`
		}
	},
	3000
);

var vpn1_backend_service = new VPN_BACKEND_SERVICE(
	{
		host: `172.17.0.1`,
		username: `root`,
		password: `devops123`
	},
	{
		104: {
			host: `172.17.0.5`,
			username: `root`,
			password: `root`
		}
	},
	3001
);

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
				"lan_port": "105",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, 104)
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
				"lan_port": "106",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, 104)
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
				"lan_port": "105",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, 104)
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
				"lan_port": "106",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, 104)
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
				"lan_port": "105",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(1, id, 104)
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
				"lan_port": "106",
				"tunnel_port": "104",
				"remote_tunnel_mac": vpn_conn_mac_base(0, id, 104)
			},
			next_hops: [
				{
					ip: `${10 + id}.0.2.5`,
					mac: `6a:5f:ee:92:${20 + id}:${20 + id}`
				},
				{
					ip: `${10 + id}.0.2.8`,
					mac: `6a:00:ee:00:${20 + id}:${20 + id}`
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

for(var id0 = 0; id0 < 3; ++id0) {
	enet_outbound_tunnel_add(0, `172.17.0.1`, 3000, id0);
	enet_inbound_tunnel_add(0, `172.17.0.1`, 3000, id0);
	enet_inbound_fwd_add(0, `172.17.0.1`, 3000, id0);
};

for(var id1 = 0; id1 < 3; ++id1) {
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
const enet0_json_cfg = 
{
	"UPDATE": "Mon, 14 Jan 2019 13:14:54 GMT",
	"VPN": {
		"advanced": false,
		"vpn_gw_config": [{
			"vpn_gw_ip": "10.11.11.1",
			"libreswan_ver": "v3.27"
		}],
		"conns": [{
				"name": "tun10_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "10.0.1.0/24",
				"remote_subnet": "10.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "10.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun11_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "11.0.1.0/24",
				"remote_subnet": "11.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "11.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun12_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "12.0.1.0/24",
				"remote_subnet": "12.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "12.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun13_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "13.0.1.0/24",
				"remote_subnet": "13.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "13.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun14_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "14.0.1.0/24",
				"remote_subnet": "14.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "14.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun15_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "15.0.1.0/24",
				"remote_subnet": "15.0.2.0/24",
				"lan_port": "105",
				"tunnel_port": "104",
				"inbound_routes": "15.0.1.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun30_no_hw",
				"inbound_accel": "none",
				"outbound_accel": "none",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "192.168.22.1",
				"local_subnet": "30.0.1.0/24",
				"remote_subnet": "30.0.2.0/24",
				"inbound_routes": "30.0.1.1",
				"lan_port": "105",
				"tunnel_port": "104",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			}
		],
		"ace_nic_config": [{
			"nic_name": "0",
			"dataplane": "kernel",
			"sw_ver": "450.08.122A#1 (Jan 06 2018 12:30:00)",
			"hw_ver": "d02.1.11.3   (Date 03/01/19: hour 12:00 )",
			"log_file": "/tmp/enet_vpn.log",
			"install_dir": "/home/devops/workspace/R450_08_122A",
			"nic_pci": "0000:3d:00.0"
		}],
		"dpdk_config": [{
			"dpdk_ver": "v17.11-rc4",
			"no_2mb_hugepages": 2048,
			"no_1g_hugepages": 2,
			"installed_pmds": [
				"igb_uio"
			]
		}],
		"ovs_config": [{
			"ovs_ver": "v2.10.1",
			"mgmt_threads": "0x00c0",
			"pmd_threads": "0x003c"
		}]
	}
};

var enet1_json_cfg = 
{
	"UPDATE": "Mon, 14 Jan 2019 13:15:01 GMT",
	"VPN": {
		"advanced": false,
		"vpn_gw_config": [{
			"vpn_gw_ip": "192.168.22.1",
			"libreswan_ver": "v3.27"
		}],
		"conns": [{
				"name": "tun10_full_hw",
				"inbound_accel": "full",
				"outbound_accel": "full",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "10.11.11.1",
				"local_subnet": "10.0.2.0/24",
				"remote_subnet": "10.0.1.0/24",
				"lan_port": "106",
				"tunnel_port": "104",
				"inbound_routes": "10.0.2.1",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			},
			{
				"name": "tun30_no_hw",
				"inbound_accel": "none",
				"outbound_accel": "none",
				"pre_shared_secret": "ENET-LibreSwan",
				"encryption_type": "aes_gcm128-null",
				"remote_tunnel_endpoint_ip": "10.11.11.1",
				"local_subnet": "30.0.2.0/24",
				"remote_subnet": "30.0.1.0/24",
				"inbound_routes": "30.0.2.1",
				"lan_port": "106",
				"tunnel_port": "104",
				"libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			}
		],
		"ace_nic_config": [{
			"nic_name": "1",
			"dataplane": "kernel",
			"sw_ver": "450.08.122A#1 (Jan 06 2018 12:30:00)",
			"hw_ver": "d02.1.11.3   (Date 03/01/19: hour 12:00 )",
			"log_file": "/tmp/enet_vpn.log",
			"install_dir": "/home/devops/workspace/R450_08_122A",
			"nic_pci": "0000:88:00.0"
		}],
		"dpdk_config": [{
			"dpdk_ver": "v17.11-rc4",
			"no_2mb_hugepages": 2048,
			"no_1g_hugepages": 2,
			"installed_pmds": [
				"igb_uio"
			]
		}],
		"ovs_config": [{
			"ovs_ver": "v2.10.1",
			"mgmt_threads": "0x00c0",
			"pmd_threads": "0x003c"
		}]
	}
};



	
	
vpn_backend_service.load_vpn_cfg(enet0_json_cfg);
	
	

vpn_backend.vpn_init(enet0_json_cfg.VPN);


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 0, `cc:d3:9d:d6:7c:14`, {
	spi: 4294901760,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `6666666600000000333333331111111155555555`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 0, `cc:d3:9d:d6:7c:14`, {
	spi: 286387950,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `3333333311111111000000002222222288888888`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 0, [
	{
		ip: `10.0.2.5`,
		mac: `6a:5f:ee:92:21:33`
	},
	{
		ip: `10.0.2.8`,
		mac: `6a:00:ee:00:21:11`
	}
]);
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 1, `cc:d3:9d:d6:7c:14`, {
	spi: 65535,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `7777777700000000666666661111111199999999`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 1, `cc:d3:9d:d6:7c:14`, {
	spi: 1024,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `2222222211111111000000004444444455555555`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 1, [
	{
		ip: `11.0.2.55`,
		mac: `0a:00:ee:92:21:33`
	},
	{
		ip: `11.0.2.88`,
		mac: `0a:00:ee:00:77:11`
	}
]);
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 2, `cc:d3:9d:d6:7c:14`, {
	spi: 22,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `2222222200000000666666660000000022222222`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 2, `cc:d3:9d:d6:7c:14`, {
	spi: 2200,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `2222222266666666000000006666666622222222`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 2, [
	{
		ip: `12.0.2.55`,
		mac: `0a:00:22:92:21:33`
	},
	{
		ip: `12.0.2.88`,
		mac: `0a:00:22:00:77:11`
	}
]);
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 3, `cc:d3:9d:d6:7c:14`, {
	spi: 33,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `3333333300000000666666660000000033333333`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 3, `cc:d3:9d:d6:7c:14`, {
	spi: 3300,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `3333333366666666000000006666666633333333`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 3, [
	{
		ip: `13.0.2.55`,
		mac: `0a:00:33:92:21:33`
	},
	{
		ip: `13.0.2.88`,
		mac: `0a:00:33:00:77:11`
	}
]);
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 4, `cc:d3:9d:d6:7c:14`, {
	spi: 44,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `4444444400000000666666660000000044444444`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 4, `cc:d3:9d:d6:7c:14`, {
	spi: 4400,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `4444444466666666000000006666666644444444`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 4, [
	{
		ip: `14.0.2.55`,
		mac: `0a:00:44:92:21:33`
	},
	{
		ip: `14.0.2.88`,
		mac: `0a:00:44:00:77:11`
	}
]);
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 5, `cc:d3:9d:d6:7c:14`, {
	spi: 55,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `5555555500000000666666660000000055555555`
});
vpn_backend.inbound_tunnel_add(enet0_json_cfg.VPN, 5, `cc:d3:9d:d6:7c:14`, {
	spi: 5500,
	auth_algo: null,
	cipher_algo: `aes_gcm128-null`,
	auth_key: `00`,
	cipher_key: `5555555566666666000000006666666655555555`
});
vpn_backend.inbound_fwd_add(enet0_json_cfg.VPN, 5, [
	{
		ip: `15.0.2.55`,
		mac: `0a:00:55:92:21:33`
	},
	{
		ip: `15.0.2.88`,
		mac: `0a:00:55:00:77:11`
	}
]);
////////////////////////////////////////////////////////


//vpn_backend.gw_connect(0, 104);
//console.log(`5. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
vpn_backend.dump_output_processor(0);
var i = 6;
var j = 100;
function myFunc() {

	//console.log(`=> ${i}. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
	++i;
};
//setInterval(myFunc, 1000);
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
