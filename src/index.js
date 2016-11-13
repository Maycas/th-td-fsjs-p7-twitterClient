(function () {
    'use strict';

    var express = require('express');
    var twitter = require('./twitterAPI.js');

    var app = express();











    // Set the static files route
    app.use('/static', express.static(__dirname + '/public'));

    // Set the viewing engine pug and the templates directory
    app.set('view engine', 'pug');
    app.set('views', __dirname + '/templates');

    // Set the different get routes
    app.get('/', function (req, res) {
        twitter.performRequests(req, res);
    });

    // TODO: Set the post routes

    // Set the port to listen for the app
    app.listen(3000, function () {
        console.log('Listening to port 3000...');
    });

})();