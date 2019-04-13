
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

const ovs_runtime_dir = `/usr/local/var/run/openvswitch`;
const ovs_share_dir = `/usr/local/share/openvswitch`;
const ovs_etc_dir = `/usr/local/etc/openvswitch`;
const ovs_log_dir = `/usr/local/var/log/openvswitch`;
const ovs_ctl = `${ovs_share_dir}/scripts/ovs-ctl`;
const ovs_docker = `/usr/local/bin/ovs-docker`;
const ovsdb_tool = `/usr/local/bin/ovsdb-tool`;
const log_file = `--log-file=${ovs_log_dir}/ovs_log.log`;
const ovsdb_pid = `--pidfile=${ovs_runtime_dir}/ovsdb-server.pid`;
const vswitchd_pid = `--pidfile=${ovs_runtime_dir}/ovs-vswitchd.pid`;
const ovs_vswitchd = `/usr/local/sbin/ovs-vswitchd ${vswitchd_pid}`;

var db_sock_tcp_port = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;

    return `854${nic_id}`;
};

var db_sock_tcp = function (cmd, prefix) {

    return (prefix === `ptcp`) ? `ptcp:${db_sock_tcp_port(cmd)}:127.0.0.1` : `tcp:127.0.0.1:${db_sock_tcp_port(cmd)}`;
};

var of_sock_tcp_port = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;

    return `665${nic_id}`;
};

var of_sock_tcp = function (cmd, prefix) {

    return (prefix === `ptcp`) ? `ptcp:${of_sock_tcp_port(cmd)}:127.0.0.1` : `tcp:127.0.0.1:${of_sock_tcp_port(cmd)}`;
};

var ovs_ofctl = function (cmd, op) {

    return (op === undefined) ? `/usr/local/bin/ovs-ofctl -O OpenFlow13` : `/usr/local/bin/ovs-ofctl -O OpenFlow13 ${op} ${of_sock_tcp(cmd)}`;
};

var ovs_vsctl = function (cmd) {

    return `/usr/local/bin/ovs-vsctl --db=${db_sock_tcp(cmd)}`;
};

var ovsdb_server = function (cmd) {

    return `/usr/local/sbin/ovsdb-server ${ovs_etc_dir}/conf.db --remote=${db_sock_tcp(cmd, `ptcp`)} ${ovsdb_pid}`;
};

var host_ovs_cmd = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;

    var expr = ``;
    expr += `EXECLN="${ovs_vsctl(cmd)} ` + ' ${@}";';
    expr += `docker exec ${vpn_inst} /bin/bash -c ` + ' "${EXECLN}"';
    return expr;
};

var ovs_docker_cmd = function (cmd, params) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const ovs_vsctl_inst = `/tmp/${vpn_inst}/ovs-vsctl.${cmd.key.replace(/_\d+/, ``)}`;
    const ovs_docker_inst = `/tmp/${vpn_inst}/ovs-docker`;

    var expr = `\n`;
    expr += `mkdir -p /tmp/${vpn_inst}\n`;
    expr += `echo '${host_ovs_cmd(cmd)}' > ${ovs_vsctl_inst}\n`;
    expr += `docker cp ${vpn_inst}:${ovs_docker} ${ovs_docker_inst}\n`;
    expr += `chmod +x ${ovs_vsctl_inst}\n`;
    expr += `chmod +x ${ovs_docker_inst}\n`;
    expr += `cp -f ${ovs_vsctl_inst} /usr/local/bin/ovs-vsctl\n`;
    expr += `${ovs_docker_inst} ${params}\n`;
    return expr;
};

