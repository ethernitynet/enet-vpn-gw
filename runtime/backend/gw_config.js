
var shell = require('shelljs');
var SSH = require('ssh2').Client;
	
var output_merge = function (output_processor, nic_id, cmd_key, output) {

	output_processor[nic_id][cmd_key].output_time = output.output_time;
	if(output.code !== undefined) {
		output_processor[nic_id][cmd_key].code = output.code;
	};
	if(output.stdout !== undefined) {
		output_processor[nic_id][cmd_key].stdout += output.stdout;
	};
	if(output.stderr !== undefined) {
		output_processor[nic_id][cmd_key].stderr += output.stderr;
	};
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles) {

	this.host_profile = host_profile;
	this.gw_profiles = gw_profiles;

	this.host_cmd = function (output_processor, nic_id, cmds_arr) {

		console.log(`cmds_arr: ${JSON.stringify(cmds_arr, null, 2)}`);
		if(cmds_arr.length > 0) {
			const cmd = cmds_arr[0];
			cmds_arr.shift();
			console.log(`>>>>==============================================>`);
			console.log(`host_cmd:${cmd.expr}`);
			output_processor[nic_id][cmd.key] = { expr: `${cmd.expr}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
			var that = this;
			var conn = new SSH();
			conn.on('ready', function() {
				
				//console.log('Client :: ready');
				conn.exec(cmd.expr, function(err, stream) {
					
					if (err) throw err;
					stream.on('close', function(code, signal) {
						
						console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
						output_merge(output_processor, nic_id, cmd.key, { output_time: `${new Date().getTime()}`, code: code });
						conn.end();
						if(code == 0) {
							if(cmds_arr.length > 0) {
								setTimeout(that.host_cmd, cmd.delay, nic_id, cmds_arr);
							};
						};
					}).on('data', function(data) {
						
						console.log('STDOUT: ' + data);
						output_merge(output_processor, nic_id, cmd.key, { output_time: `${new Date().getTime()}`, stdout: `${data}` });
					}).stderr.on('data', function(data) {
						
						console.log('STDERR: ' + data);
						output_merge(output_processor, nic_id, cmd.key, { output_time: `${new Date().getTime()}`, stderr: `${data}` });
					});
				});
			}).connect(this.host_profile);
			console.log(`<<<<==============================================`);
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
