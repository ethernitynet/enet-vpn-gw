
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {
		
	/////////////////////////////////////////////////
	///////////////[inbound_tunnel_add]//////////////
	
	this.inbound_profile_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const security_type = vpn_common.mea_ipsec_format_security_type(tunnel_state.ipsec_cfg.auth_algo, tunnel_state.ipsec_cfg.cipher_algo);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(tunnel_state.ipsec_cfg.auth_key, tunnel_state.ipsec_cfg.cipher_key);
		var tunnel_keys_str = ``;
		tunnel_keys_str += `-Integrity_key ${tunnel_keys.integrity_key} `;
		tunnel_keys_str += `-Integrity_IV ${tunnel_keys.integrity_iv} `;
		tunnel_keys_str += `-Confident_key ${tunnel_keys.confidentiality_key} `;
		tunnel_keys_str += `-Confident_IV ${tunnel_keys.confidentiality_iv}`;
		const nic_id = tunnel_state.nic_id;
		const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
		const service_add = vpn_common.mea_service_add(nic_id);
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		const conn_tag = vpn_common.vpn_conn_tag(output_processor.cfg, tunnel_state);
		const port_macs = vpn_common.mea_port_macs(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${tunnel_state.ipsec_cfg.spi} ${tunnel_keys_str}\n`;
		expr += `${service_add} ${vpn_common.mea_cipher_port} FF1${conn_tag_hex} FF1${conn_tag_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_host_port} -f 1 6 -v ${256 + conn_tag} -l4port_mask 1 -ra 0 -l2Type 1 -h 0 0 0 0 -lmid 1 0 1 0 -r ${port_macs[vpn_common.mea_cipher_port]} 00:00:00:00:00:00 0000 -hType 0\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_profile_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if (output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			cmd.return_cb = [ return_cb ];
			cmd.return_cb.push(function (cmd) {
				
				vpn_common.mea_service_add_parse(cmd, tunnel_state, `l3fwd_service`, prev_stdout);
			});
			vpn_common.mea_ipsec_add_parse(cmd, tunnel_state, `decrypt_profile`, prev_stdout);
		}
	};
	
	this.inbound_service_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const service_add = vpn_common.mea_service_add(nic_id);
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		const port_macs = vpn_common.mea_port_macs(nic_id);
		const remote_ip_hex = vpn_common.ip_to_hex(conn_cfg.remote_tunnel_endpoint_ip);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${service_add} ${conn_cfg.tunnel_port} ${remote_ip_hex} ${remote_ip_hex} D.C 0 1 0 1000000000 0 64000 0 0 1 ${vpn_common.mea_cipher_port} -ra 0 -inf 1 0x${vpn_common.uint32_to_hex(tunnel_state.ipsec_cfg.spi)} -l2Type 0 -subType 19 -h 810001${conn_tag_hex} 0 0 0 -hType 1 -hESP 2 ${tunnel_state.decrypt_profile.id} -lmid 1 0 1 0 -r ${port_macs[conn_cfg.tunnel_port]} 00:00:00:00:00:00 0000\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_service_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if (output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			cmd.return_cb = [ return_cb ];
			vpn_common.mea_service_add_parse(cmd, tunnel_state, `decrypt_service`, prev_stdout);
		}
	};
	
	/////////////////////////////////////////////////
	////////////////[inbound_fwd_add]////////////////

	this.inbound_fwd_action_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const nic_id = tunnel_state.nic_id;
		const action_add = vpn_common.mea_action_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		for (var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
			expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${next_hops[next_hop_idx].mac} ${tunnel_state.local_tunnel_mac} 0000 -hType 3\n`;
		}
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.inbound_fwd_action_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		
		if (output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			cmd.return_cb = [ return_cb ];
			cmd.return_cb.push(function (cmd) {
				
				const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
				for (var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
					tunnel_state.fwd[prev_next_hops_count + next_hop_idx].ip = next_hops[next_hop_idx].ip;
					tunnel_state.fwd[prev_next_hops_count + next_hop_idx].mac = next_hops[next_hop_idx].mac;
					if ((next_hop_idx + 1) === next_hops.length) {
						if (cmd.return_cb && cmd.return_cb.length > 0) {
							var return_cb = cmd.return_cb.pop();
							if (return_cb) {
								return_cb(cmd);
							}
						}
					}
				}
			});
			vpn_common.mea_actions_add_parse(cmd, tunnel_state.fwd, prev_stdout);
		}
	};

	this.inbound_fwd_forwarder_add = function (cmd) {

		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const nic_id = tunnel_state.nic_id;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
		for (var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
			const fwd = tunnel_state.fwd[prev_next_hops_count + next_hop_idx];
			expr += `${forwarder_add} 6 ${fwd.ip} 0 0x1${conn_tag_hex} 3 1 0 1 ${conn_cfg.lan_port} -action 1 ${fwd.action_id}\n`;
		}
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.inbound_fwd_forwarder_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const next_hops = output_processor.next_hops;
		const conn_tag_hex = vpn_common.vpn_conn_tag_hex(output_processor.cfg, tunnel_state);
		
		if (output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			const prev_next_hops_count = (tunnel_state.fwd.length - next_hops.length);
			for (var next_hop_idx = 0; next_hop_idx < next_hops.length; ++next_hop_idx) {
				var fwd = tunnel_state.fwd[prev_next_hops_count + next_hop_idx];
				if ((next_hop_idx + 1) === next_hops.length) {
					cmd.return_cb = [ return_cb ];
					vpn_common.mea_forwarder_add_parse(cmd, fwd, `forwarder`, `6 ${fwd.ip} 0 0x1${conn_tag_hex}`, prev_stdout);
				} else {
					delete cmd.return_cb;
					vpn_common.mea_forwarder_add_parse(cmd, fwd, `forwarder`, `6 ${fwd.ip} 0 0x1${conn_tag_hex}`, prev_stdout);
				}
			}
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
