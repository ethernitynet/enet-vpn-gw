
var spawnSync = require('child_process').spawnSync
var http_request = require('request');

global.influxdb_success_count = 0;
global.influxdb_error_count = 0;


function influxdb_send(db_ip, db_port, db_name, msg) {
	
	console.log(`${db_name} <= ${msg}`);
/////////
const influxdb_url = `http://${db_ip}:${db_port}/write?db=${db_name}`;
//console.log(influxdb_url);
http_request({
		url: influxdb_url,
		encoding: null,
		method: 'POST',
		body: msg
	}, (error, response, body) => {
		if (error) {
			++influxdb_error_count;
			console.log(`====  ${JSON.stringify(error)}  ====`);
			if(response != undefined) {
				console.log(`====  ${response.json({name : error})}  ====`);
			};
		} else {
			++influxdb_success_count;
			//console.log(`====  SUCCESS  ====`);
		};
	});
/////////
};

const tunnel_states0 = {
	"nic0_conn3_out":
	{
	  "nic_id": "0",
	  "id": 3,
	  "tunnel": {
		"remote_tunnel_mac": "CC:D3:9D:D1:43:17",
		"local_tunnel_mac": "CC:D3:9D:D1:43:07"
	  },
	  "ipsec": {
		"spi": 1003,
		"auth_algo": null,
		"cipher_algo": "aes_gcm128-null",
		"auth_key": "00",
		"cipher_key": "6666666600000000333333331111111155551003"
	  },
	  "actions": {
		"out_l3fwd": 65549,
		"out_encrypt": 65550
	  },
	  "services": {},
	  "profiles": {
		"outbound_profile_id": 6
	  },
	  "forwarders": {
		"out_encrypt": "0 CC:D3:9D:D1:43:17 105",
		"out_l3fwd": "0 CC:D3:9D:D1:43:07 104"
	  },
	  "pms": {
		"out_l3fwd": 23,
		"out_encrypt": 24
	  }
	},
	"nic0_conn3_in":
	{
	  "nic_id": "0",
	  "id": 3,
	  "tunnel": {
		"remote_tunnel_mac": "CC:D3:9D:D1:43:17",
		"local_tunnel_mac": "CC:D3:9D:D1:43:07"
	  },
	  "ipsec": {
		"spi": 1103,
		"auth_algo": null,
		"cipher_algo": "aes_gcm128-null",
		"auth_key": "00",
		"cipher_key": "6666666600000000333333331111111155551103"
	  },
	  "fwd": {
		"next_hops": [
		  {
			"ip": "13.0.1.5",
			"mac": "6a:5f:ee:92:13:13"
		  },
		  {
			"ip": "13.0.1.8",
			"mac": "6a:00:ee:00:13:13"
		  }
		],
		"actions": {
		  "13.0.1.5": 65551,
		  "13.0.1.8": 65552
		},
		"forwarders": {
		  "13.0.1.5": "6 13.0.1.5 0 0x143",
		  "13.0.1.8": "6 13.0.1.8 0 0x143"
		},
		"pms": {
		  "13.0.1.5": 27,
		  "13.0.1.8": 28
		}
	  },
	  "actions": {},
	  "services": {
		"in_l3fwd": 522,
		"in_decrypt": 523
	  },
	  "profiles": {
		"inbound_profile_id": 7
	  },
	  "forwarders": {},
	  "pms": {
		"in_l3fwd": 25,
		"in_decrypt": 26
	  }
	}
};

const cfg0 = {
	"VPN": {
		"vpn_gw_config": [
			{
				"vpn_gw_ip": "10.11.11.1",
				"libreswan_ver": "v3.27"
			}
		],
		"conns": [
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
			  "tunnel_port": "107",
			  "inbound_routes": "13.0.1.1",
			  "libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			}
		]
	}
};

const tunnel_states1 = {
	"nic1_conn3_in":
	{
	  "nic_id": "1",
	  "id": 3,
	  "tunnel": {
		"remote_tunnel_mac": "CC:D3:9D:D1:43:07",
		"local_tunnel_mac": "CC:D3:9D:D1:43:17"
	  },
	  "ipsec": {
		"spi": 1003,
		"auth_algo": null,
		"cipher_algo": "aes_gcm128-null",
		"auth_key": "00",
		"cipher_key": "6666666600000000333333331111111155551003"
	  },
	  "fwd": {
		"phase": "forwarder_parse",
		"next_hops": [
		  {
			"ip": "13.0.2.5",
			"mac": "6a:5f:55:92:23:23"
		  },
		  {
			"ip": "13.0.2.6",
			"mac": "6a:5f:66:92:23:23"
		  },
		  {
			"ip": "13.0.2.7",
			"mac": "6a:5f:77:92:23:23"
		  }
		],
		"actions": {
		  "13.0.2.5": 65554,
		  "13.0.2.6": 65555,
		  "13.0.2.7": 65556
		},
		"forwarders": {
		  "13.0.2.5": "6 13.0.2.5 0 0x143",
		  "13.0.2.6": "6 13.0.2.6 0 0x143"
		},
		"pms": {
		  "13.0.2.5": 30,
		  "13.0.2.6": 31,
		  "13.0.2.7": 32
		}
	  },
	  "actions": {},
	  "services": {
		"in_l3fwd": 522,
		"in_decrypt": 523
	  },
	  "profiles": {
		"inbound_profile_id": 7
	  },
	  "forwarders": {},
	  "pms": {
		"in_l3fwd": 28,
		"in_decrypt": 29
	  }
	}
};

