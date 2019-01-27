#!/bin/bash

set -x

north_net="10.0.1.0"
north_ip="10.0.1.5"
north_maskbits=24
north_net_cidr="${north_net}/${north_maskbits}"
north_ip_cidr="${north_ip}/${north_maskbits}"

south_net="10.0.2.0"
south_ip="10.0.2.5"
south_maskbits=24
south_net_cidr="${south_net}/${south_maskbits}"
south_ip_cidr="${south_ip}/${south_maskbits}"

gw_mac='CC:D3:9D:D5:6E:04'

pcap_file='./multinic/n2s_plaintext.pcap'

ns_cleanup() {

	ip netns exec nsnorth pkill ping
	ip netns exec nsnorth ip link set neth0 netns 1
	ip netns del nsnorth

	ip netns exec nssouth pkill ping
	ip netns exec nssouth ip link set seth0 netns 1
	ip netns del nssouth

	ip link del neth0
	ip link del seth0

	sleep 1
}

ns_cleanup

ip link add neth0 type veth peer name seth0

ip netns add nsnorth
ip link set neth0 netns nsnorth
ip netns exec nsnorth ip link set dev neth0 down
sleep 1
ip netns exec nsnorth ip link set dev neth0 up
sleep 1
ip netns exec nsnorth ip addr add "${north_ip_cidr}" dev neth0
ip netns exec nsnorth ip route add "${south_net_cidr}" dev neth0

ip netns add nssouth
ip link set seth0 netns nssouth
ip netns exec nssouth ip link set dev seth0 down
sleep 1
ip netns exec nssouth ip link set dev seth0 address "${gw_mac}"
ip netns exec nssouth ip link set dev seth0 up
sleep 1
ip netns exec nssouth ip addr add "${south_ip_cidr}" dev seth0
ip netns exec nssouth ip route add "${north_net_cidr}" dev seth0

ip netns exec nsnorth ping "${south_ip}" &
ip netns exec nssouth tcpdump -i seth0 -c 1 -w "${pcap_file}" icmp
ip netns exec nsnorth pkill ping

ns_cleanup

set +x

