#!/bin/bash

	meaCli mea port ingress set all -a 1 -c 0
	meaCli mea port egress set all -a 1 -c 1
	meaCli mea IPSec global set ttl 40
	meaCli mea forwarder delete all
	meaCli mea action set delete all
	meaCli mea service set delete all
	meaCli mea IPSec ESP set delete all

rm -f enet0-vpn_conns_config.json enet0-vpn_ports_config.json

