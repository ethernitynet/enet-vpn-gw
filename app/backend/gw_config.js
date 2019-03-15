
var shell = require('shelljs');
var SSH = require('ssh2').Client;
var LOG4JS = require('log4js');
LOG4JS.configure({
	appenders: { gw_config: { type: 'file', filename: '/tmp/enet_vpn_gw.log' } },
	categories: { default: { appenders: ['gw_config'], level: 'debug' } }
});

/*
	
var output_merge = function (output_processor, cmd_key, output) {

	output_processor[cmd_key].output_time = output.output_time;
	if(output.code !== undefined) {
		output_processor[cmd_key].code = output.code;
	}
	if(output.stdout !== undefined) {
		output_processor[cmd_key].stdout += output.stdout;
	}
	if(output.stderr !== undefined) {
		output_processor[cmd_key].stderr += output.stderr;
	}
};

var host_shell_exec = function (gw_config_inst, cmd) {
	
	console.log(`host_shell_exec() host_cmds_arr: ${JSON.stringify(gw_config_inst.host_cmds_arr, null, 2)}`);
	console.log(`>>>>=================== host_shell_exec ===========================>`);
	console.log(`About to exec ${cmd.key} [cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
	const expr = cmd.expr_builder(cmd);
	console.log(`host_cmd:${expr}`);
	cmd.output_processor[cmd.key] = { expr: `${expr}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
	if(gw_config_inst.host_shell === undefined) {
		gw_config_inst.host_shell = new SSH();	
		gw_config_inst.host_shell.on('connect', function() {
			
			console.log('Shell Connection :: connect');
		});
	}
	gw_config_inst.host_shell.on('ready', function() {
		
		console.log('Shell Client :: ready');
		gw_config_inst.host_shell.shell('', function(err, stream) {
			
			if (err) {
				throw err;
			}
			stream.on('close', function(code, signal) {
				
				console.log('Shell Stream :: close :: code: ' + code + ', signal: ' + signal);
				output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, code: code });
				console.log(`About to set timeout ${cmd.delay} after ${cmd.key} [code:${code} cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
				if(code === 0) {
					if(gw_config_inst.host_cmds_arr.length > 0) {
						const cmd = gw_config_inst.host_cmds_arr[0];
						gw_config_inst.host_cmds_arr.shift();
						if(cmd.delay > 0) {
							setTimeout(host_shell_exec, cmd.delay, gw_config_inst, cmd);
						}
						else {
							setImmediate(host_shell_exec, gw_config_inst, cmd);
						}
					}
					else {
						gw_config_inst.host_shell_end();
					}
				}
			}).on('data', function(data) {
				
				//console.log('STDOUT: ' + data);
				output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, stdout: `${data}` });
			}).stderr.on('data', function(data) {
				
				console.log('STDERR: ' + data);
				output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, stderr: `${data}` });
			});
			
			stream.on('end', function(code, signal) {
				console.log('Stream :: EOF', code, signal);
			});
			//stream.on('close', function(code, signal) {
			//	console.log('Stream :: close', code, signal);
			//});
			stream.on('exit', function(code, signal) {
				console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
				//c.end();
			});
			stream.on('drain', function() {
				console.log('Stream :: drain');
			});
			
			stream.write(expr);
			
		});
	}).connect(gw_config_inst.host_profile);
	console.log(`<<<<==============================================`);
};

var host_cmd_exec = function (gw_config_inst) {
	
	//console.log(`host_cmds_arr: ${JSON.stringify(gw_config_inst.host_cmds_arr, null, 2)}`);
	if(gw_config_inst.host_cmds_arr.length > 0) {
		const cmd = gw_config_inst.host_cmds_arr[0];
		gw_config_inst.host_cmds_arr.shift();
		console.log(`>>>>==============================================>`);
		console.log(`About to exec ${cmd.key} [cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
		const expr = cmd.expr_builder(cmd);
		console.log(`host_cmd:${expr}`);
		cmd.output_processor[cmd.key] = { expr: `${expr}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
		gw_config_inst.host_conn = new SSH();
		gw_config_inst.host_conn.on('ready', function() {
			
			//console.log('Client :: ready');
			gw_config_inst.host_conn.exec(expr, function(err, stream) {
				
				if (err) {
					throw err;
				}
				stream.on('close', function(code, signal) {
					
					console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
					output_merge(cmd.output_processor, cmd.key, { output_time: `${new Date().getTime()}`, code: code });
					gw_config_inst.host_conn.end();
					console.log(`About to set timeout ${cmd.delay} after ${cmd.key} [code:${code} cmds-count: ${gw_config_inst.host_cmds_arr.length}]`);
					if(code === 0) {
						if(gw_config_inst.host_cmds_arr.length > 0) {
							if(cmd.delay > 0) {
								setTimeout(host_cmd_exec, cmd.delay, gw_config_inst);
							}
							else {
								setImmediate(host_cmd_exec, gw_config_inst);
							}
						}
						else {
							gw_config_inst.host_conn = undefined;
						}
					}
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
	}
};

*/




