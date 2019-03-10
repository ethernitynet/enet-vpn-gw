
var vpn_common = require('./vpn_common.js');
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
			(conn.local_subnet === tunnel_spec.local_subnet) && 
			(conn.remote_subnet === tunnel_spec.remote_subnet) && 
			(conn.lan_port === tunnel_spec.lan_port) && 
			(conn.tunnel_port === tunnel_spec.tunnel_port));
		return conn_id;
	};

	this.find_remote_tunnel_mac = function (tunnel_spec) {
		
		if(tunnel_spec.remote_tunnel_mac === undefined) {
			return `${vpn_common.enet_mac_pfx}0:00:00`;
		}
		return tunnel_spec.remote_tunnel_mac;
	};

	this.dump_vpn_cfg = function (res) {
		
		res.end(JSON.stringify(this.vpn_cfg));
	};

	this.dump_tunnel_states = function (res) {
		
		res.end(JSON.stringify(this.vpn_backend.tunnel_states));
	};

	this.get_stats = function () {
		
		return this.vpn_backend.get_stats(this.vpn_cfg.VPN);
	};

	this.vpn_test = function (res) {
		
		this.vpn_backend.vpn_test(function (cmd, gw_config) {

			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
			gw_config.cmd_advance(cmd);
		});
	};

	this.load_vpn_cfg = function (vpn_cfg, res) {
		
		this.vpn_cfg.VPN = vpn_cfg.VPN;
		this.vpn_backend.load_vpn_cfg(this.vpn_cfg.VPN, function (cmd, gw_config) {

			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
			gw_config.cmd_advance(cmd);
		});
	};
	
	this.outbound_tunnel_add = function (tunnel_spec, ipsec_cfg, res) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.outbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg, function (cmd, gw_config) {
			
			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
			gw_config.cmd_advance(cmd);
		});
	};

	this.inbound_tunnel_add = function (tunnel_spec, ipsec_cfg, res) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.inbound_tunnel_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, ipsec_cfg, function (cmd, gw_config) {
			
			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
			gw_config.cmd_advance(cmd);
		});
	};

	this.inbound_fwd_add = function (tunnel_spec, next_hops, lan_port, res) {
		
		const conn_id = this.find_conn(tunnel_spec);
		const remote_tunnel_mac = this.find_remote_tunnel_mac(tunnel_spec);
		this.vpn_backend.inbound_fwd_add(this.vpn_cfg.VPN, conn_id, remote_tunnel_mac, next_hops, lan_port, function (cmd, gw_config) {
			
			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
			gw_config.cmd_advance(cmd);
		});
	};

	this.dump_cmd_log = function (res) {
		
		this.vpn_backend.dump_cmd_log(function (cmd) {
			
			const output_processor = cmd.output_processor[cmd.key];
			const output_str = JSON.stringify(output_processor.meta);
			res.end(output_str);
		});
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
		}
		
		if(req.method === `POST`) {
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
					}
					//console.log(`end: ${chunk_no} chunks`);
					//console.log(`body: ${body}`);
					var content = {};
					try {
						content = JSON.parse(body);
					}
					catch(error) {
						res.writeHead(405, headers);
						const response = {
							chunks_count: chunk_no,
							err: `JSON parse error: ${error}`,
							body: body,
							UPDATE: `${new Date()}`
						};
						res.end(JSON.stringify(response));
						return;
					}
					try {
						switch(content.op) {
							case `get_stats`:
								res.end(this.get_stats());
							break;
							case `dump_vpn_cfg`:
								this.dump_vpn_cfg(res);
							break;
							case `dump_tunnel_states`:
								this.dump_tunnel_states(res);
							break;
							case `vpn_test`:
								this.vpn_test(res);
							break;
							case `load_vpn_cfg`:
								this.load_vpn_cfg(content.vpn_cfg, res);
							break;
							case `outbound_tunnel_add`:
								this.outbound_tunnel_add(content.tunnel_spec, content.ipsec_cfg, res);
							break;
							case `inbound_tunnel_add`:
								this.inbound_tunnel_add(content.tunnel_spec, content.ipsec_cfg, res);
							break;
							case `inbound_fwd_add`:
								this.inbound_fwd_add(content.tunnel_spec, content.next_hops, content.lan_port, res);
							break;
							case `dump_cmd_log`:
								this.dump_cmd_log(res);
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
									err: `Unknown op: ${content.op}`,
									body: body,
									UPDATE: `${new Date()}`
								};
								res.end(JSON.stringify(response));
							break;
						}
					}
					catch(error) {
						res.writeHead(405, headers);
						const response = {
							chunks_count: chunk_no,
							err: `Internal error: ${error}`,
							body: body,
							UPDATE: `${new Date()}`
						};
						res.end(JSON.stringify(response));
						return;
					}
				});
			return;
		}
		
		res.writeHead(405, headers);
		const response = {
			err: `Method not allowed: ${req.method}`,
			UPDATE: `${new Date()}`
		};
		res.end(JSON.stringify(response));
		
	}).listen(this.service_port, this.service_ip);
};

