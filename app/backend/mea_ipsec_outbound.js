
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {
		
	/////////////////////////////////////////////////
	//////////////[outbound_tunnel_add]//////////////
	
	this.outbound_profile_add = function (cmd) {

		const tunnel_state = cmd.output_processor[cmd.key].tunnel_state;
		const security_type = vpn_common.mea_ipsec_format_security_type(tunnel_state.ipsec_cfg.auth_algo, tunnel_state.ipsec_cfg.cipher_algo);
		const tunnel_keys = vpn_common.mea_ipsec_format_keys(tunnel_state.ipsec_cfg.auth_key, tunnel_state.ipsec_cfg.cipher_key);
		var tunnel_keys_str = ``;
		tunnel_keys_str += `-Integrity_key ${tunnel_keys.integrity_key} `;
		tunnel_keys_str += `-Integrity_IV ${tunnel_keys.integrity_iv} `;
		tunnel_keys_str += `-Confident_key ${tunnel_keys.confidentiality_key} `;
		tunnel_keys_str += `-Confident_IV ${tunnel_keys.confidentiality_iv}`;
		const nic_id = tunnel_state.nic_id;
		const ipsec_add = vpn_common.mea_ipsec_profile_add(nic_id);
		const action_add = vpn_common.mea_action_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${ipsec_add} auto -security_type ${security_type} -TFC_en 0 -ESN_en 0 -SPI ${tunnel_state.ipsec_cfg.spi} ${tunnel_keys_str}\n`;
		expr += `${action_add} -pm 1 0 -ed 1 0 -h 0 0 0 0 -lmid 1 0 1 0 -r ${tunnel_state.remote_tunnel_mac} ${tunnel_state.local_tunnel_mac} 0000\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.outbound_profile_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 1) {
			const prev_stdout = output_processor.output[0].stdout;
			cmd.return_cb = [ return_cb ];
			cmd.return_cb.push(function (cmd) {
				
				vpn_common.mea_action_add_parse(cmd, tunnel_state, `l3fwd_action`, prev_stdout);
			});
			vpn_common.mea_ipsec_add_parse(cmd, tunnel_state, `encrypt_profile`, prev_stdout);
		}
	};

	this.outbound_encrypt_action_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const action_add = vpn_common.mea_action_add(nic_id);		
		const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${action_add} -pm 1 0 -ed 1 0 -hIPSec 1 1 ${vpn_cfg.vpn_gw_ip} ${conn_cfg.remote_tunnel_endpoint_ip} -hESP 1 ${tunnel_state.encrypt_profile.id} -hType 71\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};
	
	this.outbound_encrypt_action_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		
		if(output_processor.output.length === 2) {
			const prev_stdout = output_processor.output[1].stdout;
			cmd.return_cb = [ return_cb ];
			vpn_common.mea_action_add_parse(cmd, tunnel_state, `encrypt_action`, prev_stdout);
		}
	};
	
	this.outbound_forwarders_add = function (cmd) {
		
		var output_processor = cmd.output_processor[cmd.key];
		const tunnel_state = output_processor.tunnel_state;
		const nic_id = tunnel_state.nic_id;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		const forwarder_add = vpn_common.mea_forwarder_add(nic_id);
		
		var expr = ``;
		expr += `${vpn_common.mea_cli_prefix(nic_id)}\n`;
		expr += `${forwarder_add} 0 ${tunnel_state.local_tunnel_mac} ${conn_cfg.lan_port} 3 1 0 1 ${vpn_common.mea_cipher_port} -action 1 ${tunnel_state.encrypt_action.id}\n`;
		expr += `${forwarder_add} 0 ${tunnel_state.local_tunnel_mac} ${vpn_common.mea_cipher_port} 3 1 0 1 ${conn_cfg.tunnel_port} -action 1 ${tunnel_state.l3fwd_action.id}\n`;
		expr += `${vpn_common.mea_cli_suffix()}\n`;
		return expr;
	};

	this.outbound_forwarders_parse = function (cmd, return_cb) {

		var output_processor = cmd.output_processor[cmd.key];
		var tunnel_state = output_processor.tunnel_state;
		const conn_cfg = output_processor.cfg.conns[tunnel_state.conn_id];
		
		if(output_processor.output.length === 3) {
			const prev_stdout = output_processor.output[2].stdout;
			cmd.return_cb = [ return_cb ];
			cmd.return_cb.push(function (cmd) {
				
				vpn_common.mea_forwarder_add_parse(cmd, tunnel_state, `l3fwd_forwarder`, `0 ${tunnel_state.local_tunnel_mac} ${vpn_common.mea_cipher_port}`, prev_stdout);
			});
			vpn_common.mea_forwarder_add_parse(cmd, tunnel_state, `encrypt_forwarder`, `0 ${tunnel_state.local_tunnel_mac} ${conn_cfg.lan_port}`, prev_stdout);
		}
	};
		
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
