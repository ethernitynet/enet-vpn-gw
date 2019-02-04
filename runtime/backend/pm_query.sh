#!/bin/bash

INTER_COLLECT_INTERVAL=1.5
NO_NICS_WAIT=2

acenic_collect() {

	local ACENIC_ID=$1
	local MEA_PREFIX='meaCli mea'
	
	if [[ ${ACENIC_ID} > 0 ]]
	then
		MEA_PREFIX="meaCli -card ${ACENIC_ID} mea"
	fi
	
	local ACENIC_PMS="$(${MEA_PREFIX} counters pm blk 0; ${MEA_PREFIX} counters pm BLKshow 0)"
	if [[ $(grep 'connect failed' <<< ${ACENIC_PMS}) != '' ]]
	then
		echo 0
	else
		echo "${ACENIC_PMS}" > "/tmp/ACENIC${ACENIC_ID}_PMS.log"
		sleep "${INTER_COLLECT_INTERVAL}"
		echo 1
	fi
}

while true
do
	NICS_COUNT=0
	NICS_COUNT=$(( ${NICS_COUNT} + $(acenic_collect 0) ))
	NICS_COUNT=$(( ${NICS_COUNT} + $(acenic_collect 1) ))
	NICS_COUNT=$(( ${NICS_COUNT} + $(acenic_collect 2) ))
	if (( ${NICS_COUNT} == 0 ))
	then
		echo "No ACENICs found. Waiting for ${NO_NICS_WAIT} sec."
		sleep "${NO_NICS_WAIT}"
	else
		echo "Collected PMs for ${NICS_COUNT} ACENICs. Iterating without sleep."
	fi	
done
