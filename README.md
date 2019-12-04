#  Topcoder v5 Challenge Forum

## Description

This is a Node app that runs as a processor, watching a kafka queue and interfacing with Rocket.chat to build private groups to potentially replace the challenge forums.

## Requirements

- [Node](https://nodejs.org/en/)
- [Kafka](https://kafka.apache.org/)
- [Rocket.chat](https://rocket.chat/)

## Local Development

Use `docker-compose.yml` file to spin up instances of Kafka and Rocketchat during local development.

Install Docker, and run the following command:

```bash
$ docker-compose up -d
```

Make sure `kafka`, `zookeeper`, `mongo` and `rocketchat` services have start by running `docker ps`.

The default credentials of RocketChat are `rocket:rocket`, and the GUI should be accessible at http://127.0.0.1:3000/. You'll have to configure RocketChat before you'll be able to use it. Open the GUI, login and answer the prompts to configure it.

## Configuration

Please set the following environment variables to configure the app.
For quick-setup while development, use a `.env` file, and run `docker-compose up -d`, and then start the processor.

| Name | Description | Default value |
| ---- | ----------- | ------------- |
| DISABLE_LOGGING | Whether to disable logging | `false` |
| LOG_LEVEL | Logging level | `debug` |
| KAFKA_URL | Kafka connection string | `localhost:9092` |
| KAFKA_CLIENT_CERT | Kafka client certificate (SSL). This gets precedence over the file path. | `undefined` |
| KAFKA_CLIENT_CERT_PATH | Path to kafka client certificate (SSL) file. | `./config/kafka_client.cer` |
| KAFKA_CLIENT_CERT | Kafka client key (SSL). This gets precedence over the file path. | `undefined` |
| KAFKA_CLIENT_KEY_PATH | Path to kafka client key (SSL) file. | `./config/kafka_client.key` |
| KAFKA_SSL_PASSPHRASE | Passphrase (for SSL) | `secret` |
| ROCKETCHAT_PROTOCOL | Rocketchat Protocol | `http` |
| ROCKETCHAT_HOST | Rocketchat Host | `127.0.0.1`
| ROCKETCHAT_PORT | Rocketchat Port | `3000` |
| ROCKETCHAT_USERNAME | Rocketchat Username | `rocket` |
| ROCKETCHAT_PASSWORD | Rocketchat Password | `rocket` |
| TOPCODER_AUTH0_AUDIENCE | Topcoder Auth0 Audience | `undefined` |
| TOPCODER_AUTH0_CLIENT_ID | Topcoder Auth0 client ID | `undefined` |
| TOPCODER_AUTH0_CLIENT_SECRET | Topcoder Auth0 Client Secret | `undefined` |
| TOPCODER_AUTH0_PROXY_SERVER_URL | Topcoder Auth0 Proxy Server URL | `https://auth0proxy.topcoder-dev.com/token` |
| TOPCODER_AUTH0_URL | Topcoder Auth0 URL | `undefined` |
| TOPCODER_API_URL | Topcoder API URL | `https://api.topcoder-dev.com` |
| TOPCODER_ROOT_URL | Topcoder Root URL | `https://topcoder-dev.com` |

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Linting

```bash
# lint without fixing
$ npm run lint

# lint and auto-fix
$ npm run lint:fix
```

## CI/CD (For auto-deployment from Gitlab to Heroku)

Define the following environment variables in the GitLab CI/CD section:

- `HEROKU_APP_NAME`: Name of the Heroku app to which deployment is to be made
- `HEROKU_API_KEY`: API Key associated with the account owning the Heroku app

All changes to `master` branch will be pushed to the Heroku app automatically.

## Heroku Configuration

Install Heroku CLI. Instructions [here](https://devcenter.heroku.com/articles/heroku-cli).

Then, set the environment variables using the following commands, changing the values as necessary:

```bash
# Set the Kafka client certificate and client key
# Replace ./config/kafka_client.cer and ./config/kafka_client.key with the path to the certificate and key
$ heroku config:set -a <app_name> \
  KAFKA_CLIENT_CERT="$(cat ./config/kafka_client.cer)" \
  KAFKA_CLIENT_CERT_KEY="$(cat ./config/kafka_client.key)"

# Set the other environment variables
$ heroku config:set -a <app_name> \
  TOPCODER_AUTH0_PROXY_SERVER_URL="<value>" \
  TOPCODER_AUTH0_URL="<value>" \
  TOPCODER_API_URL="<value>" \
  TOPCODER_ROOT_URL="<value>" \
  KAFKA_URL="<value>" \
  ROCKETCHAT_PROTOCOL="<value>" \
  ROCKETCHAT_HOST="<value>" \
  ROCKETCHAT_PORT="<value>" \
  ROCKETCHAT_USERNAME="<value>" \
  ROCKETCHAT_PASSWORD="<value>"
```

Use the following command to turn on the worker dyno and disable the web dyno:

```bash
$ heroku ps:scale -a <app_name> worker=1 web=0
```

The free dyno is generally put to sleep after 30 seconds of inactivity, so it's recommended to use a paid dyno.