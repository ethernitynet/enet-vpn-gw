#!/bin/bash

TREX_WEB_URL="http://trex-tgn.cisco.com/trex"

cfg_dir=$(pwd)/runtime/bench/trex
trx_user="trx"
trx_home=/home/${trx_user}
trx_root=${trx_home}/v2.51
srvr_cfg_file="${cfg_dir}/srvr_cfg.yaml"
trx_py_dir="${cfg_dir}/py"

p105_north_if=enp65s0f0
p105_south_if=enp65s0f1
p105_north_pci=0000:41:00.0
p105_south_pci=0000:41:00.1

p106_north_if=enp65s0f2
p106_south_if=enp65s0f3
p106_north_pci=0000:41:00.2
p106_south_pci=0000:41:00.3
