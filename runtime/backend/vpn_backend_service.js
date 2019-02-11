
var VPN_BACKEND = require('./vpn_backend.js');
var http = require('http');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles, service_port) {

	this.service_port = service_port;
	this.vpn_cfg = undefined;
	this.vpn_backend = new VPN_BACKEND(host_profile, gw_profiles);

	this.find_conn = function (tunnel_spec) {
		
		const conn_id = this.vpn_cfg.VPN.conns.findIndex((conn) => 
			(conn.local_subnet === tunnel_spec.local_subnet) && 
			(conn.remote_subnet === tunnel_spec.remote_subnet) && 
			(conn.lan_port === tunnel_spec.lan_port) && 
			(conn.tunnel_port === tunnel_spec.tunnel_port));
		return conn_id;
	};

	this.find_remote_tunnel_mac = function (tunnel_spec) {
		
		if(tunnel_spec.remote_tunnel_mac === undefined) {
			return `cc:d3:9d:d0:00:00`;
		};
		return tunnel_spec.remote_tunnel_mac;
	};

	this.dump_vpn_cfg = function () {
		
		var dump_str = `\n`;
		dump_str += `=========================\n`;
		dump_str += `==  VPN Configuration  ==\n`;
		dump_str += `=========================\n`;
		dump_str += JSON.stringify(this.vpn_cfg, null, 2);
		dump_str += `\n`;
		dump_str += `=========================\n`;
		dump_str += `=========================\n`;
		dump_str += `\n`;
		return dump_str;
	};

	this.dump_tunnel_states = function () {
		
		return this.vpn_backend.dump_tunnel_states();
	};

	this.load_vpn_cfg = function (vpn_cfg) {
		
		this.vpn_cfg = vpn_cfg;
		this.vpn_backend.vpn_init(this.vpn_cfg.VPN);
		return `load_vpn_cfg> conns:[${vpn_cfg.VPN.conns.length}]  =>  Done.`;
	};
	
	this.add_outbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.outbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg);
		return `add_outbound_tunnel> tunnel:[${JSON.stringify(tunnel_spec)}], spi: ${ipsec_cfg.spi}  =>  Done.`;
	};

	this.add_inbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.inbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg);
		return `add_inbound_tunnel> tunnel:[${JSON.stringify(tunnel_spec)}], spi: ${ipsec_cfg.spi}  =>  Done.`;
	};

	this.add_inbound_fwd = function (tunnel_spec, next_hops) {
		
		const conn_id = this.find_conn(tunnel_spec);
		this.vpn_backend.inbound_fwd_add(this.vpn_cfg.VPN, conn_id, next_hops);
		return `add_inbound_fwd> tunnel:[${JSON.stringify(tunnel_spec)}], next_hops: ${next_hops.length}  =>  Done.`;
	};
	
	this.backend_server = http.createServer((req, res) => {
		
		let data = [];
		req.on('data', chunk => {
			
			data.push(chunk);
		});
		req.on('end', () => {
			
			const content = JSON.parse(data);
			switch(content.op) {
				case `dump_vpn_cfg`:
					res.end(this.dump_vpn_cfg());
				break;
				case `dump_tunnel_states`:
					res.end(this.dump_tunnel_states());
				break;
				case `load_vpn_cfg`:
					res.end(this.load_vpn_cfg(content.vpn_cfg));
				break;
				case `add_outbound_tunnel`:
					res.end(this.add_outbound_tunnel(content.tunnel_spec, content.ipsec_cfg));
				break;
				case `add_inbound_tunnel`:
					res.end(this.add_inbound_tunnel(content.tunnel_spec, content.ipsec_cfg));
				break;
				case `add_inbound_fwd`:
					res.end(this.add_inbound_fwd(content.tunnel_spec, content.next_hops));
				break;
			};
		});
	}).listen(this.service_port);
};

