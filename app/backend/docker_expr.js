
var LIBRESWAN_EXPR = require('./libreswan_expr.js');
var libreswan_expr = new LIBRESWAN_EXPR();

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

var shutdown_libreswan_inst = function (cmd, libreswan_inst) {

	var expr = ``;
	expr += `docker kill ${libreswan_inst}\n`;
	expr += `docker rm ${libreswan_inst}\n`;
	return expr;
};

var boot_libreswan_inst = function (cmd, libreswan_inst, libreswan_img) {

	var output_processor = cmd.output_processor[cmd.key];
	const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
	const vpn_shared_dir = `/shared/enet${nic_id}-vpn`;	
	const host_dir = output_processor.cfg.ace_nic_config[0].install_dir;
	const libreswan_shared_dir = `${host_dir}/enet-vpn-gw/${vpn_shared_dir}/${libreswan_inst}`;
	
	var expr = ``;
	expr += `docker run -t -d --rm --ipc=host --privileged`;
	expr += `	--hostname=${libreswan_inst}`;
	expr += `	--name=${libreswan_inst}`;
	expr += `	--env ACENIC_ID=${nic_id}`;
	expr += `	--env DOCKER_INST=${libreswan_inst}`;
	expr += `	-v ${libreswan_shared_dir}/ipsec.conf:/etc/ipsec.conf`;
	expr += `	-v ${libreswan_shared_dir}/ipsec.secrets:/etc/ipsec.secrets`;
	expr += `	${libreswan_img}\n`;
	return expr;
};

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {

	/////////////////////////////////////////////////
	/////////////////[boot_libreswan]////////////////
	
	this.init_vpn_dirs = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const vpn_shared_dir = `/shared/enet${nic_id}-vpn`;
		
		var expr = ``;
		expr += libreswan_expr.init_libreswan_dir(cmd, `enet${nic_id}_libreswan104`);
		expr += libreswan_expr.init_libreswan_dir(cmd, `enet${nic_id}_libreswan105`);
		expr += libreswan_expr.init_libreswan_dir(cmd, `enet${nic_id}_libreswan106`);
		expr += libreswan_expr.init_libreswan_dir(cmd, `enet${nic_id}_libreswan107`);
		return expr;
	};
	
	this.update_vpn_conf = function (cmd, return_cb) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const vpn_shared_dir = `/shared/enet${nic_id}-vpn`;
		
		libreswan_expr.build_libreswan_conf(cmd, function (libreswan_expr) {
			
			libreswan_expr.update_libreswan_conf(cmd, vpn_shared_dir, `enet${nic_id}_libreswan104`);
			libreswan_expr.update_libreswan_conf(cmd, vpn_shared_dir, `enet${nic_id}_libreswan105`);
			libreswan_expr.update_libreswan_conf(cmd, vpn_shared_dir, `enet${nic_id}_libreswan106`);
			libreswan_expr.update_libreswan_conf(cmd, vpn_shared_dir, `enet${nic_id}_libreswan107`);
			if(return_cb) {
				return_cb(cmd);
			}
		});
	};
	
	this.boot_vpn = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const libreswan_img = `ethernity/libreswan:v3.27`;
		
		var expr = ``;
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan104`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan105`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan106`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan107`);
		expr += boot_libreswan_inst(cmd, `enet${nic_id}_libreswan104`, libreswan_img);
		expr += boot_libreswan_inst(cmd, `enet${nic_id}_libreswan105`, libreswan_img);
		expr += boot_libreswan_inst(cmd, `enet${nic_id}_libreswan106`, libreswan_img);
		expr += boot_libreswan_inst(cmd, `enet${nic_id}_libreswan107`, libreswan_img);
		expr += `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' enet${nic_id}_libreswan104\n`;
		expr += `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' enet${nic_id}_libreswan105\n`;
		expr += `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' enet${nic_id}_libreswan106\n`;
		expr += `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' enet${nic_id}_libreswan107\n`;
		return expr;
	};

	this.parse_libreswan_ips = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		var libreswan_states = output_processor.libreswan_states;
		
		if(output_processor.output.length > 0) {
			const prev_stdout = output_processor.output[output_processor.output.length - 1].stdout;
			const ipv4_regex = /(\d+\.\d+\.\d+\.\d+)/g;
			
			const ips_arr = prev_stdout.match(ipv4_regex);
			if((ips_arr !== undefined) && (ips_arr !== null)) {
				for(var i = 0; i < ips_arr.length; ++i) {
					libreswan_states[`enet${nic_id}_libreswan${104 + i}`] = { ip: ips_arr[i] };
				}
			}
			if(return_cb) {
				return_cb(cmd);
			}
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
