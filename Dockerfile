
ARG IMG_BASE=ethernitynet/enet-ovs-dpdk:v2.10.1

FROM $IMG_BASE

COPY app/ ${SRC_DIR}/
ENV BASH_ENV=${SRC_DIR}/docker-entrypoint.sh

RUN exec_tgt '/' 'docker pull ethernity/libreswan'
RUN enet_build

COPY runtime/ ${SRC_DIR}/runtime/
ENV BASH_ENV=${SRC_DIR}/app-entrypoint.sh

WORKDIR ${SRC_DIR}

#RUN cat $BASH_ENV >> /etc/profile
#ENTRYPOINT ["${SRC_DIR}/app-entrypoint.sh"]
CMD ["/bin/bash" "--init-file", "${SRC_DIR}/docker-entrypoint.sh"]
#CMD ["./ovs_run.sh"]
