
var vpn_common = require('./vpn_common.js');
var MEA_EXPR = require('./mea_expr.js');
var GW_CONFIG = require('./gw_config.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles) {

	this.gw_config = new GW_CONFIG(host_profile, gw_profiles);
	this.mea_expr = new MEA_EXPR();
	this.cmd_log = [];
	this.output_processor = {};
	this.tunnel_states = {
		OBJ: `tunnel_states`,
		UPDATE: `never`
	};
	this.host_delay = 0;
	
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
		}
	};
	
	this.vpn_test = function (output_cb) {
		
		const exec_time = new Date().getTime();
		const cmd_key = `vpn_test_${exec_time}`;
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			expr: [],
			output: []
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.test_begin,
				output_cb: this.mea_expr.test_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.test_end,
				output_cb: output_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
	};

	
	/////////////////////////////////////////////////
	/////////////////[load_vpn_cfg]//////////////////
		
	this.load_vpn_cfg = function (cfg, output_cb) {
		
		//console.log(`load_vpn_cfg(${nic_id})`);
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `load_vpn_cfg${nic_id}_${exec_time}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			expr: [],
			output: []
		};
		
		var that = this;
		var finish_cb = function(cmd) {
			
			that.cmd_log.push(cmd.output_processor[cmd_key]);
			if(output_cb) {
				output_cb(cmd);
			}
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.load_vpn_cfg,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};

	
	/////////////////////////////////////////////////
	//////////////[outbound_tunnel_add]//////////////
	
	this.outbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, output_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.tunnel_states[tunnel_key] = {
			nic_id: nic_id,
			conn_id: conn_id,
			port_in: conn_cfg.lan_port,
			port_out: conn_cfg.tunnel_port,
			remote_tunnel_mac: remote_tunnel_mac,
			local_tunnel_mac: vpn_common.vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port),
			ipsec_cfg: ipsec_cfg
		};
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			cfg: cfg,
			expr: [],
			output: []
		};
		
		var that = this;
		var finish_cb = function(cmd) {
			
			cmd.prefinish_cb(cmd, output_cb);
			that.cmd_log.push(cmd.output_processor[cmd.key]);
			delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.outbound_profile_add,
				output_cb: this.mea_expr.outbound_profile_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.outbound_encrypt_action_add,
				output_cb: this.mea_expr.outbound_encrypt_action_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.outbound_forwarders_add,
				prefinish_cb: this.mea_expr.outbound_forwarders_parse,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	
	/////////////////////////////////////////////////
	///////////////[inbound_tunnel_add]//////////////
	
	this.inbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, output_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.tunnel_states[tunnel_key] = {
			nic_id: nic_id,
			conn_id: conn_id,
			port_in: conn_cfg.tunnel_port,
			port_out: conn_cfg.lan_port,
			remote_tunnel_mac: remote_tunnel_mac,
			local_tunnel_mac: vpn_common.vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port),
			fwd: [],
			ipsec_cfg: ipsec_cfg
		};
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			cfg: cfg,
			expr: [],
			output: []
		};
		
		var that = this;
		var finish_cb = function(cmd) {
			
			cmd.prefinish_cb(cmd, output_cb);
			that.cmd_log.push(cmd.output_processor[cmd.key]);
			delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.inbound_profile_add,
				output_cb: this.mea_expr.inbound_profile_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.inbound_service_add,
				prefinish_cb: this.mea_expr.inbound_service_parse,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};

	
	/////////////////////////////////////////////////
	////////////////[inbound_fwd_add]////////////////
	
	this.inbound_fwd_add = function (cfg, conn_id, remote_tunnel_mac, next_hops, lan_port, output_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		const cmd_key = `${tunnel_key}_fwd_${exec_time}`;
				
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			next_hops: next_hops,
			cfg: cfg,
			expr: [],
			output: []
		};

		if(this.tunnel_states[tunnel_key] === undefined) {			
			this.output_processor[cmd_key].meta.error = `Inbound tunnel ${tunnel_key} not found.`;
			output_cb({ key: cmd_key, output_processor: this.output_processor });
		}
		else if(this.tunnel_states[tunnel_key].port_out !== lan_port) {
			this.output_processor[cmd_key].meta.error = `Tunnel ${tunnel_key} LAN port ${this.tunnel_states[tunnel_key].port_out} != ${lan_port}.`;
			output_cb({ key: cmd_key, output_processor: this.output_processor });
		}
		else {
			var that = this;
			var finish_cb = function(cmd) {
				
				cmd.prefinish_cb(cmd, output_cb);
				that.cmd_log.push(cmd.output_processor[cmd.key]);
				delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
			};
			
			const host_cmds = [
				{
					key: cmd_key,
					output_processor: this.output_processor,
					expr_builder: this.mea_expr.inbound_fwd_action_add,
					output_cb: this.mea_expr.inbound_fwd_action_parse
				},
				{
					key: cmd_key,
					output_processor: this.output_processor,
					expr_builder: this.mea_expr.inbound_fwd_forwarder_add,
					prefinish_cb: this.mea_expr.inbound_fwd_forwarder_parse,
					output_cb: finish_cb
				}
			];
			this.gw_config.host_exec_cmd(host_cmds);
			this.tunnel_states.UPDATE = `${new Date()}`;
		}		
	};

	
	/////////////////////////////////////////////////
	////////////////[dump_cmd_log]///////////////////
	
	this.dump_cmd_log = function (output_cb) {
		
		const exec_time = new Date().getTime();
		const cmd_key = `dump_cmd_log_${exec_time}`;
		
		var output_processor = {};
		output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, ret: this.cmd_log }
		};
		
		output_cb({ key: cmd_key, output_processor: output_processor });
	};

	
	/////////////////////////////////////////////////
	///////////////////[get_stats]///////////////////

	this.get_stats = function (cfg) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		console.log(`get_stats(${nic_id})`);
		
		this.gw_config.host_cmds_append([
			{
				key: `nic${nic_id}.get_stats`,
				cfg: cfg,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.stats_fetch
			},
			{
				key: `nic${nic_id}.get_stats`,
				cfg: cfg,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.stats_db_update
			}
		]);
		this.gw_config.host_shell_cmd();
	};
	
	this.inbound_tunnel_del = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		console.log(`inbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] === undefined) ? "undefined" : "EXISTS"}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.outbound_tunnel_del = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		console.log(`outbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] === undefined) ? "undefined" : "EXISTS"}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		//this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, mea_tunnel_port, `ip neigh`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		//this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
