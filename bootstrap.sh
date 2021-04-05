#!/bin/sh

PRIVATE_KEY=key.pem
PUBLIC_KEY=cert.pem

if [[ ! -e "$PRIVATE_KEY" ]]; then
	echo "creating private key"
	openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout $PRIVATE_KEY -out $PUBLIC_KEY -subj "/C=GB/ST=America/L=America/O=Global Security/OU=IT Department/CN=example.com"
fi
