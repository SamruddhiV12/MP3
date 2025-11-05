/*
 * Connect all of your endpoints together here.
 */
module.exports = function (app, router) {
  // Mount the home route (which contains /api/tasks and /api/users)
  app.use('/api', require('./home.js')(router));
};
