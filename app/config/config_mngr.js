

function tun_ls_cfg_build(tun_json_cfg) {

	let tun_ls_cfg = '\n';
	tun_ls_cfg += 'conn ' + tun_json_cfg['Name'] + '\n';
	var libreswan_specific_config = tun_json_cfg['Configuration']['LibreSwan-Specific Configuration'];
	var libreswan_specific_config_arr = libreswan_specific_config.split('\n');
	libreswan_specific_config_arr.forEach(function(param) {
		tun_ls_cfg += '  ' + param + '\n';
	});
	tun_config += '  type=tunnel\n';
	conf_tunnel += '  left=' + tun_cfg['Tunnel'][0]['Local Endpoint']['IP'] + '\n';
	conf_tunnel += '  right=' + tun_cfg['Tunnel'][0]['Remote Endpoint']['IP'] + '\n';
	conf_tunnel += '  leftsubnet=' + ipsec_cfg['Trusted Side']['Trusted CIDR'] + '\n';
	conf_tunnel += '  rightsubnet=' + ipsec_cfg['Protected Side']['Protected CIDR'] + '\n';
	conf_tunnel += '  authby=secret\n';
	conf_tunnel += '  ike=aes-sha1;modp2048\n';
	conf_tunnel += '  ikev2=insist\n';
	conf_tunnel += '  narrowing=yes\n';
	conf_tunnel += '  esp=' + ipsec_get_cipher_type(ipsec_cfg) + '\n';
	conf_tunnel += '#\n';
	return conf_tunnel;
};
