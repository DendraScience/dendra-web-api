# Dendra Web API

The public facing REST API for Dendra. Built using [Feathers](https://feathersjs.com).

[API Documentation](https://dendrascience.github.io/dendra-json-schema/)

## Instructions

1. Be sure you have Node version 10.15.1. If you’re using nvm, you may need to `nvm use 10.15.1`.

2. Clone this repo.

3. Make this project directory the current directory, i.e. `cd dendra-web-api`.

4. Install modules via `npm install`.

5. If all goes well, you should be able to run the predefined package scripts.

## To build and publish the Docker image

1. Make this project directory the current directory, i.e. `cd dendra-web-api`.

2. Build the project `docker build -t dendra:dendra-web-api .`.

3. Tag the desired image, e.g. `docker tag f0ec409b5194 dendra/dendra-web-api:latest`.

4. Push it via `docker push dendra/dendra-web-api`.
