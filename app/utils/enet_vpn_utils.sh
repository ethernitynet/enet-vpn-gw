#!/bin/bash

enet_vpn_config_ui_install() {

	cd ${SRC_DIR}/schema
	apt-get -y install wget
	wget "https://cdn.jsdelivr.net/npm/@json-editor/json-editor/dist/jsoneditor.min.js"
	cd -
}
