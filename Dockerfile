
ARG IMG_BASE=ethernitynet/enet-ovs-dpdk:v2.10.1

FROM $IMG_BASE

ENV ENET_VPN_DIR=${SRC_DIR}/enet/vpn

COPY app/ ${SRC_DIR}/
ENV BASH_ENV=${SRC_DIR}/docker-entrypoint.sh

RUN exec_apt_install "$(enet_vpn_prerequisites)"
RUN exec_tgt '/' 'docker pull ethernity/libreswan'
RUN enet_vpn_config_mngr_install

COPY runtime/ ${SRC_DIR}/runtime/
ENV BASH_ENV=${SRC_DIR}/app-entrypoint.sh

WORKDIR ${ENET_VPN_DIR}

#RUN cat $BASH_ENV >> /etc/profile
#ENTRYPOINT ["${SRC_DIR}/app-entrypoint.sh"]
CMD ["/bin/bash" "--init-file", "${SRC_DIR}/app-entrypoint.sh"]
#CMD ["./enet_vpn_run.sh"]
