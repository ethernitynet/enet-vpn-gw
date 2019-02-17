
/////////////////////////////
process.title = `backend_start`;
/////////////////////////////

var VPN_BACKEND_SERVICE = require('./vpn_backend_service.js');
const request = require('request');
var fs = require('fs');

const argc_nic_id = 2;

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

const vpn_host_profile = {
	host: `172.17.0.1`,
	username: `root`,
	password: `devops123`
};

var nic_backend_start = function (host_profile) {
	
	var vpn_gw_profiles = {};
	vpn_gw_profiles[mea_tunnel_port] = {
		host: `172.17.0.5`,
		username: `root`,
		password: `root`
	};
	
	if(process.env.ACENIC_ID != undefined) {
		const backend_port = (4400 + process.env.ACENIC_ID);
		console.error(`ENET VPN Backend Service for ACENIC_ID ${process.env.ACENIC_ID}: listening on port ${backend_port}.`);
		var vpn_backend_service = new VPN_BACKEND_SERVICE(host_profile, vpn_gw_profiles, `0.0.0.0`, backend_port);
	}
	else {
		console.error(`ACENIC_ID env veriable is not defined. Aborting.`);
	};;
};

nic_backend_start(vpn_host_profile);

