
/////////////////////////////
process.title = `backend_start`;
/////////////////////////////

var vpn_common = require('./vpn_common.js');
var VPN_BACKEND_SERVICE = require('./vpn_backend_service.js');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

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
	
	const acenic_id = (process.env.ACENIC_ID === undefined) ? `0` : process.env.ACENIC_ID;
	switch (acenic_id) {
	case `0`:
	case `1`:
		const backend_port = `${backend_port_base}${acenic_id}`;
		console.log(`ENET VPN Backend Service for ACENIC_ID ${acenic_id}: listening on port ${backend_port}.`);
		var vpn_backend_service = new VPN_BACKEND_SERVICE(host_profile, vpn_gw_profiles, `0.0.0.0`, backend_port);
		break;
	default:
		console.error(`ACENIC_ID: ${acenic_id} (int no greater than ${max_acenic_id}) unsupported. Aborting.`);
		break;
	}
};

nic_backend_start(vpn_host_profile_default, vpn_gw_profiles_default);
