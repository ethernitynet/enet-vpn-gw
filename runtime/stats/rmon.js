
const argc_host_ip = 2;

var influxdb_name = function (nic_id, host_ip_addr) {
	
	const ip_sfx = host_ip_addr.replace(/\./g, '_');
	return `enet${nic_id}_vpn_${ip_sfx}`;
};


global.influxdb_success_count = 0;
global.influxdb_error_count = 0;

var http_request = require('request');

function influxdb_send(db_ip, db_port, db_name, msg) {
	
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

var rmon_parse_pkts = function(rmon_line) {
	
	return rmon_line.replace(/\s*(\d+)\s+Total\s+Pkts\s+(\d+)\s+(\d+)/, `"rmon$1":{"PktsRX":$2,"PktsTX":$3,`);
};

var rmon_parse_bytes = function(rmon_line) {
	
	return rmon_line.replace(/\s*Total\s+Bytes\s+(\d+)\s+(\d+)/, `"BytesRX":$1,"BytesTX":$2,`);
};

var rmon_parse_crc_errors = function(rmon_line) {
	
	return rmon_line.replace(/\s*CRC\s+Error\s+Pkts\s+(\d+)\s+(\d+)/, `"CRCErrorPktsRX":$1,"CRCErrorPktsTX":$2,`);
};

var rmon_parse_mac_drops = function(rmon_line) {
	
	return rmon_line.replace(/\s*Rx\s+Mac\s+Drop\s+Pkts\s+(\d+)/, `"RxMacDropPktsRX":$1}`);
};

var influxdb_formulate_rmon = function (db_name, rmons_container, port_key) {
	
	var rx_str = `${port_key},direction=rx PktsRX=${rmons_container[port_key].PktsRX},BytesRX=${rmons_container[port_key].BytesRX},CRCErrorPktsRX=${rmons_container[port_key].CRCErrorPktsRX},RxMacDropPktsRX=${rmons_container[port_key].RxMacDropPktsRX}`
	var tx_str = `${port_key},direction=tx PktsTX=${rmons_container[port_key].PktsTX},BytesTX=${rmons_container[port_key].BytesTX},CRCErrorPktsTX=${rmons_container[port_key].CRCErrorPktsTX}`
	console.log(`${db_name} <= ${rx_str}`);
	console.log(`${db_name} <= ${tx_str}`);
	influxdb_send(`172.17.0.1`, 8086, db_name, rx_str);
	influxdb_send(`172.17.0.1`, 8086, db_name, tx_str);
};

var spawnSync = require('child_process').spawnSync

var rmon_collect = function (card_flag, card_id) {
	
	const lockfile = `/var/lock/mea_cli_lockfile`;
	const lock_timeout = 10;
	var rmon_collect_cmd = spawnSync('flock', [ '-o', '-x', '-w', lock_timeout, lockfile, 'meaCli', card_flag, card_id, 'mea', 'counters', 'rmon', 'collect', '104:127'], { encoding : 'utf8' });
	var rmon_show_cmd = spawnSync('flock', [ '-o', '-x', '-w', lock_timeout, lockfile, 'meaCli', card_flag, card_id, 'mea', 'counters', 'rmon', 'show', '104:127'], { encoding : 'utf8' });
	//console.log(JSON.stringify(r, null, 2));
	//console.log(rmon_show_cmd.stdout);
	return rmon_show_cmd.stdout;
};

var pm_collect = function (card_flag, card_id, pm_id) {
	
	const lockfile = `/var/lock/mea_cli_lockfile`;
	const lock_timeout = 10;
	var pm_show_cmd = spawnSync('flock', [ '-o', '-x', '-w', lock_timeout, lockfile, 'meaCli', card_flag, card_id, 'mea', 'counters', 'pm', 'show', pm_id, '-ddr'], { encoding : 'utf8' });
	//console.log(JSON.stringify(r, null, 2));
	//console.log(rmon_show_cmd.stdout);
	return pm_show_cmd.stdout;
};

var influxdb_rmon_update_nic = function (rmon_str, db_name) {
	
	const rmon_arr = rmon_str.split(/\r?\n/);
	var rmons_container ={};
	var rmons_container_str = `{`;
	var ports_count = 0;
	for(var line_idx = 2; line_idx < rmon_arr.length; line_idx += 5) {
		//console.log(`${rmon_arr.length} ${line_idx}`);
		rmons_container_str += rmon_parse_pkts(rmon_arr[line_idx]);
		rmons_container_str += rmon_parse_bytes(rmon_arr[line_idx + 1]);
		rmons_container_str += rmon_parse_crc_errors(rmon_arr[line_idx + 2]);
		rmons_container_str += rmon_parse_mac_drops(rmon_arr[line_idx + 3]);
		++ports_count;
		if(ports_count >= 5) {
			rmons_container_str += `}`;
			rmons_container = JSON.parse(rmons_container_str);
			break;
		}
		else {
			rmons_container_str += `,`;
		};
	};
	
	//console.log(JSON.stringify(rmons_container, null, 2));
	influxdb_formulate_rmon(db_name, rmons_container, `rmon104`);
	influxdb_formulate_rmon(db_name, rmons_container, `rmon105`);
	influxdb_formulate_rmon(db_name, rmons_container, `rmon106`);
	influxdb_formulate_rmon(db_name, rmons_container, `rmon107`);
	influxdb_formulate_rmon(db_name, rmons_container, `rmon127`);
	console.log(`${Date.now()}> influxdb_success_count: ${influxdb_success_count} influxdb_error_count: ${influxdb_error_count}`);
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


var influxdb_pms_update_nic = function (card_flag, card_id, db_name) {
	
};

var influxdb_update_nic = function (card_flag, card_id, db_name) {
	
	influxdb_rmon_update_nic(rmon_collect(card_flag, card_id), db_name);
	influxdb_pms_update_nic(card_flag, card_id, db_name);
};

var influxdb_update = function () {

	const host_ip = process.argv[argc_host_ip];
	influxdb_update_nic(` `, ` `, `${influxdb_name(0, host_ip)}`);
	influxdb_update_nic(`-card`, `1`, `${influxdb_name(1, host_ip)}`);
};

//influxdb_update();
setInterval(influxdb_update, 2000);

