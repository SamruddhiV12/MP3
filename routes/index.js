/*
 * Connect all of your endpoints together here.
 */

module.exports = function (app, router) {
    // Attach home.js (which contains /api/users and /api/tasks)
    app.use('/api', require('./home.js')(router));
};
