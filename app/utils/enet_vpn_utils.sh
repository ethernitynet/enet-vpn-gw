#!/bin/bash

enet_vpn_config_mngr_install() {
	
	ln -sf ${SRC_DIR}/schema/asf/bower_components/angular-schema-form/dist ${SRC_DIR}/schema/asf/dist
	ln -sf ${SRC_DIR}/schema/asf/bower_components/angular-schema-form-bootstrap/examples/data ${SRC_DIR}/schema/asf/ng/data
	ln -sf ${SRC_DIR}/runtime/bench ${SRC_DIR}/schema/asf/ng/model/bench
	cd ${SRC_DIR}/config
	npm install
	cd -
	cd ${SRC_DIR}/runtime/backend
	npm install
	cd -
}

enet_vpn_prerequisites() {

	echo 'nodejs npm jq wget bc'
}
