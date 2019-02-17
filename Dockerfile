
ARG IMG_BASE=ethernity/enet-ovs-dpdk:v2.10.1

FROM $IMG_BASE

ARG IMG_LIBRESWAN_TAG="ethernity/libreswan:v3.27"

ENV LIBRESWAN_TAG=$IMG_LIBRESWAN_TAG
ENV ENET_VPN_DIR=${SRC_DIR}/enet/vpn
ENV ENET_VPN_BACKEND_DIR=${SRC_DIR}/backend

COPY app/ ${SRC_DIR}/
ENV BASH_ENV=${SRC_DIR}/docker-entrypoint.sh

RUN exec_apt_install "$(enet_vpn_prerequisites)"
RUN exec_tgt '/' 'docker pull ethernity/libreswan'
RUN enet_vpn_config_mngr_install

#######################################
########## Backend Service ############
RUN printf '\
[Unit]\n\
Description=ENET VPN Backend Service\n\
After=network.target\n\
\n\
[Service]\n\
Type=simple\n\
User=root\n\
ExecStart=cd /usr/src/backend && npm start\n\
Restart=on-abort\n\
\n\
[Install]\n\
WantedBy=multi-user.target\n\
' > /etc/systemd/system/enet_vpn_backend.service
RUN systemctl enable enet_vpn_backend.service
#######################################

COPY runtime/ ${SRC_DIR}/runtime/
ENV BASH_ENV=${SRC_DIR}/app-entrypoint.sh

WORKDIR ${ENET_VPN_BACKEND_DIR}

#RUN cat $BASH_ENV >> /etc/profile
#ENTRYPOINT ["${SRC_DIR}/app-entrypoint.sh"]
CMD ["/bin/bash" "--init-file", "${SRC_DIR}/app-entrypoint.sh"]
#CMD ["./enet_vpn_run.sh"]
