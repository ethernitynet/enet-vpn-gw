
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

const specialized_env = false;

var ovs_cmd = function (cmd, params) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const db_sock = (specialized_env === true) ? `--db=unix:/usr/local/var/run/openvswitch/${vpn_inst}/db.sock` : ``;

    var expr = ``;
    expr += `/usr/local/bin/ovs-vsctl ${db_sock} ${params}`;
    return expr;
};

var host_ovs_cmd = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const db_sock = (specialized_env === true) ? `--db=unix:/usr/local/var/run/openvswitch/${vpn_inst}/db.sock` : ``;

    var expr = ``;
    expr += `EXECLN="/usr/local/bin/ovs-vsctl ${db_sock} `;
    expr += ' ${@}";';
    expr += `docker exec ${vpn_inst} /bin/bash -c `;
    expr += ' "${EXECLN}"';
    return expr;
};

var ovs_docker = function (cmd, params) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const ovs_vsctl_inst = `/tmp/${vpn_inst}/ovs-vsctl.${cmd.key.replace(/_\d+/, ``)}`;
    const ovs_docker_inst = `/tmp/${vpn_inst}/ovs-docker`;

    var expr = `\n`;
    expr += `mkdir -p /tmp/${vpn_inst}\n`;
    expr += `echo '${host_ovs_cmd(cmd)}' > ${ovs_vsctl_inst}\n`;
    expr += `docker cp ${vpn_inst}:/usr/local/bin/ovs-docker ${ovs_docker_inst}\n`;
    expr += `chmod +x ${ovs_vsctl_inst}\n`;
    expr += `chmod +x ${ovs_docker_inst}\n`;
    expr += `cp -f ${ovs_vsctl_inst} /usr/local/bin/ovs-vsctl\n`;
    expr += `${ovs_docker_inst} ${params}\n`;
    return expr;
};

var ovs_wipeout = function (cmd) {

    var expr = ``;
    expr += `for BR_INST in $(${ovs_cmd(cmd, `list-br`)}); do\n`;
    expr += `    ovs-ofctl del-flows $BR_INST\n`;
    expr += `    PORTS_LIST=$(${ovs_cmd(cmd, `list-ports $BR_INST`)})\n`;
    expr += `    for PORT_INST in $PORTS_LIST; do\n`;
    expr += `        PCI_ADDR=$(${ovs_cmd(cmd, `get Interface $PORT_INST options:dpdk-devargs`)})\n`;
    expr += `        ${ovs_cmd(cmd, `del-port $PORT_INST`)}\n`;
    expr += `        if [[ $PCI_ADDR != "" ]]; then\n`;
    expr += `            echo $PCI_ADDR | xargs ovs-appctl netdev-dpdk/detach\n`;
    expr += `        fi\n`;
    expr += `    done\n`;
    expr += `done\n`;
    expr += `${ovs_cmd(cmd, ` -- --all destroy QoS -- --all destroy Queue`)}\n`;
    expr += `for BR_INST in $(${ovs_cmd(cmd, `list-br`)}); do\n`;
    expr += `    ${ovs_cmd(cmd, `del-br $BR_INST`)}\n`;
    expr += `    ip link delete $BR_INST\n`;
    expr += `done\n`;
    expr += `ovs-ctl stop\n`;
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
    const dpdk_1g_hugepages = parseInt(output_processor.cfg.dpdk_config[0].no_1g_hugepages);
    const ovs_etc_dir = (specialized_env === true) ? `/usr/local/etc/openvswitch/${vpn_inst}` : `/usr/local/etc/openvswitch`;
    const ovs_share_dir = `/usr/local/share/openvswitch`;
    const ovs_runtime_dir = (specialized_env === true) ? `/usr/local/var/run/openvswitch/${vpn_inst}` : `/usr/local/var/run/openvswitch`;
    const db_sock = (specialized_env === true) ? `--db-sock="${ovs_runtime_dir}/db.sock"` : ``;
    const ovsdb_pid = (specialized_env === true) ? `--pidfile=${ovs_runtime_dir}/ovsdb-server.pid` : ``;
    const vswitchd_pid = (specialized_env === true) ? `--pidfile=${ovs_runtime_dir}/ovs-vswitchd.pid` : ``;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;

    var expr = ``;
    expr += `pkill ovsdb-server\n`;
    expr += `ovs-ctl stop\n`;
    expr += `rm -rf ${ovs_runtime_dir}/*\n`;
    expr += `rm -f ${ovs_etc_dir}/conf.db\n`;
    expr += `ovsdb-tool create ${ovs_etc_dir}/conf.db ${ovs_share_dir}/vswitch.ovsschema\n`;
    expr += `ovsdb-server --log-file -v --remote=punix:${ovs_runtime_dir}/db.sock --remote=db:Open_vSwitch,Open_vSwitch,manager_options ${ovsdb_pid} --detach\n`;
    expr += `sleep 2\n`;
    expr += `${ovs_cmd(cmd, `--no-wait init`)}\n`;
    expr += `${ovs_cmd(cmd, `--no-wait set Open_vSwitch . external_ids:hostname=${vpn_inst}.inst`)}\n`;
    expr += `${ovs_cmd(cmd, `--no-wait set Open_vSwitch . other_config:dpdk-init=true`)}\n`;
    expr += `mkdir -p /mnt/huge\n`;
    expr += `umount /mnt/huge\n`;
    expr += `mount -t hugetlbfs nodev /mnt/huge\n`;
    expr += `echo ${dpdk_2mb_hugepages} > /sys/devices/system/node/node0/hugepages/hugepages-2048kB/nr_hugepages\n`;
    expr += `echo ${dpdk_1g_hugepages} > /sys/devices/system/node/node0/hugepages/hugepages-1048576kB/nr_hugepages\n`;
    expr += `${ovs_cmd(cmd, `--no-wait set Open_vSwitch . other_config:dpdk-socket-mem="${dpdk_2mb_hugepages / 2},${dpdk_2mb_hugepages / 2}"`)}\n`;
    expr += `grep HugePages_ /proc/meminfo\n`;
    expr += `ovs-ctl --no-ovsdb-server ${db_sock} restart\n`;
    expr += `grep HugePages_ /proc/meminfo\n`;
    expr += `echo 'DPDK Initialized:'\n`;
    expr += `${ovs_cmd(cmd, `get Open_vSwitch . dpdk_initialized`)}\n`;
    expr += `ovs-vswitchd ${vswitchd_pid} --log-file -v --version\n`;
    expr += `${ovs_cmd(cmd, `get Open_vSwitch . dpdk_version`)}\n`;
    expr += `ovs-ctl status\n`;
    expr += `${ovs_cmd(cmd, `add-br ${enet_br} -- set bridge ${enet_br} datapath_type=netdev`)}\n`;
    expr += `${ovs_cmd(cmd, `add-port ${enet_br} ${enet_port} -- set Interface ${enet_port} type=dpdk options:dpdk-devargs=${enet_pci}`)}\n`;
    expr += `${ovs_cmd(cmd, `set interface ${enet_port} ofport_request=${ovs_host_pid}`)}\n`;
    return expr;
};

