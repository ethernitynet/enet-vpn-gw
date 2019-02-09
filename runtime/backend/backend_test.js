
var VPN_BACKEND = require('./vpn_backend.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////



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




var vpn_backend = new VPN_BACKEND(
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
	});

vpn_backend.vpn_init(enet0_json_cfg.VPN);
vpn_backend.outbound_tunnel_add(enet0_json_cfg.VPN, 0);
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

function myFunc2() {

	//console.log(`==> ${j}. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
	//vpn_backend.dump_output_processor(0);
	vpn_backend.dump_tunnel_states();
	//++j;
};
setInterval(myFunc2, 2000);
//console.log(`7. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);

/*
gw_config_inst.host_cmd(`echo 'HOST'; hostname; whoami; uptime; uname -a`);
gw_config_inst.vpn_cmd(`echo 'VPN'; hostname; whoami; uptime; uname -a`);
gw_config_inst.gw_cmd(`echo 'GW'; hostname; whoami; uptime; uname -a`);

console.log(JSON.stringify(gw_config_inst.cmd_arr));
console.log(JSON.stringify(gw_config_inst.stdout_arr));
console.log(JSON.stringify(gw_config_inst.stderr_arr));
*/
