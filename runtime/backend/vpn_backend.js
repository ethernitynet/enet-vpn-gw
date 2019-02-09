
var mea_expr = require('./mea_expr.js');
var GW_CONFIG = require('./gw_config.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles) {

	this.gw_config = new GW_CONFIG(host_profile, gw_profiles);
	this.output_processor = {};
	this.tunnel_states = {};
	
	this.dump_output_processor = function () {
		
		const cmd_count = Object.keys(this.output_processor).length;
		console.log(`cmd_count: ${cmd_count}`);
		if(cmd_count > 0) {
			
			Object.keys(this.output_processor).forEach(cmd_key => {
				
				console.log(`${this.output_processor[cmd_key].exec_time}# [${cmd_key}]: ${this.output_processor[cmd_key].cmd}`);
				console.log(`${this.output_processor[cmd_key].output_time}# [${cmd_key}] code: ${this.output_processor[cmd_key].code}`);
				console.log(`    [${cmd_key}] stdout: ${this.output_processor[cmd_key].stdout}`);
				console.log(`    [${cmd_key}] stderr: ${this.output_processor[cmd_key].stderr}`);
			});
		};
	};
	
	this.dump_tunnel_states = function () {
		
		console.log(`==  ${new Date().getTime()}  ==`);
		console.log(`===================`);
		console.log(JSON.stringify(this.tunnel_states, null, 2));
		console.log(`===================`);
	};
	
	this.vpn_init = function (cfg) {
		
		var vpn_state = { nic_id: cfg.ace_nic_config[0].nic_name };
		
		this.gw_config.host_cmds_append([
			{
				key: `nic${vpn_state.nic_id}.init`,
				cfg: cfg,
				state: vpn_state,
				output_processor: this.output_processor,
				expr_builder: mea_expr_init,
				delay: 1000
			}
		]);
		this.gw_config.host_cmd();
	};
	
	this.outbound_tunnel_add = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;
		
		const tunnel_key = `nic${nic_id}.conn${conn_id}.out`;
		this.tunnel_states[tunnel_key] = { nic_id: nic_id, id: conn_id };
		
		this.tunnel_states[tunnel_key].ipsec = {
			spi: 4294901760,
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: `1111111122222222333333334444444455555555`
		};
		
		this.tunnel_states[tunnel_key].tunnel = {
			local_tunnel_mac: `CC:D3:9D:D5:6E:04`,
			remote_tunnel_mac: `cc:d3:9d:d6:7c:14`
		};
		
		this.gw_config.host_cmds_append([
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: 1000
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: 1000
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: 1000
			}
		]);
		this.gw_config.host_cmd();
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		//this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, 104, `ip neigh`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		//this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
