# OpenMusic-API
This repository contains an open music player application called OpenMusic. As the name implies, this app provides feature to manage music database for everyone.
This application is developed gradually so that later it has features such as adding songs, creating playlists, adding songs to playlists, sharing playlists with other users.

## Features
- Separate business logic via Hapi Plugin.
- Implementing Joi as a data validator to ensure the data submitted by the user is valid.
- Using PostgreSQL on a Node.js project as Database system and database normalization.
- Implementing Authentication and Authorization.
- Implementing Message Broker to Back-End Projects.
- Writing and Reading Files on Local Storage.
- Serving Requests Using Static Files on Hapi.
- Using Redis for Caching On RESTful Api.

# Setup:
- npm install
- npm run migrate up
- npm run start-dev

# .env

## server configuration
HOST=localhost

PORT=5000
 
## node-postgres configuration
PGUSER=developer

PGHOST=localhost

PGPASSWORD= your postgreSQL passowrd

PGDATABASE=songsapp

PGPORT=5432

## JWT Token
ACCESS_TOKEN_KEY= 

REFRESH_TOKEN_KEY=

ACCESS_TOKEN_AGE=1800

## Message broker
RABBITMQ_SERVER=amqp://localhost

## Redis
REDIS_SERVER=localhost
