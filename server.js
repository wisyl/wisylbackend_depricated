﻿'use strict';

/**
 * Module dependencies
 */

const fs = require('fs');
const dotenv = require('dotenv');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('./config');

// .env
dotenv.config();

// override env-specific .env file
const env = process.env.NODE_ENV || 'development';
const envConfig = dotenv.parse(fs.readFileSync(`.env.${env}`));
for (let k in envConfig) {
  process.env[k] = envConfig[k];
}

const app = express();

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
const models = [
  join(__dirname, 'app/admin/models'),
  join(__dirname, 'app/organization/models'),
  join(__dirname, 'app/recipient/models'),
];
models.forEach(it => {
  fs.readdirSync(it)
    .filter(file => ~file.search(/^[^.].*\.js$/))
    .forEach(file => require(join(it, file)));
});

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

connect();

function listen() {
  if (app.get('env') === 'test') return;
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log('Express app started on port ' + port);
}

function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.db, { keepAlive: 1, useNewUrlParser: true });
}
