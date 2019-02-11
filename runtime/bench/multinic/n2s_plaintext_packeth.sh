#!/bin/bash


tgen_dir=$(pwd)/runtime/bench/packETH/cli

tx_if=enp65s0f1
delay_usec=10
packeth_cmd=${tgen_dir}/packETHcli
pcap_file=$(pwd)/runtime/bench/multinic/n2s_plaintext.pcap

ip link set dev ${tx_if} up
${packeth_cmd} -i ${tx_if} -m 2 -d ${delay_usec} -n 0 -f ${pcap_file}

