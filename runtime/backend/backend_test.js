
var VPN_BACKEND = require('./vpn_backend.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


var vpn_backend = new VPN_BACKEND(
	{
		host: `172.17.0.1`,
		username: `root`,
		password: `devops123`
	},
	{
		104: {
			host: `172.17.0.2`,
			username: `root`,
			password: `root`
		}
	});

vpn_backend.vpn_init(0);
vpn_backend.outbound_tunnel_add(0, 5);
//vpn_backend.gw_connect(0, 104);
//console.log(`5. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
vpn_backend.dump_output_processor(0);
var i = 6;
var j = 100;
function myFunc() {

	//console.log(`=> ${i}. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
	++i;
};
//setInterval(myFunc, 1000);

/*
var log_processor = function () {
	
	const stdout_count = Object.keys(vpn_backend.output_processor.stdout).length;
	console.log(`stdout_count: ${stdout_count}`);
	if(stdout_count > 0) {
		
		Object.keys(vpn_backend.output_processor.stdout).forEach(cmd_key => {
			
			console.log(`[${cmd_key}]: ${vpn_backend.output_processor.stdout[cmd_key]}`);
		});
	};
};
*/

function myFunc2() {

	//console.log(`==> ${j}. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);
	vpn_backend.dump_output_processor(0);
	//++j;
};
setInterval(myFunc2, 2000);
//console.log(`7. ${new Date().getTime()}: ${JSON.stringify(vpn_backend.output_processor)}`);

/*
gw_config_inst.host_cmd(`echo 'HOST'; hostname; whoami; uptime; uname -a`);
gw_config_inst.vpn_cmd(`echo 'VPN'; hostname; whoami; uptime; uname -a`);
gw_config_inst.gw_cmd(`echo 'GW'; hostname; whoami; uptime; uname -a`);

console.log(JSON.stringify(gw_config_inst.cmd_arr));
console.log(JSON.stringify(gw_config_inst.stdout_arr));
console.log(JSON.stringify(gw_config_inst.stderr_arr));
*/
