#!/bin/bash

source $(pwd)/runtime/bench/trex/trx_common.sh

pushd ${trx_root}
	echo "Hugepages:"
	echo "  $(grep HugePages_ /proc/meminfo)"
	echo "=========="
	echo "DPDK binds:"
	echo "  $(./dpdk_nic_bind.py -s)"
	echo "=========="
	trx_procs=$(pgrep -a rex)
	echo "Running processes:"
	echo "  ${trx_procs}"
	echo "=========="
popd

