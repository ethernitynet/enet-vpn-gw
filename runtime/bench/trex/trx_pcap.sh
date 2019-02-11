#!/bin/bash

if false
then
PCAP_FILE=/root/ETHERNITY/GITHUB/enet-vpn-gw/runtime/bench/multinic/n2s_conn0_800.pcap
TX_PORT=1
else
PCAP_FILE=/root/ETHERNITY/GITHUB/enet-vpn-gw/runtime/bench/multinic/s2n_conn0_800.pcap
TX_PORT=2
fi
PY_EXE=/home/trx/v2.51/automation/trex_control_plane/interactive/trex/examples/stl/stl_pcap.py
INTERVAL_USEC=3

python ${PY_EXE} -f ${PCAP_FILE} -p ${TX_PORT} -n 0 -i ${INTERVAL_USEC}

