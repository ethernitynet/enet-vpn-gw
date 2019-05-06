
var vpn_common = require('./vpn_common.js');
var MEA_EXPR = require('./mea_expr.js');
var OVS_EXPR = require('./ovs_expr.js');
var DOCKER_EXPR = require('./docker_expr.js');
var INFLUXDB_EXPR = require('./influxdb_expr.js');
var GW_CONFIG = require('./gw_config.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function (host_profile, gw_profiles) {

	this.gw_config = new GW_CONFIG(host_profile, gw_profiles);
	this.mea_expr = new MEA_EXPR();
	this.ovs_expr = new OVS_EXPR();
	this.docker_expr = new DOCKER_EXPR();
	this.influxdb_expr = new INFLUXDB_EXPR();
	this.cmd_log = [];
	this.output_processor = {};
	this.libreswan_states = {
		OBJ: `libreswan_states`,
		UPDATE: `never`
	};
	this.tunnel_states = {
		OBJ: `tunnel_states`,
		UPDATE: `never`
	};
	this.host_delay = 0;

	this.flush_interval = setInterval(this.gw_config.cmd_advance, 500);
	
	this.dump_output_processor = function () {
		
		const cmd_count = Object.keys(this.output_processor).length;
		console.log(`cmd_count: ${cmd_count}`);
		if (cmd_count > 0) {
			
			Object.keys(this.output_processor).forEach(cmd_key => {
				
				console.log(`${this.output_processor[cmd_key].exec_time}# [${cmd_key}]: ${this.output_processor[cmd_key].cmd}`);
				console.log(`${this.output_processor[cmd_key].output_time}# [${cmd_key}] code: ${this.output_processor[cmd_key].code}`);
				console.log(`    [${cmd_key}] stdout: ${this.output_processor[cmd_key].stdout}`);
				console.log(`    [${cmd_key}] stderr: ${this.output_processor[cmd_key].stderr}`);
			});
		}
	};
	
	/////////////////////////////////////////////////
	////////////////////[cmd_run]////////////////////
		
	this.cmd_run = function (cfg, target, cmd_expr, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `cmd_run${nic_id}_${exec_time}`;

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			expr: [],
			output: [],
			ret_cb: ret_cb
		};

		var test_expr_builder = function (cmd) {
			
			return cmd_expr;
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `cmd_run`,
				target: target,
				output_processor: this.output_processor,
				expr_builder: test_expr_builder,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	////////////////[rmons_collect]//////////////////
		
	this.rmons_collect = function (cfg, db, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `rmons_collect${nic_id}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			db: db,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `Collect RMONs`,
				output_processor: this.output_processor,
				expr_builder: this.influxdb_expr.rmons_collect
			},
			{
				key: cmd_key,
				label: `Update InfluxDB with RMONs`,
				output_processor: this.output_processor,
				expr_builder: this.influxdb_expr.influxdb_rmons_update,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds, cfg.host_profile);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	///////////////////[vpn_test]////////////////////
		
	this.vpn_test = function (ret_cb) {
		
		const exec_time = new Date().getTime();
		const cmd_key = `vpn_test_${exec_time}`;
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
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
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
	};
	
	/////////////////////////////////////////////////
	////////////////[update_vpn_cfg]/////////////////
		
	this.update_vpn_cfg = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `update_vpn_cfg${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			libreswan_states: this.libreswan_states,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var prefinish_cb = (cmd.prefinish_cb) ? cmd.prefinish_cb : function (cmd, return_cb) {

				if (return_cb) {
					return_cb(cmd)
				}
			};
			prefinish_cb(cmd, function (cmd) {

				var output_processor = cmd.output_processor[cmd.key];
				that.cmd_log.push(output_processor);
				if (output_processor.ret_cb) {
					var ret_cb = output_processor.ret_cb;
					ret_cb(cmd, that.gw_config);
					delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
				} else {
					that.gw_config.cmd_advance(cmd);
				}
			});
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `configure libreswan instances`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.init_vpn_dirs,
				prefinish_cb: this.docker_expr.update_vpn_conf,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	///////////////////[boot_ovs]////////////////////
		
	this.boot_ovs = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `boot_ovs${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			libreswan_states: this.libreswan_states,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var prefinish_cb = (cmd.prefinish_cb) ? cmd.prefinish_cb : function (cmd, return_cb) {

				if (return_cb) {
					return_cb(cmd)
				}
			};
			prefinish_cb(cmd, function (cmd) {

				var output_processor = cmd.output_processor[cmd.key];
				that.cmd_log.push(output_processor);
				if (output_processor.ret_cb) {
					var ret_cb = output_processor.ret_cb;
					ret_cb(cmd, that.gw_config);
					delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
				} else {
					that.gw_config.cmd_advance(cmd);
				}
			});
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `boot ovs`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.boot_ovs,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	////////////////[boot_libreswan]/////////////////
		
	this.boot_libreswan = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `boot_libreswan${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			libreswan_states: this.libreswan_states,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `boot libreswan instances`,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.boot_vpn,
				output_cb: this.docker_expr.parse_libreswan_ips
			},
			{
				key: cmd_key,
				label: `connect libreswan instances`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.ovs_add_ports
			},
			{
				key: cmd_key,
				label: `add ctl passthrough flows`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.add_of_ctl_passthrough,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	//////////////[restart_libreswan]////////////////
		
	this.restart_libreswan = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `restart_libreswan${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			libreswan_states: this.libreswan_states,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `restart libreswan services`,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.restart_libreswan,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	//////////////////[reset_nic]////////////////////
		
	this.reset_nic = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `reset_nic${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `reset SmartNIC vpn configuration`,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.load_vpn_cfg,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	///////////////////[boot_vpn]////////////////////
		
	this.boot_vpn = function (cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const cmd_key = `boot_vpn${nic_id}_${exec_time}`;
		
		this.gw_config.reset();

		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			libreswan_states: this.libreswan_states,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `configure libreswan instances`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.init_vpn_dirs,
				output_cb: this.docker_expr.update_vpn_conf
			},
			{
				key: cmd_key,
				label: `boot libreswan instances`,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.boot_vpn,
				output_cb: this.docker_expr.parse_libreswan_ips
			},
			{
				key: cmd_key,
				label: `connect libreswan instances`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.ovs_docker_add_ports
			},
			{
				key: cmd_key,
				label: `initialize ENET vpn configuration`,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.load_vpn_cfg,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		cfg.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	////////////////////[conn_add]///////////////////
	
	this.conn_add = function (cfg, conn_id, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_key = `nic${nic_id}_conn${conn_id}_add`;
		const cmd_key = `${conn_key}_${exec_time}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			conn_id: conn_id,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.conn_add,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	/////////////////////[conn_up]///////////////////
	
	this.conn_up = function (cfg, conn_id, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_key = `nic${nic_id}_conn${conn_id}_up`;
		const cmd_key = `${conn_key}_${exec_time}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			conn_id: conn_id,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.docker_expr.conn_up,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	///////[add_outbound_tunnel_full_offload]////////
	
	this.add_outbound_tunnel_full_offload = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
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
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			that.mea_expr.ipsec_outbound.outbound_forwarders_parse(cmd, function () {
				
				var output_processor = cmd.output_processor[cmd.key];
				that.cmd_log.push(output_processor);
				delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
				if (output_processor.ret_cb) {
					var ret_cb = output_processor.ret_cb;
					ret_cb(cmd, that.gw_config);
					delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
				} else {
					that.gw_config.cmd_advance(cmd);
				}
			});
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.ipsec_outbound.outbound_profile_add,
				output_cb: this.mea_expr.ipsec_outbound.outbound_profile_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.ipsec_outbound.outbound_encrypt_action_add,
				output_cb: this.mea_expr.ipsec_outbound.outbound_encrypt_action_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.ipsec_outbound.outbound_forwarders_add,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	////////[add_outbound_tunnel_no_offload]/////////
	
	this.add_outbound_tunnel_no_offload = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.tunnel_states[tunnel_key] = {
			nic_id: nic_id,
			conn_id: conn_id,
			port_in: parseInt(conn_cfg.lan_port),
			port_out: parseInt(conn_cfg.tunnel_port),
			gw_in: `250.${nic_id}.${nic_id}.250`,
			gw_out: conn_cfg.remote_tunnel_endpoint_ip,
			subnet_in: conn_cfg.local_subnet,
			subnet_out: conn_cfg.remote_subnet,
			remote_tunnel_mac: remote_tunnel_mac,
			local_tunnel_mac: vpn_common.vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port),
			ipsec_cfg: ipsec_cfg
		};
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `add outbound tunnel flows`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.add_outbound_tunnel_no_offload,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	//////////////[outbound_tunnel_add]//////////////
	
	this.outbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			expr: [],
			output: []
		};
		
		switch (conn_cfg.outbound_accel) {

			case `full`:
			this.add_outbound_tunnel_full_offload(cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb);
			break;

			case `none`:
			this.add_outbound_tunnel_no_offload(cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb);
			break;

			default:
			delete this.output_processor[cmd_key].ret_cb;
			this.output_processor[cmd_key].meta.error = `Outbound tunnel ${tunnel_key} acceleration unsupported: ${conn_cfg.outbound_accel}.`;
			ret_cb({ key: cmd_key, output_processor: this.output_processor });
			break;
		}
	};
	
	/////////////////////////////////////////////////
	////////[add_inbound_tunnel_full_offload]////////
	
	this.add_inbound_tunnel_full_offload = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
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
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			that.mea_expr.ipsec_inbound.inbound_service_parse(cmd, function () {
				
				var output_processor = cmd.output_processor[cmd.key];
				that.cmd_log.push(output_processor);
				delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
				if (output_processor.ret_cb) {
					var ret_cb = output_processor.ret_cb;
					ret_cb(cmd, that.gw_config);
					delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
				} else {
					that.gw_config.cmd_advance(cmd);
				}
			});
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.ipsec_inbound.inbound_profile_add,
				output_cb: this.mea_expr.ipsec_inbound.inbound_profile_parse
			},
			{
				key: cmd_key,
				output_processor: this.output_processor,
				expr_builder: this.mea_expr.ipsec_inbound.inbound_service_add,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	/////////[add_inbound_tunnel_no_offload]/////////
	
	this.add_inbound_tunnel_no_offload = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.tunnel_states[tunnel_key] = {
			nic_id: nic_id,
			conn_id: conn_id,
			port_in: parseInt(conn_cfg.tunnel_port),
			port_out: parseInt(conn_cfg.lan_port),
			gw_in: conn_cfg.remote_tunnel_endpoint_ip,
			gw_out: `250.${nic_id}.${nic_id}.250`,
			subnet_in: conn_cfg.remote_subnet,
			subnet_out: conn_cfg.local_subnet,
			remote_tunnel_mac: remote_tunnel_mac,
			local_tunnel_mac: vpn_common.vpn_conn_mac_base(nic_id, conn_id, conn_cfg.tunnel_port),
			ipsec_cfg: ipsec_cfg
		};
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};
		
		var that = this;
		var finish_cb = function (cmd) {
			
			var output_processor = cmd.output_processor[cmd.key];
			that.cmd_log.push(output_processor);
			if (output_processor.ret_cb) {
				var ret_cb = output_processor.ret_cb;
				ret_cb(cmd, that.gw_config);
				delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
			} else {
				that.gw_config.cmd_advance(cmd);
			}
			return cmd;
		};
		
		const host_cmds = [
			{
				key: cmd_key,
				label: `add inbound tunnel flows`,
				target: `localhost`,
				output_processor: this.output_processor,
				expr_builder: this.ovs_expr.add_inbound_tunnel_no_offload,
				output_cb: finish_cb
			}
		];
		this.gw_config.host_exec_cmd(host_cmds);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	/////////////////////////////////////////////////
	///////////////[inbound_tunnel_add]//////////////
	
	this.inbound_tunnel_add = function (cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const conn_cfg = cfg.conns[conn_id];
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		const cmd_key = `${tunnel_key}_${exec_time}`;
		
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			cfg: cfg,
			expr: [],
			output: []
		};
		
		switch (conn_cfg.inbound_accel) {

			case `full`:
			this.add_inbound_tunnel_full_offload(cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb);
			break;

			case `none`:
			this.add_inbound_tunnel_no_offload(cfg, conn_id, remote_tunnel_mac, ipsec_cfg, ret_cb);
			break;

			default:
			delete this.output_processor[cmd_key].ret_cb;
			this.output_processor[cmd_key].meta.error = `Inbound tunnel ${tunnel_key} acceleration unsupported: ${conn_cfg.inbound_accel}.`;
			ret_cb({ key: cmd_key, output_processor: this.output_processor });
			break;
		}
	};
	
	/////////////////////////////////////////////////
	////////////////[inbound_fwd_add]////////////////
	
	this.inbound_fwd_add = function (cfg, conn_id, remote_tunnel_mac, next_hops, lan_port, ret_cb) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const exec_time = new Date().getTime();
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		const cmd_key = `${tunnel_key}_fwd_${exec_time}`;
				
		this.output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, latencies: [], ret: [] },
			tunnel_state: this.tunnel_states[tunnel_key],
			next_hops: next_hops,
			cfg: cfg,
			expr: [],
			output: [],
			ret_cb: ret_cb
		};

		if (this.tunnel_states[tunnel_key] === undefined) {			
			delete this.output_processor[cmd_key].ret_cb;
			this.output_processor[cmd_key].meta.error = `Inbound tunnel ${tunnel_key} not found.`;
			ret_cb({ key: cmd_key, output_processor: this.output_processor });
		} else if (this.tunnel_states[tunnel_key].port_out !== lan_port) {
			delete this.output_processor[cmd_key].ret_cb;
			this.output_processor[cmd_key].meta.error = `Tunnel ${tunnel_key} LAN port ${this.tunnel_states[tunnel_key].port_out} != ${lan_port}.`;
			ret_cb({ key: cmd_key, output_processor: this.output_processor });
		} else {			
			var that = this;
			var finish_cb = function (cmd) {
				
				that.mea_expr.ipsec_inbound.inbound_fwd_forwarder_parse(cmd, function () {
					
					var output_processor = cmd.output_processor[cmd.key];
					that.cmd_log.push(output_processor);
					delete that.cmd_log[that.cmd_log.length - 1][`cfg`];
					if (output_processor.ret_cb) {
						var ret_cb = output_processor.ret_cb;
						ret_cb(cmd, that.gw_config);
						delete that.cmd_log[that.cmd_log.length - 1][`ret_cb`];
					} else {
						that.gw_config.cmd_advance(cmd);
					}
				});
			};
			
			const host_cmds = [
				{
					key: cmd_key,
					output_processor: this.output_processor,
					expr_builder: this.mea_expr.ipsec_inbound.inbound_fwd_action_add,
					output_cb: this.mea_expr.ipsec_inbound.inbound_fwd_action_parse
				},
				{
					key: cmd_key,
					output_processor: this.output_processor,
					expr_builder: this.mea_expr.ipsec_inbound.inbound_fwd_forwarder_add,
					output_cb: finish_cb
				}
			];
			this.gw_config.host_exec_cmd(host_cmds);
			this.tunnel_states.UPDATE = `${new Date()}`;
		}		
	};
	
	/////////////////////////////////////////////////
	////////////////[dump_cmd_log]///////////////////
	
	this.dump_cmd_log = function (ret_cb) {
		
		const exec_time = new Date().getTime();
		const cmd_key = `dump_cmd_log_${exec_time}`;
		
		var output_processor = {};
		output_processor[cmd_key] = {
			meta: { key: cmd_key, exec_time: exec_time, ret: this.cmd_log }
		};
		
		ret_cb({ key: cmd_key, output_processor: output_processor });
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
		const tunnel_key = `nic${nic_id}_conn${conn_id}_in`;
		console.log(`inbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] === undefined) ? 'undefined' : 'EXISTS'}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.outbound_tunnel_del = function (cfg, conn_id) {
		
		const nic_id = cfg.ace_nic_config[0].nic_name;		
		const tunnel_key = `nic${nic_id}_conn${conn_id}_out`;
		console.log(`outbound_tunnel_del(${nic_id}, ${conn_id}) => this.tunnel_states[${tunnel_key}]: ${(this.tunnel_states[tunnel_key] === undefined) ? 'undefined' : 'EXISTS'}`);
		this.tunnel_states.UPDATE = `${new Date()}`;
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		//this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, mea_tunnel_port, `ip neigh`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		//this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		//this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
