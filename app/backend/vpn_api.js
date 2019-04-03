
/*
var post_via_request = function (label, ip, port, post_content) {

	request.post(`http://${ip}:${port}`, { json: post_content }, (error, res, body) => {
		
		console.log(`${label}> request.post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) statusCode: ${res.statusCode} error: ${error}`);
		if (error) {
			console.error(error);
		}
		else {
			console.log(body);
		}
	});	
};
*/

/*
var post_via_xhr = function (label, ip, port, post_content) {

	var xhr = new XMLHttpRequest();
	xhr.open(`POST`, `http://${ip}:${port}/`, true);
	xhr.setRequestHeader(`Content-type`, `application/json;charset=UTF-8`);
	xhr.onreadystatechange = function () {

		console.log(`${label}> xhr post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) xhr.status: ${xhr.status} xhr.readyState: ${xhr.readyState}`);
		if (xhr.readyState === 4 && xhr.status === 200) {
			console.log(xhr.responseText);
		}
	};
	const post_content_str = JSON.stringify({ data: post_content });
	xhr.send(post_content_str);
};
*/

var post_via_ajax = function (label, ip, port, post_content, finish_cb) {

	const url = `http://${ip}:${port}/`;
	const post_content_str = JSON.stringify(post_content);
	$.ajax({
		type: `POST`,
		url: url,
		// The key needs to match your method's input parameter (case-sensitive).
		data: post_content_str,
		contentType: `text/plain`,
		dataType: `json`,
		success: function (data) {
			
			console.log(JSON.stringify(data));
			if (finish_cb !== undefined) {
				finish_cb();
			}
		},
		failure: function (errMsg) {
			
			console.log(`ERROR ${label}> ajax post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) error: ${errMsg}`);
		},
		statusCode: {
			404: function () {
				console.log(`${label}> ajax post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) code: 404`);
			},
			405: function () {
				console.log(`${label}> ajax post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) code: 405`);
			},
			200: function (data) {
				const response_str = `[${data.responseText.replace(/}{/g, '},{')}]`;
				const response = JSON.parse(response_str);
				console.log(`${label}@${ip}:${port} <= 200`);
				console.log(JSON.stringify(response, null, 2));
			}
		}
	});
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var enet_boot_vpn = function (backend_ip, backend_port, vpn_cfg, finish_cb) {
	
	const post_content = {
		op: `boot_vpn`,
		vpn_cfg: vpn_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	//post_via_xhr(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};

var enet_vpn_outbound_tunnel_add = function (backend_ip, backend_port, tunnel_spec, ipsec_cfg, finish_cb) {

	const post_content = {
		op: `outbound_tunnel_add`,
		tunnel_spec: tunnel_spec,
		ipsec_cfg: ipsec_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};

var enet_vpn_inbound_tunnel_add = function (backend_ip, backend_port, tunnel_spec, ipsec_cfg, finish_cb) {
	
	const post_content = {
		op: `inbound_tunnel_add`,
		tunnel_spec: tunnel_spec,
		ipsec_cfg: ipsec_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};

var enet_vpn_inbound_fwd_add = function (backend_ip, backend_port, tunnel_spec, next_hops, lan_port, finish_cb) {
	
	const post_content = {
		op: `inbound_fwd_add`,
		tunnel_spec: tunnel_spec,
		next_hops: next_hops,
		lan_port: lan_port
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};

var enet_vpn_outbound_tunnel_disconnect = function (backend_ip, backend_port, tunnel_spec, finish_cb) {

	const post_content = {
		op: `del_outbound_tunnel`,
		tunnel_spec: tunnel_spec
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};

var enet_vpn_inbound_tunnel_disconnect = function (backend_ip, backend_port, tunnel_spec, finish_cb) {
	
	const post_content = {
		op: `del_inbound_tunnel`,
		tunnel_spec: tunnel_spec
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, finish_cb);
};