var ovs_kernel_boot = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const enet_br = `enetbr${nic_id}`;
    const enet_port = (nic_id === `0`) ? `ACENIC1_127` : `ACENIC2_127`;
    const ovs_etc_dir = (specialized_env === true) ? `/usr/local/etc/openvswitch/${vpn_inst}` : `/usr/local/etc/openvswitch`;
    const ovs_share_dir = `/usr/local/share/openvswitch`;
    const ovs_runtime_dir = (specialized_env === true) ? `/usr/local/var/run/openvswitch/${vpn_inst}` : `/usr/local/var/run/openvswitch`;
    const db_sock = (specialized_env === true) ? `--db-sock="${ovs_runtime_dir}/db.sock"` : ``;
    const ovsdb_pid = (specialized_env === true) ? `--pidfile=${ovs_runtime_dir}/ovsdb-server.pid` : ``;
    const vswitchd_pid = (specialized_env === true) ? `--pidfile=${ovs_runtime_dir}/ovs-vswitchd.pid` : ``;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;

    var expr = ``;
    expr += `pkill ovsdb-server\n`;
    expr += `ovs-ctl stop\n`;
    expr += `rm -rf ${ovs_runtime_dir}/*\n`;
    expr += `rm -f ${ovs_etc_dir}/conf.db\n`;
    expr += `ovsdb-tool create ${ovs_etc_dir}/conf.db ${ovs_share_dir}/vswitch.ovsschema\n`;
    expr += `ovsdb-server --log-file -v --remote=punix:${ovs_runtime_dir}/db.sock --remote=db:Open_vSwitch,Open_vSwitch,manager_options ${ovsdb_pid} --detach\n`;
    expr += `sleep 2\n`;
    expr += `${ovs_cmd(cmd, `--no-wait init`)}\n`;
    expr += `${ovs_cmd(cmd, `--no-wait set Open_vSwitch . external_ids:hostname=${vpn_inst}.inst`)}\n`;
    expr += `ovs-ctl --no-ovsdb-server ${db_sock} restart\n`;
    expr += `ovs-vswitchd ${vswitchd_pid} --log-file -v --version\n`;
    expr += `ovs-ctl status\n`;
    expr += `${ovs_cmd(cmd, `add-br ${enet_br}`)}\n`;
    expr += `${ovs_cmd(cmd, `add-port ${enet_br} ${enet_port}`)}\n`;
    expr += `${ovs_cmd(cmd, `set interface ${enet_port} ofport_request=${ovs_host_pid}`)}\n`;
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
    expr += ovs_docker(cmd, `add-port ${enet_br} ${libreswan_dev} ${libreswan_inst} --ipaddress=${vpn_cfg.vpn_gw_ip}/8 --macaddress=${port_macs[enet_phy_pid]}`);
    expr += `LS_DEV_IFIDX=$(docker exec ${libreswan_inst} cat /sys/class/net/${libreswan_dev}/iflink)\n`;
    expr += `HOST_DEV_IFIDX=$((LS_DEV_IFIDX - 1))\n`;
    expr += `LS_PEER_IFLINK=$(grep $HOST_DEV_IFIDX /sys/class/net/*/iflink)\n`;
    expr += `LS_PEER_DEV=$(sed "s~/sys/class/net/\\(.*\\)/iflink\\:[0-9]*$~\\1~" <<< $LS_PEER_IFLINK)\n`;
    expr += `${ovs_cmd(cmd, `set interface $LS_PEER_DEV ofport_request=${ovs_phy_pid}`)}\n`;
    return expr;
};