const cfg1 = {
	"VPN": {
		"vpn_gw_config": [
			{
				"vpn_gw_ip": "192.168.22.1",
				"libreswan_ver": "v3.27"
			}
		],
		"conns": [
			{
			  "name": "tun13_full_hw",
			  "inbound_accel": "full",
			  "outbound_accel": "full",
			  "pre_shared_secret": "ENET-LibreSwan",
			  "encryption_type": "aes_gcm128-null",
			  "remote_tunnel_endpoint_ip": "10.11.11.1",
			  "remote_subnet": "13.0.1.0/24",
			  "local_subnet": "13.0.2.0/24",
			  "lan_port": "106",
			  "tunnel_port": "107",
			  "inbound_routes": "13.0.2.1",
			  "libreswan_specific": "type=tunnel\nauthby=secret\nike=aes-sha1;modp2048\nikev2=insist\nnarrowing=yes"
			}
		]
	}
};


var influxdb_formulate_conn_pm_header = function (cfg, conn_id) {
	
	const conn_cfg = cfg.VPN.conns[conn_id];

	return `vpn${conn_cfg.tunnel_port},outbound_accel=${conn_cfg.outbound_accel},inbound_accel=${conn_cfg.inbound_accel},lan_port=${conn_cfg.lan_port},local_tun_ip=${cfg.VPN.vpn_gw_config[0].vpn_gw_ip},remote_tun_ip=${conn_cfg.remote_tunnel_endpoint_ip},local_subnet=${conn_cfg.local_subnet},remote_subnet=${conn_cfg.remote_subnet}`	
};

var pm_parse_pkts = function(pm_line) {
	
	const pkts_line = pm_line.replace(/\s*Pkt\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/, `FwdGreenPkt=$1,FwdYellowPkt=$2,DisGreenPkt=$3,DisYellowPkt=$4,DisRedPkt=$5,DisOtherPkt=$6,DisMtuPkt=$7,`);
	//console.log(`${pm_line}`);
	//console.log(` => ${pkts_line}`);
	return pkts_line;
};

var pm_parse_bytes = function(pm_line) {
	
	const bytes_line = pm_line.replace(/\s*Byte\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+NA\s+NA\s+NA/, `FwdGreenByte=$1,FwdYellowByte=$2,DisGreenByte=$3,DisYellowByte=$4`);
	//console.log(`${pm_line}`);
	//console.log(` => ${bytes_line}`);
	return bytes_line;
};

var pm_collect = function (card_flag, card_id, pm_id) {
	
	const lockfile = `/var/lock/mea_cli_lockfile`;
	const lock_timeout = 10;
	var pm_show_cmd = spawnSync('flock', [ '-o', '-x', '-w', lock_timeout, lockfile, 'meaCli', card_flag, card_id, 'mea', 'counters', 'pm', 'show', pm_id, '-ddr'], { encoding : 'utf8' });
	//console.log(JSON.stringify(r, null, 2));
	//console.log(rmon_show_cmd.stdout);
	return pm_show_cmd.stdout;
};

var influxdb_formulate_pm_counters = function (card_flag, card_id, pm_id) {
	
	const pm_str = pm_collect(card_flag, card_id, pm_id);
	const pm_arr = pm_str.split(/\r?\n/);
	if(pm_arr.length >= 5) {
		return pm_parse_pkts(pm_arr[3]) + pm_parse_bytes(pm_arr[4]);
	};
	return ``;
};

var influxdb_formulate_pms = function (card_flag, card_id, db_name, conn_pm_header, direction, pms_container, pm_label) {
	
	if(pms_container != undefined) {
		if(pms_container.pms != undefined) {
			Object.keys(pms_container.pms).forEach(function(pm_key) {
				
				const pm_counters_str = influxdb_formulate_pm_counters(card_flag, card_id, pms_container.pms[pm_key]);
				if(pm_counters_str != ``) {
					const pm_influxdb_str = `${conn_pm_header},direction=${direction},${pm_label}=${pm_key} ${pm_counters_str}`;
					influxdb_send(`172.17.0.1`, 8086, db_name, pm_influxdb_str);
				};
			});
		};
	};
};

var influxdb_pms_update_nic = function (card_flag, card_id, db_name, cfg, conn_id, direction, tunnel_state) {
	
	const conn_pm_header = influxdb_formulate_conn_pm_header(cfg, conn_id);
	influxdb_formulate_pms(card_flag, card_id, db_name, conn_pm_header, direction, tunnel_state, `action`);
	influxdb_formulate_pms(card_flag, card_id, db_name, conn_pm_header, direction, tunnel_state.fwd, `next_hop_ip`);
};

var influxdb_update_nic = function (card_flag, card_id, db_name, cfg, conn_id, direction, tunnel_state) {
	
	//influxdb_rmon_update_nic(rmon_collect(card_flag, card_id), db_name);
	influxdb_pms_update_nic(card_flag, card_id, db_name, cfg, conn_id, direction, tunnel_state);
};

var influxdb_update = function () {

	influxdb_update_nic(` `, ` `, `enet0_vpn`, cfg0, 0, `outbound`, tunnel_states0.nic0_conn3_out);
	influxdb_update_nic(`-card`, `1`, `enet1_vpn`, cfg1, 0, `inbound`, tunnel_states1.nic1_conn3_in);
	console.log(`${Date.now()}> influxdb_success_count: ${influxdb_success_count} influxdb_error_count: ${influxdb_error_count}`);
};

//influxdb_update();
setInterval(influxdb_update, 2000);

