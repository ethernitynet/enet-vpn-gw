#!/bin/bash

	meaCli -card 1 mea port ingress set all -a 1 -c 0
	meaCli -card 1 mea port egress set all -a 1 -c 1
	meaCli -card 1 mea IPSec global set ttl 40
	meaCli -card 1 mea forwarder delete all
	meaCli -card 1 mea action set delete all
	meaCli -card 1 mea service set delete all
	meaCli -card 1 mea IPSec ESP set delete all

rm -f enet1-vpn_conns_config.json enet1-vpn_ports_config.json

