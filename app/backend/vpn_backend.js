
var mea_expr = require('./mea_expr.js');
var GW_CONFIG = require('./gw_config.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles) {

	this.gw_config = new GW_CONFIG(host_profile, gw_profiles);
	this.output_processor = {};
	this.vpn_stats = { UPDATE: `never` };
	this.tunnel_states = {
		OBJ: `tunnel_states`,
		UPDATE: `never`
	};
	this.host_delay = 50;
	
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
		
		var dump_str = `\n`;
		dump_str += JSON.stringify(this.tunnel_states, null, 2);
		dump_str += `\n`;
		return dump_str;
	};
	
	this.vpn_init = function (cfg) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		console.log(`vpn_init(${nic_id})`);
		var vpn_state = { nic_id: nic_id };
		
		this.gw_config.host_cmds_append([
			{
				key: `nic${vpn_state.nic_id}.init`,
				cfg: cfg,
				state: vpn_state,
				output_processor: this.output_processor,
				expr_builder: mea_expr_init,
				delay: this.host_delay
			}
		]);
		this.gw_config.host_cmd();
		cfg.UPDATE = `${new Date()}`;
	};

	this.get_stats = function (cfg) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		console.log(`get_stats(${nic_id})`);
		
		this.vpn_stats.phase = `stats_get`;
		
		this.gw_config.host_cmds_append([
			{
				key: `nic${nic_id}.get_stats`,
				cfg: cfg,
				state: this.vpn_stats,
				output_processor: this.output_processor,
				expr_builder: mea_expr_stats_get,
				delay: this.host_delay
			}
		]);
		this.gw_config.host_cmd();
		this.vpn_stats.UPDATE = `${new Date()}`;
	};
	
	this.inbound_fwd_add = function (cfg, conn_id, remote_tunnel_mac, next_hops, lan_port) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		console.log(`inbound_fwd_add(${tunnel_key}, cfg.conns[${conn_id}]=${(cfg.conns != undefined) ? cfg.conns[conn_id] : 'empty'}, ${remote_tunnel_mac}, next_hops, ${lan_port})`);
		
		if((cfg.conns == undefined) || (cfg.conns[conn_id] == undefined)) {
			return;
		};
		
		if(this.tunnel_states[tunnel_key] == undefined) {
			this.tunnel_states[tunnel_key] = { UPDATE: `never` };
		};
		if(this.tunnel_states[tunnel_key].tunnel == undefined) {
			this.tunnel_states[tunnel_key].tunnel = { remote_tunnel_mac: remote_tunnel_mac };
		};
		
		this.tunnel_states[tunnel_key].fwd = { phase: `action_add`, next_hops: next_hops, lan_port: lan_port, actions: {}, forwarders: {}, pms: {}, UPDATE: `never` };
		this.gw_config.host_cmds_append([
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_fwd_add,
				delay: this.host_delay
			}
		]);
		this.gw_config.host_cmd();
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.inbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		console.log(`inbound_tunnel_add(${nic_id}, ${conn_id}, ${remote_tunnel_mac}, ipsec_cfg)`);
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		
		if(this.tunnel_states[tunnel_key] == undefined) {
			this.tunnel_states[tunnel_key] = { UPDATE: `never` };
		};
		if(this.tunnel_states[tunnel_key].tunnel == undefined) {
			this.tunnel_states[tunnel_key].tunnel = { remote_tunnel_mac: remote_tunnel_mac };
		};
		
		this.tunnel_states[tunnel_key].nic_id = nic_id;
		this.tunnel_states[tunnel_key].id = conn_id;
		this.tunnel_states[tunnel_key].ipsec = ipsec_cfg;
		this.tunnel_states[tunnel_key].tunnel.local_tunnel_mac = vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port);
		this.gw_config.host_cmds_append([
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_tunnel_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_tunnel_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_inbound_tunnel_add,
				delay: this.host_delay
			}
		]);
		this.gw_config.host_cmd();
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.inbound_tunnel_del = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		console.log(`inbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] == undefined) ? "undefined" : "EXISTS"}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.outbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		console.log(`outbound_tunnel_add(${nic_id}, ${conn_id}, ${remote_tunnel_mac}, ipsec_cfg)`);
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		
		this.tunnel_states[tunnel_key] = {
			nic_id: nic_id,
			id: conn_id,
			tunnel: {
				remote_tunnel_mac: remote_tunnel_mac
			},
			ipsec: ipsec_cfg,
			UPDATE: `never`
		};
		this.tunnel_states[tunnel_key].tunnel.local_tunnel_mac = vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port);
		this.gw_config.host_cmds_append([
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: this.host_delay
			},
			{
				key: tunnel_key,
				cfg: cfg,
				state: this.tunnel_states[tunnel_key],
				output_processor: this.output_processor,
				expr_builder: mea_expr_outbound_tunnel_add,
				delay: this.host_delay
			}
		]);
		this.gw_config.host_cmd();
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.outbound_tunnel_del = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		console.log(`outbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] == undefined) ? "undefined" : "EXISTS"}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		//this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, mea_tunnel_port, `ip neigh`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		//this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
