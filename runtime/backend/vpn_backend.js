
var mea_expr = require('./mea_expr.js');
var GW_CONFIG = require('./gw_config.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles) {

	this.gw_config = new GW_CONFIG(host_profile, gw_profiles);
	this.output_processor = [ {}, {} ];
	
	this.dump_output_processor = function (nic_id) {
		
		const cmd_count = Object.keys(this.output_processor[nic_id]).length;
		console.log(`cmd_count: ${cmd_count}`);
		if(cmd_count > 0) {
			
			Object.keys(this.output_processor[nic_id]).forEach(cmd_key => {
				
				console.log(`${this.output_processor[nic_id][cmd_key].exec_time}# [${cmd_key}]: ${this.output_processor[nic_id][cmd_key].cmd}`);
				console.log(`${this.output_processor[nic_id][cmd_key].output_time}# [${cmd_key}] code: ${this.output_processor[nic_id][cmd_key].code}`);
				console.log(`    [${cmd_key}] stdout: ${this.output_processor[nic_id][cmd_key].stdout}`);
				console.log(`    [${cmd_key}] stderr: ${this.output_processor[nic_id][cmd_key].stderr}`);
			});
		};
	};
	
	this.vpn_init = function (nic_id) {
		
		var cmds_arr = [
			{
				key: `init`,
				expr: mea_init_expr(nic_id) + mea_ports_init_expr(nic_id),
				delay: 100
			}
		];
		this.gw_config.host_cmd(this.output_processor, nic_id, cmds_arr);
	};
	
	this.outbound_tunnel_add = function (nic_id, conn_id) {
		
		const lan_port = 105;
		const tunnel_port = 104;
		const local_tunnel_mac = `CC:D3:9D:D5:6E:04`;
		const remote_tunnel_mac = `cc:d3:9d:d6:7c:14`;
		const local_tunnel_ip = `10.11.11.1`;
		const remote_tunnel_ip = `192.168.22.1`;
		const spi = 4294901760;
		const auth_algo = null;
		const cipher_algo = `aes_gcm128-null`;
		const auth_key = `00`;
		const cipher_key = `1111111122222222333333334444444455555555`;
		
		const profile_id = 0;
		const mid_port_action = 65537;
		const lan_port_action = 65538;
		
		var cmds_arr = [
			{
				key: `outprep${conn_id}`,
				expr: mea_ipsec_outbound_tunnel_prepare_expr(nic_id, local_tunnel_mac, remote_tunnel_mac, spi, auth_algo, cipher_algo, auth_key, cipher_key),
				delay: 2000
			},
			{
				key: `outadd${conn_id}`,
				expr: mea_ipsec_outbound_tunnel_add_expr(nic_id, lan_port, tunnel_port, local_tunnel_mac, remote_tunnel_mac, local_tunnel_ip, remote_tunnel_ip, profile_id, lan_port_action, mid_port_action),
				delay: 100
			}
		];
		this.gw_config.host_cmd(this.output_processor, nic_id, cmds_arr);
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		//this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, 104, `ip neigh`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		//this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
