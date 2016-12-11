(function () {
    'use strict';

    /**
     * Requires a twitter configuration file inside of a data folder
     * (see README for more information)
     * 
     * @requires twitter_config.json file
     */
    var twitter_config = require('./data/twitter_config.json');

    /**
     * Requires the Twitter.js client to interact with Twitter's API
     * 
     * @requires Twitter
     */
    var Twitter = require('twitter-node-client').Twitter;
    var twitter = new Twitter(twitter_config);

    /**
     * Requires async.js library in order to efficiently manage the different
     * asynchronous HTTP requests
     * 
     * @requires async
     */
    var async = require('async');

    /**
     * Given a timestamp returns a string formatted to show in the application.
     * If the given timestamp, compared with the hours limit, is lower than a given limit,
     * it returns the hours difference with a customizable message; if it's higher, it returns 
     * the date of the timestamp in a format of "12 Nov" 
     * 
     * @param {Integer} timestamp           - Timestamp to parse
     * @param {Integer} hoursLimit          - Limit of hours where the function will parse the hours notation to day/month notation
     * @param {String} hoursMessageToAppend -
     * @returns a formatted date to be shown in the application following the before mentioned rules
     */
    function parseTime(timestamp, hoursLimit, hoursMessageToAppend) {
        var now = new Date();
        var time = new Date(timestamp);

        // Calculate hours difference
        var hoursDifference = Math.round(Math.abs((now.getTime() - time.getTime()) / (60 * 60 * 1000)));

        // Helper array to parse the month name
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (hoursDifference <= hoursLimit) {
            // If the current timestamp is under the hours limit applied, then return an hours notation
            return hoursDifference + hoursMessageToAppend;
        } else {
            // If it's higher, return a 'day/month' notation
            return (time.getDate() + " " + monthNames[time.getMonth()]);
        }
    }

    /**
     * Sorts an array of objects by its timestamp in a descending order
     * 
     * @param {Array of objects} array  - An array of objects with a 'timestamp' key to sort it
     * @returns a sorted array by its timestamp
     */
    function sortObjectArrayByTimestamp(array) {
        return array.sort(function (a, b) {
            return b.timestamp - a.timestamp;
        });
    }

    /**
     * Gets the Twitter user information and updates the renderData object that will be used to render
     * the page
     * 
     * @param {object} renderData           - Object that holds all the info to render the HTML page using pug
     * @param {object} res                  - Express response object
     * @param {function} successCallback    - Success Callback function for the HTTP request
     */
    function getUserInfo(renderData, res, successCallback) {
        // Send a getUser request
        twitter.getUser({
            screen_name: twitter_config.twitterUsername
        }, function (err) {
            // Error callback
            error(err, res);
        }, function (data) {
            var json = JSON.parse(data);

            renderData.user.username = json.name;
            renderData.user.screen_name = json.screen_name;
            renderData.user.userProfileImageUrl = json.profile_image_url;
            renderData.user.profileBackgroundImageUrl = json.profile_background_image_url;
            renderData.user.followingNumber = json.followers_count;

            // Call the success callback to send the renderData object to the next API request or the success callback in order to render the templates
            successCallback(null, renderData);
        });
    }

    /**
     * Gets the list of the last 5 tweets from the user
     * 
     * @param {object} renderData           - Object that holds all the info to render the HTML page using pug
     * @param {object} res                  - Express response object
     * @param {function} successCallback    - Success Callback function for the HTTP request
     */
    function getUserTimeline(renderData, res, successCallback) {
        twitter.getUserTimeline({
            screen_name: twitter_config.twitterUsername,
            count: '5'
        }, function (err) {
            // Error callback
            error(err, res);
        }, function (data) {
            var tweets = [];
            var tweetData = {};
            var json = JSON.parse(data);

            json.forEach(function (tweet) {
                var user = {};
                var tweetInfo = {};
                // Check if it's a user's tweet and retweet
                if (tweet.retweeted_status) {
                    // In case it is a retweet, get the user who made the original tweet and the text of the original tweet.
                    user = {
                        name: tweet.retweeted_status.user.name,
                        screen_name: tweet.retweeted_status.user.screen_name,
                        profile_image_url: tweet.retweeted_status.user.profile_image_url
                    };
                    tweetInfo = {
                        text: tweet.retweeted_status.text,
                        like_count: tweet.retweeted_status.favorite_count,
                        retweet_count: tweet.retweeted_status.retweet_count
                    };
                } else {
                    // In case it's an original tweet, then get the user and the text accordingly
                    user = {
                        name: tweet.user.name,
                        screen_name: tweet.user.screen_name,
                        profile_image_url: tweet.user.profile_image_url
                    };
                    tweetInfo = {
                        text: tweet.text,
                        like_count: tweet.favorite_count,
                        retweet_count: tweet.retweet_count
                    };
                }

                // Set the tweet data object and push it into the tweets array
                tweetData = {
                    timeElapsed: parseTime(tweet.created_at, 24, "h"),
                    user: user,
                    tweetInfo: tweetInfo
                };
                tweets.push(tweetData);
            });

            // Set the tweets inside of renderData
            renderData.tweets = tweets;

            // Call the success callback to send the renderData object to the next API request or the success callback in order to render the templates
            successCallback(null, renderData);
        });
    }

    /**
     * Gets the last 5 Twitter followers of the user
     * 
     * @param {object} renderData           - Object that holds all the info to render the HTML page using pug
     * @param {object} res                  - Express response object
     * @param {function} successCallback    - Success Callback function for the HTTP request
     */
    function getFollowersList(renderData, res, successCallback) {
        twitter.getFollowersList({
            screen_name: twitter_config.twitterUsername,
            count: '5'
        }, function (err) {
            // Error callback
            error(err, res);
        }, function (data) {
            var followers = [];
            var follower = {};
            var json = JSON.parse(data);

            json.users.forEach(function (user) {
                // Get the followers data and push it into the followers array
                follower = {
                    name: user.name,
                    screen_name: user.screen_name,
                    profile_image_url: user.profile_image_url,
                    following: user.following
                };
                followers.push(follower);
            });

            // Set the followers data inside the renderObject
            renderData.followers = followers;

            // Call the success callback to send the renderData object to the next API request or the success callback in order to render the templates
            successCallback(null, renderData);
        });
    }

    /**
     * Gets the last 5 direct messages or conversations from the user
     * 
     * @param {object} renderData           - Object that holds all the info to render the HTML page using pug
     * @param {object} res                  - Express response object
     * @param {function} successCallback    - Success Callback function for the HTTP request
     */
    function getDirectMessages(renderData, res, successCallback) {
        // Twitter API doesn't return the messages in the conversations sorted. It returns the sent messages in one request and the received ones in another. It's necessary to get all the sent messages and then all the received ones unsorted and sort them before pushing them to the renderData object
        // Using async.js waterfall method because it performs a request and waits it to finish to send a result to the next request
        async.waterfall([
            // Get the received direct messages
            // 20 messages are requested in order to make sure that messages in different conversations, when sorted, are not being ignored
            function (callback) {
                twitter.getCustomApiCall('/direct_messages.json', {
                    count: '20'
                }, function (err) {
                    // Error callback
                    error(err, res);
                }, function (data) {
                    var messages = [];
                    var message = {};
                    var json = JSON.parse(data);

                    json.forEach(function (message) {
                        message = {
                            timestamp: new Date(message.created_at).getTime(),
                            created_at: parseTime(new Date(message.created_at), 24, " hours ago"),
                            messageText: message.text,
                            from: {
                                screen_name: message.sender.screen_name,
                                name: message.sender.name,
                                profile_image_url: message.sender.profile_image_url
                            },
                        };
                        messages.push(message);
                    });

                    // Call the success callback to send the renderData object with the received messages array to the next request, that will be the one that retrieves the sent messages
                    callback(null, messages);
                });
            },
            // Get the sent messages
            // 20 messages are retrieved for the same reasons as before
            function (messages, callback) {
                twitter.getCustomApiCall('/direct_messages/sent.json', {
                    count: '20'
                }, function (err) {
                    // Error callback
                    error(err, res);
                }, function (data) {
                    var json = JSON.parse(data);
                    json.forEach(function (message) {
                        message = {
                            timestamp: new Date(message.created_at).getTime(),
                            created_at: parseTime(new Date(message.created_at), 24, " hours ago"),
                            messageText: message.text,
                            to: {
                                screen_name: message.recipient.screen_name,
                                name: message.recipient.name,
                                profile_image_url: message.recipient.profile_image_url
                            }
                        };
                        messages.push(message);
                    });

                    // Sort the messages by timestamp
                    messages = sortObjectArrayByTimestamp(messages);

                    // Since there will be around 20 messages, due to the configuration parameters, it's required to get only the 5 last messages
                    renderData.messages = messages.slice(0, 5); // Get only the first 5 messages

                    // Call the success callback to send the renderData object to the next API request or the success callback in order to render the templates
                    successCallback(null, renderData);
                });
            }
        ]);
    }

    /**
     * Performs all necessary requests to get Twitter's data to render the page
     * 
     * @param {Object} req  - Express Request object
     * @param {Object} res  - Express Response object
     */
    var performRequests = function (req, res) {
        var renderData = {
            user: {},
            tweets: [],
            followers: [],
            messages: []
        };

        // Using async.js waterfall method because it performs a request and waits it to finish to send a result to the next request
        async.waterfall([
                // Get the twitter user info
                function (callback) {
                    getUserInfo(renderData, res, callback);
                },
                // Get the tweets timeline
                function (renderData, callback) {
                    getUserTimeline(renderData, res, callback);
                },
                // Get the list of followers
                function (renderData, callback) {
                    getFollowersList(renderData, res, callback);
                },
                // Get the direct messages
                function (renderData, callback) {
                    getDirectMessages(renderData, res, callback);
                }
            ],
            function (err, renderData) {
                // Render the page at the end of the requests chain 
                res.render('index', renderData);
            });
    };

    /**
     * Posts a tweet to Twitter and re-renders the page again if everything happened correctly
     * 
     * @param {Object} req  - Express Request object
     * @param {Object} res  - Express Response object
     */
    var postTweet = function (req, res) {
        twitter.postTweet({
            status: req.body.tweet
        }, error, function () {
            // If the post request has ended successfully, perform again all the requests to re-render the page
            performRequests(req, res);
        });
    };

    /**
     * Error callback for HTTP requests sent to Twitter API
     * 
     * @param {Object} err  - Error object returned from the Twitter.js library
     * @param {Object} res  - Express Response object
     * @param {Object} body - Body object
     */
    var error = function (err, res) {
        res.render('error', {
            statusCode: err.statusCode,
            data: JSON.parse(err.data)
        });
    };

    // Export the necessary functions for the express application
    module.exports.performRequests = performRequests;
    module.exports.postTweet = postTweet;
})();