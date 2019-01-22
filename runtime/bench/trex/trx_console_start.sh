#!/bin/bash

source $(pwd)/runtime/bench/trex/trx_common.sh

pushd ${trx_root}
	./dpdk_nic_bind.py -s
	sleep 1
	./trex-console
popd

