#!/bin/bash
# bd wrapper — connects to the host's dolt server from inside Docker.
#
# Docker's VirtioFS doesn't support the file-locking primitives dolt needs,
# so instead of running a local dolt server, we forward the dolt port to
# the host's already-running dolt server via socat + host.docker.internal.
#
# The claude-agent shell helper passes BD_DOLT_HOST and BD_DOLT_PORT as
# env vars. This wrapper starts a socat forwarder on 127.0.0.1:<port>
# so bd connects to localhost and socat relays to the host.

REAL_BD="/usr/local/bin/bd-real"

# If no host dolt info, just run bd normally (might work, might not)
if [ -z "$BD_DOLT_HOST" ] || [ -z "$BD_DOLT_PORT" ]; then
    exec "$REAL_BD" "$@"
fi

# Start socat forwarder if not already running
PIDFILE="/tmp/bd-socat.pid"
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    : # socat already running
else
    socat TCP-LISTEN:"$BD_DOLT_PORT",bind=127.0.0.1,fork,reuseaddr TCP:"$BD_DOLT_HOST":"$BD_DOLT_PORT" &
    echo $! > "$PIDFILE"
    sleep 0.2
fi

exec "$REAL_BD" "$@"