var ovs_wipeout = function (cmd) {

    var expr = ``;
    expr += `for BR_INST in $(${ovs_vsctl(cmd)} list-br); do\n`;
    expr += `    ${ovs_ofctl(cmd)} del-flows $BR_INST\n`;
    expr += `    PORTS_LIST=$(${ovs_vsctl(cmd)} list-ports $BR_INST)\n`;
    expr += `    for PORT_INST in $PORTS_LIST; do\n`;
    expr += `        PCI_ADDR=$(${ovs_vsctl(cmd)} get Interface $PORT_INST options:dpdk-devargs)\n`;
    expr += `        ${ovs_vsctl(cmd)} del-port $PORT_INST\n`;
    expr += `        if [[ $PCI_ADDR != "" ]]; then\n`;
    expr += `            echo $PCI_ADDR | xargs ovs-appctl netdev-dpdk/detach\n`;
    expr += `        fi\n`;
    expr += `    done\n`;
    expr += `done\n`;
    expr += `${ovs_vsctl(cmd)} -- --all destroy QoS -- --all destroy Queue\n`;
    expr += `for BR_INST in $(${ovs_vsctl(cmd)} list-br); do\n`;
    expr += `    ${ovs_vsctl(cmd)} --no-wait del-br $BR_INST\n`;
    expr += `    ip link delete $BR_INST\n`;
    expr += `done\n`;
    expr += `${ovs_ctl} stop\n`;
    return expr;
};

var ovs_dpdk_boot = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const enet_br = `enetbr${nic_id}`;
    const enet_port = (nic_id === `0`) ? `ACENIC1_127` : `ACENIC2_127`;
    const enet_pci = output_processor.cfg.ace_nic_config[0].nic_pci;
    const dpdk_2mb_hugepages = parseInt(output_processor.cfg.dpdk_config[0].no_2mb_hugepages);
    const dpdk_2mb_hugepages_socket0 = (dpdk_2mb_hugepages);
    const dpdk_2mb_hugepages_socket1 = (dpdk_2mb_hugepages - dpdk_2mb_hugepages_socket0);
    const dpdk_1g_hugepages = parseInt(output_processor.cfg.dpdk_config[0].no_1g_hugepages);
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;

    var expr = ``;
    expr += `${ovs_ctl} stop\n`;
    expr += `pkill ovsdb-server\n`;
    expr += `pkill ovs-vswitchd\n`;
    expr += `rm -rf ${ovs_runtime_dir}/*\n`;
    expr += `rm -rf ${ovs_etc_dir}/*\n`;
    expr += `mkdir -p ${ovs_runtime_dir}/${vpn_inst}\n`;
    expr += `${ovsdb_tool} create ${ovs_etc_dir}/conf.db ${ovs_share_dir}/vswitch.ovsschema\n`;
    expr += `${ovsdb_server(cmd)} ${log_file} -v --remote=db:Open_vSwitch,Open_vSwitch,manager_options --detach\n`;
    expr += `${ovs_vsctl(cmd)} --no-wait init\n`;
    expr += `${ovs_vsctl(cmd)} --no-wait set Open_vSwitch . external_ids:hostname=${vpn_inst}.inst\n`;
    ///////////////////////
    expr += `${ovs_vsctl(cmd)} --no-wait set Open_vSwitch . other_config:dpdk-init=true\n`;
    expr += `mkdir -p /mnt/huge\n`;
    expr += `umount /mnt/huge\n`;
    expr += `mount -t hugetlbfs nodev /mnt/huge\n`;
    expr += `echo ${dpdk_2mb_hugepages} > /sys/devices/system/node/node0/hugepages/hugepages-2048kB/nr_hugepages\n`;
    expr += `echo ${dpdk_1g_hugepages} > /sys/devices/system/node/node0/hugepages/hugepages-1048576kB/nr_hugepages\n`;
    expr += `${ovs_vsctl(cmd)} --no-wait set Open_vSwitch . other_config:dpdk-socket-mem="${dpdk_2mb_hugepages_socket0},${dpdk_2mb_hugepages_socket1}"\n`;
    expr += `(>&2 grep HugePages_ /proc/meminfo)\n`;
    ///////////////////////
    //expr += `${ovs_ctl} --no-ovsdb-server start\n`;
    expr += `${ovs_vswitchd} ${log_file} -v --detach ${db_sock_tcp(cmd)}\n`;
    expr += `(>&2 ${ovs_vswitchd} -v --version)\n`;
    ///////////////////////
    expr += `(>&2 grep HugePages_ /proc/meminfo)\n`;
    //expr += `(>&2 echo 'DPDK Initialized:')\n`;
    expr += `(>&2 ${ovs_vsctl(cmd)} get Open_vSwitch . dpdk_initialized)\n`;
    expr += `(>&2 ${ovs_vsctl(cmd)} get Open_vSwitch . dpdk_version)\n`;
    ///////////////////////
    expr += `sleep 1\n`;
    expr += `(>&2 ${ovs_ctl} status)\n`;
    expr += `${ovs_vsctl(cmd)} add-br ${enet_br} -- set-controller ${enet_br} ${of_sock_tcp(cmd, `ptcp`)} -- set bridge ${enet_br} datapath_type=netdev\n`;
    expr += `${ovs_vsctl(cmd)} add-port ${enet_br} ${enet_port} -- set Interface ${enet_port} type=dpdk options:dpdk-devargs=${enet_pci}\n`;
    expr += `${ovs_vsctl(cmd)} set interface ${enet_port} ofport_request=${ovs_host_pid}\n`;
    return expr;
};

