	
global.mea_cli = function (nic_id) {
	
	if(nic_id > 0) {
		return `meaCli -card ${nic_id} mea`;
	}
	else {
		return `meaCli mea`;
	};
};
	
global.mea_init_expr = function (nic_id) {
	
	const mea_cmd = mea_cli(nic_id);
	
	var expr = ``;
	expr += `${mea_cmd} port ingress set all -a 1 -c 0\n`;
	expr += `${mea_cmd} port egress set all -a 1 -c 1\n`;
	expr += `${mea_cmd} IPSec global set ttl 40\n`;
	expr += `${mea_cmd} forwarder delete all\n`;
	expr += `${mea_cmd} action set delete all\n`;
	expr += `${mea_cmd} service set delete all\n`;
	expr += `${mea_cmd} IPSec ESP set delete all\n`;
	return expr;
};
	
global.mea_ports_init_expr = function (nic_id) {
	
	const mea_cmd = mea_cli(nic_id);
	
	var expr = ``;
	expr += `${mea_cmd} service set create 24 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 0 -f 1 0 -ra 0 -l2Type 0 -v 24 -p 0 -h 0 0 0 0 -lmid 1 0 1 0 -r CC:D3:9D:D0:00:24 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} service set create 104 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 104 -h 0 0 0 0 -lmid 1 0 1 0 -r CC:D3:9D:D0:00:04 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} service set create 105 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 105 -h 0 0 0 0 -lmid 1 0 1 0 -r CC:D3:9D:D0:00:05 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} service set create 106 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 106 -h 0 0 0 0 -lmid 1 0 1 0 -r CC:D3:9D:D0:00:06 00:00:00:00:00:00 0000 -hType 0\n`;
	expr += `${mea_cmd} service set create 107 FFF000 FFF000 D.C 0 1 0 1000000000 0 64000 0 0 1 127 -f 1 0 -ra 0 -l2Type 0 -v 107 -h 0 0 0 0 -lmid 1 0 1 0 -r CC:D3:9D:D0:00:07 00:00:00:00:00:00 0000 -hType 0\n`;
	return expr;
};

var GW_CONFIG = require('./gw_config.js');

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
		
		var cmd = mea_init_expr(nic_id);
		cmd += mea_ports_init_expr(nic_id);
		this.gw_config.host_cmd(this.output_processor, nic_id, `init`, cmd);
	};
	
	this.gw_connect = function (nic_id, gw_port) {
		
		this.gw_config.gw_cmd(this.output_processor, nic_id, `conn1`, 104, `ip neigh`);
		this.gw_config.host_cmd(this.output_processor, nic_id, `gw${gw_port}`, `uptime`);
		this.gw_config.vpn_cmd(this.output_processor, nic_id, `enet0-vpn`, `ovs-vsctl show`);
		this.gw_config.host_cmd(this.output_processor, nic_id, `pm${gw_port}`, `cat /tmp/blkshow.txt`);
	};
};