var port_add_of_ctl_passthrough = function (cmd, enet_phy_pid) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const enet_br = `enetbr${nic_id}`;
    var ovs_host_pid = (nic_id === `0`) ? 127 : 227;
    const ovs_phy_pid = (nic_id === `0`) ? enet_phy_pid : (enet_phy_pid + 100);

    var expr = ``;
    expr += `ovs-ofctl -O OpenFlow13 add-flow ${enet_br} "in_port=${ovs_phy_pid},actions=push_vlan:0x8100,mod_vlan_vid=${ovs_phy_pid},output:${ovs_host_pid}"\n`;
    expr += `ovs-ofctl -O OpenFlow13 add-flow ${enet_br} "in_port=${ovs_host_pid},dl_vlan=${ovs_phy_pid},actions=strip_vlan,output:${ovs_phy_pid}"\n`;
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
        expr += ovs_docker_add_port(cmd, 104);
        expr += ovs_docker_add_port(cmd, 105);
        expr += ovs_docker_add_port(cmd, 106);
        expr += ovs_docker_add_port(cmd, 107);
        return expr;
    };
	
    this.boot_ovs = function (cmd) {

        var output_processor = cmd.output_processor[cmd.key];
        const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
        const vpn_inst = `enet${nic_id}-vpn`;
        const dataplane_type = output_processor.cfg.ace_nic_config[0].dataplane;

        const ovs_etc_dir = (specialized_env === true) ? `/usr/local/etc/openvswitch/${vpn_inst}` : `/usr/local/etc/openvswitch`;
        const ovs_log_dir = (specialized_env === true) ? `/usr/local/var/log/openvswitch/${vpn_inst}` : `/usr/local/var/log/openvswitch`;
        const ovs_share_dir = `/usr/local/share/openvswitch`;
        const ovs_runtime_dir = (specialized_env === true) ? `/usr/local/var/run/openvswitch/${vpn_inst}` : `/usr/local/var/run/openvswitch`;
            
        var expr = ``;
        expr += ovs_wipeout(cmd);
        expr += `mkdir -p ${ovs_etc_dir}\n`;
        expr += `mkdir -p ${ovs_log_dir}\n`;
        expr += `mkdir -p ${ovs_share_dir}\n`;
        expr += `mkdir -p ${ovs_runtime_dir}\n`;
        expr += (dataplane_type === `dpdk`) ? ovs_dpdk_boot(cmd) : ovs_kernel_boot(cmd);
        return expr;
    };
	
    this.add_of_ctl_passthrough = function (cmd) {

        var expr = ``;
        expr += port_add_of_ctl_passthrough(cmd, 104);
        expr += port_add_of_ctl_passthrough(cmd, 105);
        expr += port_add_of_ctl_passthrough(cmd, 106);
        expr += port_add_of_ctl_passthrough(cmd, 107);
        return expr;
    };

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
