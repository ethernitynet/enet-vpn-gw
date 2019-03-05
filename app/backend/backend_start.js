
/////////////////////////////
process.title = `backend_start`;
/////////////////////////////

var vpn_common = require('./vpn_common.js');
var VPN_BACKEND_SERVICE = require('./vpn_backend_service.js');
const request = require('request');
var fs = require('fs');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

const argc_nic_id = 2;
const backend_port_base = 4400;
const max_acenic_id = 1;

const vpn_host_profile_default = {
	host: `172.17.0.1`,
	username: `root`,
	password: `devops123`
};

var vpn_gw_profiles_default = {};
vpn_gw_profiles_default[vpn_common.mea_tunnel_port] = {
	host: `172.17.0.5`,
	username: `root`,
	password: `root`
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var nic_backend_start = function (host_profile, vpn_gw_profiles) {
	
	if(process.env.ACENIC_ID !== undefined) {
		switch(process.env.ACENIC_ID) {
		case `0`:
		case `1`:
			const backend_port = (backend_port_base + process.env.ACENIC_ID);
			console.log(`ENET VPN Backend Service for ACENIC_ID ${process.env.ACENIC_ID}: listening on port ${backend_port}.`);
			var vpn_backend_service = new VPN_BACKEND_SERVICE(host_profile, vpn_gw_profiles, `0.0.0.0`, backend_port);
			break;
		default:
			console.error(`ACENIC_ID: ${process.env.ACENIC_ID} (int no greater than ${max_acenic_id}) unsupported. Aborting.`);
			break;
		}
	}
	else {
		console.error(`ACENIC_ID env veriable is not defined. Aborting.`);
	}
};

nic_backend_start(vpn_host_profile_default, vpn_gw_profiles_default);

