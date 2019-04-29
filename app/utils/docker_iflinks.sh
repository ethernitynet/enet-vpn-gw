#!/bin/bash

echo "$(for f in $(ls /sys/class/net/*/iflink); do echo "$(cat $f) $f"; done; for c in $(docker ps -a --format {{.Names}}); do EXEC_CMD=$(printf 'for f in $(ls /sys/class/net/*/iflink); do echo "$(cat $f) %s:$f"; done' $c) && docker exec -ti $c /bin/bash -c "$EXEC_CMD"; done)" | sort -n
