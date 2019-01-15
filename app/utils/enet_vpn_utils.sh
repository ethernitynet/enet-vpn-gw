#!/bin/bash

enet_vpn_config_mngr_install() {

	npm install -g npm@latest
	#npm install -g bower
	
	bower --allow-root install angular-schema-form angular-schema-form-bootstrap
	bower --allow-root install angular-schema-form angular-schema-form-bootstrap
	cd ./bower_components/angular-schema-form
	bower --allow-root install
	cd -
	cd ./bower_components/angular-schema-form-bootstrap
	bower --allow-root install
	cd -
	cd bower_components/angular-schema-form-bootstrap/bower_components/bootstrap/dist/css
	wget https://cdnjs.cloudflare.com/ajax/libs/todc-bootstrap/3.4.0-3.4.1/css/bootstrap-theme.min.css
	wget https://cdnjs.cloudflare.com/ajax/libs/todc-bootstrap/3.4.0-3.4.1/css/bootstrap-theme.min.css.map
	cd -
	
	cd ${SRC_DIR}/config
	npm install
	cd -
	#cd ${SRC_DIR}/schema
	#wget "https://cdn.jsdelivr.net/npm/@json-editor/json-editor/dist/jsoneditor.min.js"
	#wget "https://cdn.jsdelivr.net/npm/@json-editor/json-editor/dist/jsoneditor.min.js.map"
	#cd -
}

enet_vpn_prerequisites() {

	echo 'nodejs npm jq wget bc'
}
