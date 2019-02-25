

var post_via_request = function (label, ip, port, post_content) {

	request.post(`http://${ip}:${port}`, { json: post_content }, (error, res, body) => {
		
		console.log(`${label}> request.post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) statusCode: ${res.statusCode} error: ${error}`);
		if(error) {
			console.error(error);
		}
		else {
			console.log(body);
		};
	});	
};

var post_via_xhr = function (label, ip, port, post_content) {

	xhr = new XMLHttpRequest();
	xhr.open("POST", `http://${ip}:${port}/`, true);
	xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
	xhr.onreadystatechange = function () {

		console.log(`${label}> xhr post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) xhr.status: ${xhr.status} xhr.readyState: ${xhr.readyState}`);
		if (xhr.readyState == 4 && xhr.status == 200) {
			console.log(xhr.responseText);
		};
	};
	const post_content_str = JSON.stringify({ data: post_content });
	xhr.send(post_content_str);
};

var post_via_ajax = function (label, ip, port, post_content, on_success_callback) {

	const url = `http://${ip}:${port}/`;
	const post_content_str = JSON.stringify(post_content);
	$.ajax({
		type: "POST",
		url: url,
		// The key needs to match your method's input parameter (case-sensitive).
		data: post_content_str,
		contentType: "text/plain",
		dataType: "json",
		success: function(data) {
			
			console.log(`${label}> ajax post(${ip}, ${port}, post_content) response: ${JSON.stringify(data)}`);
			if(on_success_callback != undefined) {
				on_success_callback();
			};
		},
		failure: function(errMsg) {
			
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
				console.log(`${label}> ajax post(${ip}, ${port}, ${JSON.stringify(post_content, null, 2)}) code: 200`);
			}
		}
	});
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var enet_vpn_load_cfg = function (backend_ip, backend_port, vpn_cfg, on_success_callback) {
	
	const post_content = {
		op: `load_vpn_cfg`,
		vpn_cfg: vpn_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	//post_via_xhr(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};

var enet_vpn_outbound_tunnel_connect = function (backend_ip, backend_port, tunnel_spec, ipsec_cfg, on_success_callback) {

	const post_content = {
		op: `add_outbound_tunnel`,
		tunnel_spec: tunnel_spec,
		ipsec_cfg: ipsec_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};

var enet_vpn_inbound_tunnel_connect = function (backend_ip, backend_port, tunnel_spec, ipsec_cfg, on_success_callback) {
	
	const post_content = {
		op: `add_inbound_tunnel`,
		tunnel_spec: tunnel_spec,
		ipsec_cfg: ipsec_cfg
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};

var enet_vpn_inbound_fwd_add = function (backend_ip, backend_port, tunnel_spec, next_hops, lan_port, on_success_callback) {
	
	const post_content = {
		op: `add_inbound_fwd`,
		tunnel_spec: tunnel_spec,
		next_hops: next_hops,
		lan_port: lan_port
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};

var enet_vpn_outbound_tunnel_disconnect = function (backend_ip, backend_port, tunnel_spec, on_success_callback) {

	const post_content = {
		op: `del_outbound_tunnel`,
		tunnel_spec: tunnel_spec
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};

var enet_vpn_inbound_tunnel_disconnect = function (backend_ip, backend_port, tunnel_spec, on_success_callback) {
	
	const post_content = {
		op: `del_inbound_tunnel`,
		tunnel_spec: tunnel_spec
	};

	//post_via_request(post_content.op, backend_ip, backend_port, post_content);
	post_via_ajax(post_content.op, backend_ip, backend_port, post_content, on_success_callback);
};
