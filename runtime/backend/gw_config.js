
var shell = require('shelljs');
var SSH = require('ssh2').Client;
	
var output_merge = function (output_processor, cmd_key, output) {

	output_processor[cmd_key].output_time = output.output_time;
	if(output.code !== undefined) {
		output_processor[cmd_key].code = output.code;
	};
	if(output.stdout !== undefined) {
		output_processor[cmd_key].stdout += output.stdout;
	};
	if(output.stderr !== undefined) {
		output_processor[cmd_key].stderr += output.stderr;
	};
};

var host_cmd_exec = function (gw_config_inst) {
	
	//console.log(`host_cmds_arr: ${JSON.stringify(gw_config_inst.host_cmds_arr, null, 2)}`);
	if(gw_config_inst.host_cmds_arr.length > 0) {
		const cmd = gw_config_inst.host_cmds_arr[0];
		gw_config_inst.host_cmds_arr.shift();
		console.log(`About to exec ${cmd.key} [cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
		console.log(`>>>>==============================================>`);
		const expr = cmd.expr_builder(cmd);
		console.log(`host_cmd:${expr}`);
		cmd.output_processor[cmd.key] = { expr: `${expr}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
		gw_config_inst.host_conn = new SSH();
		gw_config_inst.host_conn.on('ready', function() {
			
			//console.log('Client :: ready');
			gw_config_inst.host_conn.exec(expr, function(err, stream) {
				
				if (err) throw err;
				stream.on('close', function(code, signal) {
					
					console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
					output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, code: code });
					gw_config_inst.host_conn.end();
					console.log(`About to set timeout ${cmd.delay} after ${cmd.key} [code:${code} cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
					if(code == 0) {
						if(gw_config_inst.host_cmds_arr.length > 0) {
							setTimeout(host_cmd_exec, cmd.delay, gw_config_inst);
						};
					};
				}).on('data', function(data) {
					
					console.log('STDOUT: ' + data);
					output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, stdout: `${data}` });
				}).stderr.on('data', function(data) {
					
					console.log('STDERR: ' + data);
					output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, stderr: `${data}` });
				});
			});
		}).connect(gw_config_inst.host_profile);
		console.log(`<<<<==============================================`);
	}
	else {
		gw_config_inst.host_conn = undefined;
	};
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function (host_profile, gw_profiles) {

	this.host_profile = host_profile;
	this.gw_profiles = gw_profiles;
	this.host_cmds_arr = [];
	this.host_conn = undefined;

	this.host_cmds_append = function (cmds_arr) {
		
		this.host_cmds_arr = this.host_cmds_arr.concat(cmds_arr);
	};
	
	this.host_cmd = function () {

		if(this.host_conn === undefined) {
			host_cmd_exec(this);
		};
	};
	
	this.gw_cmd = function (output_processor, nic_id, cmd_key, gw_port, cmd) {
		
		console.log(`>>>>==============================================>`);
		console.log(`gw_cmd:${cmd}`);
		output_processor[nic_id][cmd_key] = { cmd: `${cmd}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
		var conn = new SSH();
		conn.on('ready', function() {
			
			//console.log('Client :: ready');
			conn.exec(cmd, function(err, stream) {
				
				if (err) throw err;
				stream.on('close', function(code, signal) {
					
					//console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
					conn.end();
					output_merge(output_processor, nic_id, cmd_key, { output_time: `${new Date().getTime()}`, code: code });
				}).on('data', function(data) {
					
					//console.log('STDOUT: ' + data);
					output_merge(output_processor, nic_id, cmd_key, { output_time: `${new Date().getTime()}`, stdout: `${data}` });
				}).stderr.on('data', function(data) {
					
					//console.log('STDERR: ' + data);
					output_merge(output_processor, nic_id, cmd_key, { output_time: `${new Date().getTime()}`, stderr: `${data}` });
				});
			});
		}).connect(this.gw_profiles[gw_port]);
		console.log(`<<<<==============================================`);
	};
	
	this.vpn_cmd = function (output_processor, nic_id, cmd_key, cmd) {
		
		console.log(`==============================================>`);
		console.log(`vpn_cmd:${cmd}`);
		output_processor[nic_id][cmd_key] = { cmd: `${cmd}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
		const exec_res = shell.exec(cmd, `/bin/bash`);
		output_merge(output_processor, nic_id, cmd_key, { output_time: `${new Date().getTime()}`, code: exec_res.code, stdout: `${exec_res.stdout}`, stderr: `${exec_res.stderr}` });
		console.log(`<==============================================`);
	};
};
