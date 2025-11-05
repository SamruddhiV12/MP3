/*
 * Connect all of your endpoints together here.
 */

module.exports = function (app, router) {
  // Mount /api/users and /api/tasks from home.js
  const homeRoutes = require('./home.js')(router);

  app.use('/api/tasks', homeRoutes);
  app.use('/api/users', homeRoutes);
};
