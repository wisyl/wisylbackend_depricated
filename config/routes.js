'use strict';

/*
 * Module dependencies.
 */

const apis = {
  admins: require('../app/controllers/admins'),
};

/**
 * Route middlewares
 */

const middlewares = {
  auth: require('./middlewares/authorization'),
  init: require('./middlewares/init'),
};

/**
 * Expose routes
 */

module.exports = function (app, passport) {
  const pauth = passport.authenticate.bind(passport);

  // middleware
  app.use(middlewares.init.apiResponse);
  app.use(middlewares.init.parseToken);


  // CMS
  app.param('adminId', apis.admins.load);
  app.get('/', apis.admins.login); // this should be CMS dashboard
  app.get('/login', apis.admins.login);
  app.get('/signup', apis.admins.signup);
  app.get('/logout', apis.admins.logout);
  app.post('/admins', apis.admins.create);
  app.post(
    '/admins/session',
    pauth('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }),
    apis.admins.session
  );
  app.get('/admins/:adminId', middlewares.auth.requiresLogin, apis.admins.show);

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    
    // treat as 404
    if (
      err.message &&
      (~err.message.indexOf('not found') ||
        ~err.message.indexOf('Cast to ObjectId failed'))
    ) {
      return next();
    }

    console.error(err.stack);

    // error page
    const payload = { error: err.stack };
    if (err.stack.includes('ValidationError')) {
      return res.err(422, payload);
    }

  });

  // assume 404 since no middleware responded
  app.use(function(req, res) {
    const payload = {
      url: req.originalUrl,
      error: 'Not found'
    };
    res.err(404, payload);
  });
};
