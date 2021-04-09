# safecore

[![SafeWare](https://circleci.com/gh/SafeWare/safecore.svg?style=svg)](https://circleci.com/gh/SafeWare/safecore)

central core API for decrypted voice application

## Getting Started

Node version v10.14.0 is required for the application to work. Run `nvm use` to get the proper version for the project.

1. `yarn install`
2. `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`
3. `yarn dev`

### Docker

For docker connections you need to connect to murmur by getting the container ip. Example `docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' murmur`. Then create a .env file MURMUR_URL=dockerip.

### Env

environmental variables are handled through `.env`, make sure to set SUPER_USER_PASSWORD to the password on your murmur instance.

```
SUPER_USER_PASSWORD=
MURMUR_URL=
```

### About

Socket driven architecture to communicate with murmur low latency voice