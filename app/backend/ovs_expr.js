
var vpn_common = require('./vpn_common.js');

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

var ovs_cmd = function (cmd, params) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;

    var expr = ``;
    expr += `/usr/local/bin/ovs-vsctl --db=unix:/usr/local/var/run/openvswitch/${vpn_inst}/db.sock ${params}`;
    return expr;
};

var host_ovs_cmd = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;

    var expr = ``;
    expr += `EXECLN="/usr/local/bin/ovs-vsctl --db=unix:/usr/local/var/run/openvswitch/${vpn_inst}/db.sock `;
    expr += ' ${@}";';
    expr += `docker exec ${vpn_inst} /bin/bash -c `;
    expr += ' "${EXECLN}"';
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

    var expr = ``;
    return expr;
};

var ovs_kernel_boot = function (cmd) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const vpn_inst = `enet${nic_id}-vpn`;
    const enet_br = `enetbr${nic_id}`;
    const enet_port = `ACENIC${nic_id}_127`;
    const ovs_etc_dir = `/usr/local/etc/openvswitch`;
    const ovs_share_dir = `/usr/local/share/openvswitch`;
    const ovs_runtime_dir = `/usr/local/var/run/openvswitch/${vpn_inst}`;

    var expr = ``;
    expr += `rm -f ${ovs_etc_dir}/conf.db\n`;
    expr += `ovsdb-tool create ${ovs_etc_dir}/conf.db ${ovs_share_dir}/vswitch.ovsschema\n`;
    expr += `${ovs_cmd(cmd, `--no-wait init`)}\n`;
    expr += `ovsdb-server --log-file -v --remote=punix:${ovs_runtime_dir}/db.sock --remote=db:Open_vSwitch,Open_vSwitch,manager_options --pidfile=${ovs_runtime_dir}/ovsdb-server.pid --detach\n`;
    expr += `${ovs_cmd(cmd, `--no-wait set Open_vSwitch . external_ids:hostname=${vpn_inst}.inst`)}\n`;
    expr += `ovs-ctl --no-ovsdb-server --db-sock="${ovs_runtime_dir}/db.sock" restart\n`;
    expr += `ovs-vswitchd --pidfile=${ovs_runtime_dir}/ovs-vswitchd.pid --log-file -v --version\n`;
    expr += `ovs-ctl status\n`;
    expr += `${ovs_cmd(cmd, `add-br ${enet_br}`)}\n`;
    expr += `${ovs_cmd(cmd, `add-port ${enet_br} ${enet_port}`)}\n`;
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

var ovs_docker_add_port = function (cmd, tunnel_port) {

    var output_processor = cmd.output_processor[cmd.key];
    const nic_id = output_processor.cfg.ace_nic_config[0].nic_name;
    const libreswan_inst = `enet${nic_id}_libreswan${tunnel_port}`;
    const vpn_cfg = output_processor.cfg.vpn_gw_config[0];
    const libreswan_dev = `e${nic_id}ls${tunnel_port}`;
    const port_macs = vpn_common.mea_port_macs(nic_id);
    const enet_br = `enetbr${nic_id}`;

    var expr = ``;
    expr += ovs_docker(cmd, `add-port ${enet_br} ${libreswan_dev} ${libreswan_inst} --ipaddress=${vpn_cfg.vpn_gw_ip}/24 --macaddress=${port_macs[tunnel_port]}`);
    expr += `LS_DEV_IFIDX=$(docker exec ${libreswan_inst} cat /sys/class/net/${libreswan_dev}/iflink)\n`;
    expr += `HOST_DEV_IFIDX=$((LS_DEV_IFIDX - 1))\n`;
    expr += `LS_PEER_IFLINK=$(grep $HOST_DEV_IFIDX /sys/class/net/*/iflink)\n`;
    expr += `LS_PEER_DEV=$(sed "s~/sys/class/net/\\(.*\\)/iflink\\:[0-9]*$~\\1~" <<< $LS_PEER_IFLINK)\n`;
    expr += ovs_cmd(cmd, `set interface $LS_PEER_DEV ofport_request=${tunnel_port}`);
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
        const ovs_etc_dir = `/usr/local/etc/openvswitch`;
        const ovs_log_dir = `/usr/local/var/log/openvswitch`;
        const ovs_share_dir = `/usr/local/share/openvswitch`;
        const ovs_runtime_dir = `/usr/local/var/run/openvswitch/${vpn_inst}`;
            
        var expr = ``;
        expr += ovs_wipeout(cmd);
        expr += `mkdir -p ${ovs_etc_dir}\n`;
        expr += `mkdir -p ${ovs_log_dir}\n`;
        expr += `mkdir -p ${ovs_share_dir}\n`;
        expr += `mkdir -p ${ovs_runtime_dir}\n`;
        expr += (dataplane_type === `dpdk`) ? ovs_dpdk_boot(cmd) : ovs_kernel_boot(cmd);
        return expr;
    };

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
};
