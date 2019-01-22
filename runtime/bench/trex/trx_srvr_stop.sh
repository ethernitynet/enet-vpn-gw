#!/bin/bash

source $(pwd)/runtime/bench/trex/trx_common.sh

pushd ${trx_root}
	echo "Waiting for T-Rex server to stop:"
	pkill t-rex-64
	./dpdk_nic_bind.py -b i40e ${p105_north_pci}
	./dpdk_nic_bind.py -b i40e ${p105_south_pci}
	./dpdk_nic_bind.py -b i40e ${p106_north_pci}
	./dpdk_nic_bind.py -b i40e ${p106_south_pci}
	ifconfig ${p105_north_if} up
	ifconfig ${p105_south_if} up
	ifconfig ${p106_north_if} up
	ifconfig ${p106_south_if} up
	./dpdk_nic_bind.py --table
popd

