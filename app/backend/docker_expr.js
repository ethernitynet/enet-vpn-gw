
	
var shutdown_libreswan_inst = function (cmd, libreswan_inst) {

	var expr = ``;
	expr += `docker kill ${libreswan_inst}\n`;
	expr += `docker rm ${libreswan_inst}\n`;
	return expr;
};

var boot_libreswan_inst = function (cmd, host_dir, vpn_inst, libreswan_inst, libreswan_img) {

	var output_processor = cmd.output_processor[cmd.key];
	const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
	const shared_dir = `${host_dir}/enet-vpn-gw/shared/${vpn_inst}`;
	
	var expr = ``;
	expr += `mkdir -p ${shared_dir}/${libreswan_inst}\n`;
	expr += `docker run -t -d --rm --ipc=host --privileged`;
	expr += `	--hostname=${libreswan_inst}`;
	expr += `	--name=${libreswan_inst}`;
	expr += `	--env ACENIC_ID=${nic_id}`;
	expr += `	--env DOCKER_INST=${libreswan_inst}`;
	//expr += `	-v ${shared_dir}/${libreswan_inst}/ipsec.conf:/etc/ipsec.conf`;
	//expr += `	-v ${shared_dir}/${libreswan_inst}/ipsec.secrets:/etc/ipsec.secrets`;
	expr += `	-v ${shared_dir}/conn:/shared/conn`;
	expr += `	${libreswan_img}\n`;
	return expr;
};

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {

	
	/////////////////////////////////////////////////
	/////////////////[boot_libreswan]////////////////
	
	this.boot_libreswan = function (cmd) {
	
		var output_processor = cmd.output_processor[cmd.key];
		const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
		const host_dir = output_processor.cfg.ace_nic_config[0].install_dir;
		const vpn_inst = `enet${nic_id}-vpn`;
		
		var expr = ``;
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan104`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan105`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan106`);
		expr += shutdown_libreswan_inst(cmd, `enet${nic_id}_libreswan107`);
		expr += boot_libreswan_inst(cmd, host_dir, `enet${nic_id}-vpn`, `enet${nic_id}_libreswan104`, `local/enet-libreswan:v3.27`);
		expr += boot_libreswan_inst(cmd, host_dir, `enet${nic_id}-vpn`, `enet${nic_id}_libreswan105`, `local/enet-libreswan:v3.27`);
		expr += boot_libreswan_inst(cmd, host_dir, `enet${nic_id}-vpn`, `enet${nic_id}_libreswan106`, `local/enet-libreswan:v3.27`);
		expr += boot_libreswan_inst(cmd, host_dir, `enet${nic_id}-vpn`, `enet${nic_id}_libreswan107`, `local/enet-libreswan:v3.27`);
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
		
		if(output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			const ipv4_regex = /(\d+\.\d+\.\d+\.\d+)/g;
			
			const ips_arr = prev_stdout.match(ipv4_regex);
			for(var i = 0; i < ips_arr.length; ++i) {
				libreswan_states[`enet${nic_id}_libreswan${104 + i}`] = { ip: ips_arr[i] };
			}
			if(return_cb) {
				return_cb(cmd);
			}
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
