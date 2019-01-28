
var syntax_tunnel = require('./syntax/syntax_tunnel.js');
var influxdb_stats = require('./syntax/influxdb_stats.js');

var json_cfg = 
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

const TUNNELS_CONFIG = 
[{
	"LAN": {
		"STATS_ID": "STATS64",
		"CONN_ID": 0,
		"NS": "o-10.0.2.0#24@105:10.0.1.0#24@104",
		"DIRECTION": "OUTBOUND",
		"SIDE": "LAN",
		"CRYPTO_PROFILES": [52],
		"SERVICES": [],
		"ACTIONS": [65597],
		"FORWARDERS": ["0 CC:D3:9D:D5:6c:14 105"]
	},
	"TUNNEL": {
		"STATS_ID": "STATS65",
		"CONN_ID": 0,
		"NS": "o-10.0.2.0#24@105:10.0.1.0#24@104",
		"DIRECTION": "OUTBOUND",
		"SIDE": "TUNNEL",
		"CRYPTO_PROFILES": [],
		"SERVICES": [],
		"ACTIONS": [65598],
		"FORWARDERS": ["0 CC:D3:9D:D5:6c:14 24"]
	}
}];

var syntax_tunnel_inst = new syntax_tunnel(`172.17.0.1`, `root`, `devops123`);

//docker exec enet0_libreswan104 ip neigh replace 192.168.22.1 lladdr cc:d3:9d:d0:00:14 dev e0ls104

// Tunnel configuration:
syntax_tunnel_inst.update_cfg(json_cfg.VPN);
//const expr = syntax_tunnel_inst.expr_dictionary_display();
const expr = syntax_tunnel_inst.exec_dictionary_display();
//console.log(expr);
const stats_collect_cmd = syntax_tunnel_inst.load_config();
var influxdb_stats_inst = new influxdb_stats(`172.17.0.1`, `root`, `devops123`, `172.16.10.151`, 8086, `enet_vpn_db`, stats_collect_cmd);
influxdb_stats_inst.update_cfg(json_cfg.VPN);

// Initialization:
function enet_vpn_gw_port_add() {
	
	syntax_tunnel_inst.mea_port(104, ``, `mea_gw_ip_get`);
};
function enet_vpn_lan_port_add() {
	
	syntax_tunnel_inst.mea_port(105, ``, `mea_port_add_outbound`);
};
enet_vpn_gw_port_add();
setTimeout(enet_vpn_lan_port_add, 2000);

// Tunnel creation:
function outbound_tunnel_create() {
	
	const ns = `10.11.11.1:192.168.22.1[t-10.0.1.0#24@105:10.0.2.0#24@104]`;
	const env = `TUN_REMOTE_MAC='cc:d3:9d:d0:00:14' SPI=7829367 AUTH_ALGO='' AUTH_KEY=0x00 CIPHER_ALGO='AES_GCM_16' CIPHER_KEY=1111111122222222333333334444444455555555`;
	syntax_tunnel_inst.mea_conn(ns, env, `mea_add_outbound`);
};
function inbound_tunnel_create() {
	
	const ns = `10.11.11.1:192.168.22.1[t-10.0.1.0#24@105:10.0.2.0#24@104]`;
	const env = `TUN_REMOTE_MAC='cc:d3:9d:d0:00:14' SPI=5592405 AUTH_ALGO='' AUTH_KEY=0x00 CIPHER_ALGO='AES_GCM_16' CIPHER_KEY=6666666655555555444444443333333322222222`;
	syntax_tunnel_inst.mea_conn(ns, env, `mea_add_inbound`);
};
setTimeout(outbound_tunnel_create, 5000);
//setTimeout(inbound_tunnel_create, 7000);

// Periodic updates:
function backend_stats_collect() {
	
	influxdb_stats_inst.stats_collect_remote();
};
function influxdb_update() {
	
	const conns_config = syntax_tunnel_inst.mea.conns_config;
	influxdb_stats_inst.update_conns_config(conns_config);
	setInterval(backend_stats_collect, 1000);
};
setTimeout(influxdb_update, 9000);