var ovs_kernel_boot = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const enet_br = `enetbr${nic_id}`;
    const enet_port = (nic_id === `0`) ? `ACENIC1_127` : `ACENIC2_127`;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;

    var expr = ``;
    expr += `${ovs_ctl} stop\n`;
    expr += `pkill ovsdb-server\n`;
    expr += `pkill ovs-vswitchd\n`;
    expr += `rm -rf ${ovs_runtime_dir}/*\n`;
    expr += `rm -rf ${ovs_etc_dir}/*\n`;
    expr += `mkdir -p ${ovs_runtime_dir}/${vpn_inst}\n`;
    expr += `${ovsdb_tool} create ${ovs_etc_dir}/conf.db ${ovs_share_dir}/vswitch.ovsschema\n`;
    expr += `${ovsdb_server(cmd)} ${log_file} -v --remote=db:Open_vSwitch,Open_vSwitch,manager_options --detach\n`;
    expr += `${ovs_vsctl(cmd)} --no-wait init\n`;
    expr += `${ovs_vsctl(cmd)} --no-wait set Open_vSwitch . external_ids:hostname=${vpn_inst}.inst\n`;
    ///////////////////////
    //expr += `${ovs_ctl} --no-ovsdb-server start\n`;
    expr += `${ovs_vswitchd} ${log_file} -v --detach ${db_sock_tcp(cmd)}\n`;
    expr += `(>&2 ${ovs_vswitchd} -v --version)\n`;
    ///////////////////////
    expr += `sleep 1\n`;
    expr += `(>&2 ${ovs_ctl} status)\n`;
    expr += `${ovs_vsctl(cmd)} add-br ${enet_br} -- set-controller ${enet_br} ${of_sock_tcp(cmd, `ptcp`)}\n`;
    expr += `${ovs_vsctl(cmd)} add-port ${enet_br} ${enet_port}\n`;
    expr += `${ovs_vsctl(cmd)} set interface ${enet_port} ofport_request=${ovs_host_pid}\n`;
    return expr;
};

var ovs_docker_add_port = function (cmd, enet_phy_pid) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const libreswan_inst = `enet${nic_id}_libreswan${enet_phy_pid}`;
    const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
    const libreswan_dev = `e${nic_id}ls${enet_phy_pid}`;
    const port_macs = vpn_common.mea_port_macs(nic_id);
    const enet_br = `enetbr${nic_id}`;
    const ovs_phy_pid = (nic_id === `0`) ? enet_phy_pid : (enet_phy_pid + 100);

    var expr = ``;
    expr += ovs_docker_cmd(cmd, `add-port ${enet_br} ${libreswan_dev} ${libreswan_inst} --ipaddress=${vpn_cfg.vpn_gw_ip}/8 --macaddress=${port_macs[enet_phy_pid]}`);
    expr += `LS_DEV_IFIDX=$(docker exec ${libreswan_inst} cat /sys/class/net/${libreswan_dev}/iflink)\n`;
    expr += `HOST_DEV_IFIDX=$((LS_DEV_IFIDX - 1))\n`;
    expr += `LS_PEER_IFLINK=$(grep $HOST_DEV_IFIDX /sys/class/net/*/iflink)\n`;
    expr += `LS_PEER_DEV=$(sed "s~/sys/class/net/\\(.*\\)/iflink\\:[0-9]*$~\\1~" <<< $LS_PEER_IFLINK)\n`;
    expr += `${ovs_vsctl(cmd)} set interface $LS_PEER_DEV ofport_request=${ovs_phy_pid}\n`;
    return expr;
};

