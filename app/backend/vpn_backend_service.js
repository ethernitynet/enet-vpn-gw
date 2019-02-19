
var VPN_BACKEND = require('./vpn_backend.js');
var http = require('http');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////


module.exports = function (host_profile, gw_profiles, service_ip, service_port) {

	this.service_ip = service_ip;
	this.service_port = service_port;
	this.vpn_cfg = {
		OBJ: `vpn_cfg`,
		UPDATE: `never`
	};
	this.vpn_backend = new VPN_BACKEND(host_profile, gw_profiles);

	this.find_conn = function (tunnel_spec) {
		
		console.log(`tunnel_spec: ${JSON.stringify(tunnel_spec)}`);
		//console.log(`tunnel_spec: ${JSON.stringify(this.vpn_cfg.VPN.conns, null, 2)}`);
		const conn_id = this.vpn_cfg.VPN.conns.findIndex((conn) => 
			//(console.log(`conn: ${JSON.stringify(conn)}`)) && 
			(conn.local_subnet == tunnel_spec.local_subnet) && 
			(conn.remote_subnet == tunnel_spec.remote_subnet) && 
			(conn.lan_port == tunnel_spec.lan_port) && 
			(conn.tunnel_port == tunnel_spec.tunnel_port));
		return conn_id;
	};

	this.find_remote_tunnel_mac = function (tunnel_spec) {
		
		if(tunnel_spec.remote_tunnel_mac === undefined) {
			return `${enet_mac_pfx}0:00:00`;
		};
		return tunnel_spec.remote_tunnel_mac;
	};

	this.dump_vpn_cfg = function () {
		
		var dump_str = `\n`;
		dump_str += JSON.stringify(this.vpn_cfg, null, 2);
		dump_str += `\n`;
		return dump_str;
	};

	this.dump_tunnel_states = function () {
		
		return this.vpn_backend.dump_tunnel_states();
	};

	this.get_stats = function () {
		
		return this.vpn_backend.get_stats(this.vpn_cfg.VPN);
	};

	this.load_vpn_cfg = function (vpn_cfg) {
		
		this.vpn_cfg.VPN = vpn_cfg.VPN;
		this.vpn_backend.vpn_init(this.vpn_cfg.VPN);
		const response = {
			cmd: `load_vpn_cfg`,
			conns_count: vpn_cfg.VPN.conns.length,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};
	
	this.add_outbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.outbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg);
		const response = {
			cmd: `add_outbound_tunnel`,
			tunnel_spec: tunnel_spec,
			ipsec_cfg: ipsec_cfg,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};

	this.add_inbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.inbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg);
		const response = {
			cmd: `add_inbound_tunnel`,
			tunnel_spec: tunnel_spec,
			ipsec_cfg: ipsec_cfg,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};

	this.add_inbound_fwd = function (tunnel_spec, next_hops, lan_port) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.inbound_fwd_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, next_hops, lan_port);
		const response = {
			cmd: `add_inbound_fwd`,
			tunnel_spec: tunnel_spec,
			next_hops: next_hops,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};
	
	this.del_outbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		this.vpn_backend.outbound_tunnel_del(this.vpn_cfg.VPN, conn_id);
		const response = {
			cmd: `del_outbound_tunnel`,
			tunnel_spec: tunnel_spec,
			ipsec_cfg: ipsec_cfg,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};

	this.del_inbound_tunnel = function (tunnel_spec, ipsec_cfg) {
		
		const conn_id = this.find_conn(tunnel_spec);
		this.vpn_backend.inbound_tunnel_del(this.vpn_cfg.VPN, conn_id);
		const response = {
			cmd: `del_inbound_tunnel`,
			tunnel_spec: tunnel_spec,
			ipsec_cfg: ipsec_cfg,
			UPDATE: `${new Date()}`
		};
		return JSON.stringify(response);
	};
	
	this.backend_server = http.createServer((req, res) => {
		
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
			'Access-Control-Max-Age': 2592000, // 30 days
			/** add other headers as per requirement */
		};

		if (req.method === 'OPTIONS') {
			res.writeHead(204, headers);
			res.end();
			return;
		};
		
		if(req.method == `POST`) {
			let chunk_no = 0;
			let body = ``;
			
				req.on('data', chunk => {
					
					//console.log(`chunk#${chunk_no}: ${chunk}`);
					++chunk_no;
					body += chunk.toString();
				});
				req.on('end', () => {
					
					if (['GET', 'POST'].indexOf(req.method) > -1) {
						res.writeHead(200, headers);
					};
					//console.log(`end: ${chunk_no} chunks`);
					//console.log(`body: ${body}`);
					try {
						const content = JSON.parse(body);
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
								res.end(this.add_inbound_fwd(content.tunnel_spec, content.next_hops, content.lan_port));
							break;
							case `del_outbound_tunnel`:
								res.end(this.del_outbound_tunnel(content.tunnel_spec, content.ipsec_cfg));
							break;
							case `del_inbound_tunnel`:
								res.end(this.del_inbound_tunnel(content.tunnel_spec, content.ipsec_cfg));
							break;
							default:
								res.writeHead(405, headers);
								const response = {
									op: content.op,
									err: `Unknown op`,
									body: body,
									UPDATE: `${new Date()}`
								};
								res.end(JSON.stringify(response));
							break;
						};
					}
					catch(error) {
						res.writeHead(405, headers);
						const response = {
							chunks_count: chunk_no,
							err: `JSON parse error`,
							body: body,
							UPDATE: `${new Date()}`
						};
						res.end(JSON.stringify(response));
						return;
					};
				});
			return;
		};
		
		res.writeHead(405, headers);
		const response = {
			method: req.method,
			err: `Method not allowed`,
			UPDATE: `${new Date()}`
		};
		res.end(JSON.stringify(response));
		
	}).listen(this.service_port, this.service_ip);
};

