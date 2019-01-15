#!/bin/bash

enet_vpn_config_mngr_install() {

	cd ${SRC_DIR}/config
	apt-get -y install nodejs npm jq
	npm install
	cd -
	cd ${SRC_DIR}/schema
	apt-get -y install wget
	wget "https://cdn.jsdelivr.net/npm/@json-editor/json-editor/dist/jsoneditor.min.js"
	wget "https://cdn.jsdelivr.net/npm/@json-editor/json-editor/dist/jsoneditor.min.js.map"
	cd -
}

enet_vpn_prerequisites() {

	echo 'bc'
}