var port_add_of_ctl_passthrough = function (cmd, enet_phy_pid) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;
    const ovs_phy_pid = (nic_id === `0`) ? enet_phy_pid : (enet_phy_pid + 100);
    const ovs_phy_vlan = (nic_id === `0`) ? enet_phy_pid : (enet_phy_pid + 100);

    var expr = ``;
    expr += `${ovs_ofctl(cmd, `add-flow`)} "in_port=${ovs_phy_pid},actions=push_vlan:0x8100,mod_vlan_vid=${ovs_phy_vlan},output:${ovs_host_pid}"\n`;
    expr += `${ovs_ofctl(cmd, `add-flow`)} "in_port=${ovs_host_pid},dl_vlan=${ovs_phy_vlan},actions=strip_vlan,output:${ovs_phy_pid}"\n`;
    return expr;
};

var port_add_of_ctl_passthrough_opposite = function (cmd, enet_phy_pid) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;
    const ovs_phy_pid = (nic_id === `0`) ? enet_phy_pid : (enet_phy_pid + 100);
    const ovs_phy_vlan = (nic_id === `1`) ? enet_phy_pid : (enet_phy_pid + 100);

    var expr = ``;
    expr += `${ovs_ofctl(cmd, `add-flow`)} "in_port=${ovs_phy_pid},actions=push_vlan:0x8100,mod_vlan_vid=${ovs_phy_vlan},output:${ovs_host_pid}"\n`;
    expr += `${ovs_ofctl(cmd, `add-flow`)} "in_port=${ovs_host_pid},dl_vlan=${ovs_phy_vlan},actions=strip_vlan,output:${ovs_phy_pid}"\n`;
    return expr;
};

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

module.exports = function () {

	/////////////////////////////////////////////////
	/////////////[ovs_docker_add_ports]//////////////
	
    this.ovs_docker_add_ports = function (cmd) {

        var expr = ``;
        expr += `set -x\n`;
        expr += ovs_docker_add_port(cmd, 104);
        expr += ovs_docker_add_port(cmd, 105);
        expr += ovs_docker_add_port(cmd, 106);
        expr += ovs_docker_add_port(cmd, 107);
        expr += `set +x\n`;
        return expr;
    };
	
    this.boot_ovs = function (cmd) {

        var output_processor = cmd.output_processor[cmd.key];
        const dataplane_type = output_processor.cfg.ace_nic_config[0].dataplane;
            
        var expr = ``;
        expr += `set -x\n`;
        expr += ovs_wipeout(cmd);
        expr += `mkdir -p ${ovs_etc_dir}\n`;
        expr += `mkdir -p ${ovs_log_dir}\n`;
        expr += `mkdir -p ${ovs_share_dir}\n`;
        expr += `mkdir -p ${ovs_runtime_dir}\n`;
        expr += (dataplane_type === `dpdk`) ? ovs_dpdk_boot(cmd) : ovs_kernel_boot(cmd);
        expr += `set +x\n`;
        return expr;
    };
	
    this.add_of_ctl_passthrough = function (cmd) {

        var expr = ``;
        expr += `set -x\n`;
        expr += port_add_of_ctl_passthrough(cmd, 104);
        expr += port_add_of_ctl_passthrough(cmd, 105);
        expr += port_add_of_ctl_passthrough(cmd, 106);
        expr += port_add_of_ctl_passthrough(cmd, 107);
        ////
        expr += port_add_of_ctl_passthrough_opposite(cmd, 104);
        expr += port_add_of_ctl_passthrough_opposite(cmd, 105);
        expr += port_add_of_ctl_passthrough_opposite(cmd, 106);
        expr += port_add_of_ctl_passthrough_opposite(cmd, 107);
        ////
        expr += `set +x\n`;
        return expr;
    };

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
