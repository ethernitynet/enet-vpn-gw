#!/bin/bash


tgen_dir=$(pwd)/packETH/cli

tx_if=enp65s0f1
delay_usec=100
packeth_cmd=${tgen_dir}/packETHcli
pcap_file=$(pwd)/multinic/n2s_ctl.pcap

${packeth_cmd} -i ${tx_if} -m 2 -d ${delay_usec} -n 0 -f ${pcap_file}