var host_do_exec = function (gw_config_inst, host_exec_conn) {
	
	const cmd = gw_config_inst.host_cmds_arr[0];
	var exec_cmd = gw_config_inst.host_exec_cmd_handler(`exec`, {});
	if(exec_cmd) {
		if(cmd.target === `localhost`) {
			exec_cmd = `/bin/bash -c '${exec_cmd}'`;
			gw_config_inst.host_exec_conn = host_exec_conn;	
			const exec_result = shell.exec(exec_cmd, function (code, stdout, stderr) {
				
				gw_config_inst.host_exec_cmd_handler(`exit`, { code: code });
				gw_config_inst.host_exec_cmd_handler(`stdout`, { stdout: stdout });
				gw_config_inst.host_exec_cmd_handler(`stderr`, { stderr: stderr });
				gw_config_inst.host_exec_cmd_handler(`close`, {});
			});
		}
		else {
			host_exec_conn.exec(exec_cmd, function(err, stream) {
				
				if (err) {
					console.error(`host_do_exec()#${gw_config_inst.host_execs_count} ERROR: ${err}`);
					gw_config_inst.host_exec_end();
				}
				else {
					gw_config_inst.host_exec_conn = host_exec_conn;	
					gw_config_inst.host_exec_stream = stream;
					++gw_config_inst.host_execs_count;
					gw_config_inst.host_exec_stream_init();
				}
			});
		}
	}
	else {
		gw_config_inst.host_exec_cmd_handler(`close`, {});
	}
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

module.exports = function (host_profile, gw_profiles) {

	this.log = LOG4JS.getLogger('gw_config');
	this.host_profile = host_profile;
	this.gw_profiles = gw_profiles;
	this.host_cmds_arr = [];
	this.host_conn = undefined;
	this.host_shell = undefined;
	this.host_shell_stream = undefined;
	this.host_shells_count = 0;
	this.host_exec_conn = undefined;
	this.host_exec_stream = undefined;
	this.host_execs_count = 0;

	this.reset = function () {
		
		if(this.host_cmds_arr.length > 0) {
			const cmd = this.host_cmds_arr[0];
			var output_processor = cmd.output_processor[cmd.key];
			output_processor.meta.orphan_cmds = this.host_cmds_arr;
			this.host_cmds_arr = [];
		}
		this.host_exec_end();
	};

	this.host_cmd_prefix = function () {
		
		const host_cmd_lock_timeout = 10;
		
		var expr = ``;
		expr += `(\n`;
		expr += `flock -o -x -w ${host_cmd_lock_timeout} 200\n`;
		return expr;
	};

	this.host_cmd_suffix = function () {
		
		const host_cmd_lockfile = `/var/lock/host_cmd_lockfile`;
		
		var expr = ``;
		expr += `)200>${host_cmd_lockfile}\n`;
		expr += `exit\n`;
		return expr;
	};

	this.host_exec_cmd_handler = function (event, data) {
		
		const cmd = this.host_cmds_arr[0];
		var output_processor = cmd.output_processor[cmd.key];
		switch(event) {
		case `exec`:
			var expr = cmd.expr_builder(cmd);
			if(expr) {
				expr = this.host_cmd_prefix() + expr + this.host_cmd_suffix();
				output_processor.expr.push(expr);
				this.log.debug(`${cmd.key} EXEC: ${JSON.stringify(output_processor.expr[output_processor.expr.length - 1])}`);
				output_processor.output.push({ stdout: ``, stderr: `` });
				output_processor.meta.latencies.push(new Date().getTime());
			}
			return expr;
		case `stdout`:
			output_processor.output[output_processor.output.length - 1].stdout += data.stdout;
			return ``;
		case `stderr`:
			this.log.error(`${cmd.key} STDERR: ${data.stderr}`);
			output_processor.output[output_processor.output.length - 1].stderr += data.stderr;
			return ``;
		case `close`:
			const latency = (new Date().getTime() - output_processor.meta.latencies[output_processor.meta.latencies.length - 1]);
			output_processor.meta.latencies[output_processor.meta.latencies.length - 1] = latency;
			this.log.debug(`${cmd.key} CLOSE: ${JSON.stringify(output_processor.output[output_processor.output.length - 1])}`);
			if(cmd.output_cb) {
				var that = this;
				cmd.output_cb(cmd, function (cmd) {
					
					that.cmd_advance(cmd);
				});
			}
			else {
				this.cmd_advance(cmd);
			}
			return ``;
		case `exit`:
			this.log.debug(`${cmd.key} EXIT: ${JSON.stringify(data)}`);
			output_processor.meta.ret.push({ code: data.code, signal: data.signal });
			return ``;
		default:
			return ``;
		}
	};
	
	this.cmd_advance = function (prev_cmd) {
		
		const delay = ((prev_cmd !== undefined) && (prev_cmd.delay !== undefined)) ? prev_cmd.delay : 0;
		this.host_cmds_arr.shift();
		if(this.host_cmds_arr.length > 0) {
			if(delay > 0) {
				setTimeout(host_do_exec, delay, this, this.host_exec_conn);
			}
			else {
				setImmediate(host_do_exec, this, this.host_exec_conn);
			}
		}
		else {
			this.host_exec_end();
		}
	};

	this.host_exec_stream_init = function () {
		
		var that = this;
		this.host_exec_stream.on('data', function(data) {
			
			that.host_exec_cmd_handler(`stdout`, { stdout: data });
		});
		this.host_exec_stream.stderr.on('data', function(data) {
			
			that.host_exec_cmd_handler(`stderr`, { stderr: data });
		});
		this.host_exec_stream.on('close', function() {
			
			that.host_exec_cmd_handler(`close`, {});
		});
		this.host_exec_stream.on('exit', function(code, signal) {
			
			const exit_obj = { code: code, signal: signal };
			that.host_exec_cmd_handler(`exit`, exit_obj);
		});
	};

	this.host_exec_start = function () {
		
		var that = this;
		if(this.host_exec_conn === undefined) {
			if(this.host_exec_stream !== undefined) {
				this.log.debug(`Exec#${this.host_execs_count} STREAM RESET (host_exec_conn: ${this.host_exec_conn})`);
				this.host_exec_stream.end();
				this.host_exec_stream = undefined;
				--this.host_execs_count;
			}
			var host_exec_conn = new SSH();
			host_exec_conn.on('ready', function() {
				
				that.log.info(`Exec#${that.host_execs_count} Connection: ready`);
				host_do_exec(that, host_exec_conn);
			}).connect(this.host_profile);				
		}
	};

	this.host_exec_end = function () {
		
		if(this.host_exec_conn !== undefined) {
			if(this.host_exec_stream !== undefined) {
				this.log.debug(`Exec#${this.host_execs_count} STREAM END (host_exec_conn: ${this.host_exec_conn})`);
				this.host_exec_stream.end();
				this.host_exec_stream = undefined;
				--this.host_execs_count;
			}
			this.log.debug(`Exec#${this.host_execs_count} CONN END`);
			this.host_exec_conn.end();
			this.host_exec_conn = undefined;
		}
		else {
			if(this.host_exec_stream !== undefined) {
				this.log.debug(`Exec#${this.host_execs_count} STREAM END (host_exec_conn: ${this.host_exec_conn})`);
				this.host_exec_stream.end();
				this.host_exec_stream = undefined;
				--this.host_execs_count;
			}				
		}
	};
	
	this.host_cmds_append = function (cmds_arr) {
		
		this.host_cmds_arr = this.host_cmds_arr.concat(cmds_arr);
	};
	
	this.host_exec_cmd = function (cmds_arr) {

		if(cmds_arr !== undefined) {
			this.host_cmds_append(cmds_arr);
		}
		this.log.debug(`Exec#${this.host_execs_count} host_exec_cmd() host_cmds_arr.length: ${this.host_cmds_arr.length}`);
		if(this.host_cmds_arr.length > 0) {
			this.host_exec_start();
		}
		else {
			this.host_exec_end();
		}
	};
	
	/*
	this.gw_cmd = function (output_processor, nic_id, cmd_key, gw_port, cmd) {
		
		console.log(`>>>>==============================================>`);
		console.log(`gw_cmd:${cmd}`);
		output_processor[nic_id][cmd_key] = { cmd: `${cmd}`, exec_time: `${new Date().getTime()}`, stdout: ``, stderr: `` };
		var conn = new SSH();
		conn.on('ready', function() {
			
			//console.log('Client :: ready');
			conn.exec(cmd, function(err, stream) {
				
				if (err) {
					throw err;
				}
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
	*/
};
