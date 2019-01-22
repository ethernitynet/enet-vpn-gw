#!/bin/bash

source $(pwd)/runtime/bench/trex/trx_common.sh

pushd ${trx_root}
	./dpdk_nic_bind.py --table
	./dpdk_nic_bind.py -u ${p105_north_pci}
	./dpdk_nic_bind.py -u ${p105_south_pci}
	echo "Waiting for T-Rex server to start:"
	./t-rex-64 -i --no-scapy-server --cfg ${srvr_cfg_file} &
	for i in $(seq 10)
	do
		echo "TRex"
		sleep 1
	done
	./dpdk_nic_bind.py -b i40e ${p105_north_pci}
	./dpdk_nic_bind.py -b i40e ${p105_south_pci}
	ifconfig ${p105_north_if} up
	ifconfig ${p105_south_if} up
popd

