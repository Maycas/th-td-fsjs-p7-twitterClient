(function () {
    'use strict';

    var twitter_config = require('./data/twitter_config.json');

    var Twitter = require('twitter-node-client').Twitter;
    var twitter = new Twitter(twitter_config);

    var async = require('async');


    function parseTime(timestamp, hoursLimit, hoursMessageToAppend) {
        var now = new Date();
        var time = new Date(timestamp);

        // Calculate hours difference
        var hoursDifference = Math.round(Math.abs((now.getTime() - time.getTime()) / (60 * 60 * 1000)));

        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (hoursDifference <= hoursLimit) {
            return hoursDifference + hoursMessageToAppend;
        } else {
            return (time.getDate() + " " + monthNames[time.getMonth()]);
        }
    }

    function sortObjectArrayByTimestamp(array) {
        return array.sort(function (a, b) {
            return b.timestamp - a.timestamp;
        });
    }

    function getUserInfo(renderData, errCallback, successCallback) {
        twitter.getUser({
            screen_name: twitter_config.twitterUsername
        }, errCallback, function (data) {
            var json = JSON.parse(data);

            renderData.username = json.name;
            renderData.screen_name = json.screen_name;
            renderData.userProfileImageUrl = json.profile_image_url;
            renderData.profileBackgroundImageUrl = json.profile_background_image_url;
            renderData.followingNumber = json.followers_count;

            successCallback(null, renderData);
        });
    }

    function getUserTimeline(renderData, errCallback, successCallback) {
        twitter.getUserTimeline({
            screen_name: twitter_config.twitterUsername,
            count: '5'
        }, errCallback, function (data) {
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

            // Set a key 'tweets' in the infoObj for rendering the 1st column
            renderData.tweets = tweets;

            successCallback(null, renderData);
        });
    }

    function getFollowersList(renderData, errCallback, successCallback) {
        twitter.getFollowersList({
            screen_name: twitter_config.twitterUsername,
            count: '5'
        }, errCallback, function (data) {
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

            renderData.followers = followers;

            successCallback(null, renderData);
        });
    }

    function getDirectMessages(renderData, errCallback, successCallback) {
        async.waterfall([
            function (callback) {
                twitter.getCustomApiCall('/direct_messages.json', {
                    count: '10'
                }, errCallback, function (data) {
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

                    callback(null, messages);
                });
            },
            function (messages, callback) {
                console.log(messages);
                twitter.getCustomApiCall('/direct_messages/sent.json', {
                    count: '10'
                }, errCallback, function (data) {
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

                    messages = sortObjectArrayByTimestamp(messages);

                    renderData.messages = messages.slice(0, 5); // Get only the first 5 messages

                    successCallback(null, renderData);
                });
            }
        ]);
    }


    module.exports.performRequests = function (req, res) {
        var renderData = {};
        async.waterfall([
                // Get the twitter user info
                function (callback) {
                    getUserInfo(renderData, error, callback);
                },
                // Get the tweets timeline
                function (renderData, callback) {
                    getUserTimeline(renderData, error, callback);
                },
                // Get the list of followers
                function (renderData, callback) {
                    getFollowersList(renderData, error, callback);
                },
                // Get the direct messages
                function (renderData, callback) {
                    getDirectMessages(renderData, error, callback);
                }
            ],
            function (err, renderData) {
                // Render the page at the end of the requests chain 
                res.render('index', renderData);
            });
    };

    //Callback functions
    var error = function (err, res, body) {
        console.log("error from the internal call");
    };
})();