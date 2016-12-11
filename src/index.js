(function () {
    'use strict';

    /**
     * Requires Express to generate the server app
     * 
     * @requires Express
     */
    var express = require('express');

    /**
     * Requires the API library to request and post info to Twitter
     * 
     * @requires twitterAPI.js
     */
    var twitter = require('./twitterAPI.js');

    /**
     * Requires Body-Parser in order to get the information on POST requests
     * 
     * @requires body-parser
     */
    var bodyParser = require('body-parser');

    // Create application
    var app = express();

    // Setup bodyParser
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // Set the static files route
    app.use('/static', express.static(__dirname + '/public'));

    // Set the viewing engine pug and the templates directory
    app.set('view engine', 'pug');
    app.set('views', __dirname + '/templates');

    // Set the different get routes
    app.get('/', twitter.performRequests);

    // Set the post routes
    app.post('/', twitter.postTweet);

    // Set the port to listen for the app
    app.listen(3000, function () {
        console.log('Listening to port 3000...');
    });
})();