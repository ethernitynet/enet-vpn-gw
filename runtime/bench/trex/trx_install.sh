#!/bin/bash

source $(pwd)/runtime/bench/trex/trx_common.sh

useradd ${trx_user}
passwd ${trx_user}
usermod -aG wheel ${trx_user}

mkdir -p ${trx_home}
pushd ${trx_home}
	rm -rf ./latest
	wget --no-cache ${TREX_WEB_URL}/release/latest
	tar -xzvf ./latest
	pushd ${trx_root}
		pushd ./ko/src
			if [[ $(lsmod | grep -c "^uio") == 0 ]]
			then
				echo 'Installing uio:'
				modprobe uio
			fi
			make
			make install
			if [[ $(lsmod | grep -c "^igb_uio") == 0 ]]
			then
				echo 'Installing igb_uio:'
				insmod ../$(uname -r)/igb_uio.ko
			fi
		popd
		./dpdk_nic_bind.py --table
	popd
popd

ln -s ${trx_py_dir} ${trx_root}/stl/py
