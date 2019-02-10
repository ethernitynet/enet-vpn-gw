#!/bin/bash

PY_EXE=/home/trx/v2.51/automation/trex_control_plane/interactive/trex/examples/stl/stl_pcap.py
PCAP_FILE=/root/ETHERNITY/GITHUB/enet-vpn-gw/runtime/bench/multinic/n2s_plaintext_512.pcap
TX_PORT=1
INTERVAL_USEC=1.45

python ${PY_EXE} -f ${PCAP_FILE} -p ${TX_PORT} -n 0 -i ${INTERVAL_USEC}

