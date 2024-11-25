#!/bin/bash

ip=$1
shift
op=$1
shift
OID="1.3.6.1.2.1.2.2.1.7"

if [ "$op" = "block" ]
then
    v=2
fi

if [ "$op" = "open" ]
then
    v=1
fi

for port in "$@"
do
    COMANDO="snmpset -c private -v1 $ip $OID.$port i $v"
    $COMANDO
done