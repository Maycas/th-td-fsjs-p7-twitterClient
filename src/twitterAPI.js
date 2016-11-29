(function () {
    'use strict';

    var twitter_config = require('./data/twitter_config.json');
    var Twitter = require('twitter-node-client').Twitter;
    var twitter = new Twitter(twitter_config);

    var ServerApp = {
        apiRequests: 0,
        totalAmountOfRequests: 5,

        parseTime: function (timestamp, hoursLimit, hoursMessageToAppend) {
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
        },

        sortObjectArrayByTimestamp: function (array) {
            return array.sort(function (a, b) {
                return b.timestamp - a.timestamp;
            });
        },

        shouldRender: function () {
            this.apiRequests++;
            if (this.apiRequests === this.numOfRequests) {
                this.apiRequests = 0;
                return true;
            }
            return true;
        },

        render: function (res, template, data) {
            if (this.shouldRender()) {
                res.render(template, data);
            }
        },

        error: function (err, res, body) {
            console.log('ERROR [%s]', JSON.stringify(err));
            res.render('index', infoObj);
        },

        getUserInfo: function (result, errCallback, successCallback) {
            twitter.getUser({
                screen_name: twitter_config.twitterUsername
            }, errCallback, successCallback);
        },

        getUserTimeline: function (result, errCallback, successCallback) {
            twitter.getUserTimeline({
                screen_name: twitter_config.twitterUsername,
                count: '5'
            }, errCallback, successCallback);
        },

        getFollowersList: function (result, errCallback, successCallback) {
            twitter.getFollowersList({
                screen_name: twitter_config.twitterUsername,
                count: '5'
            }, errCallback, successCallback);
        },

        getDirectMessagesReceived: function (result, errCallback, successCallback) {
            twitter.getCustomApiCall('/direct_messages.json', {
                count: '10'
            }, errCallback, successCallback);
        },

        getDirectMessagesSent: function (result, errCallback, successCallback) {
            twitter.getCustomApiCall('/direct_messages/sent.json', {
                count: '10'
            }, errCallback, successCallback);
        },

        performRequests: function (req, res) {
            var infoObj = {};
            var app = ServerApp;

            // Get the tweets data
            app.getUserTimeline(infoObj, app.error, function (data) {
                var tweets = [];
                var tweetData = {};
                var user = {};
                var tweetInfo = {};
                var json = JSON.parse(data);

                json.forEach(function (tweet) {
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
                        timeElapsed: app.parseTime(tweet.created_at, 24, "h"),
                        user: user,
                        tweetInfo: tweetInfo
                    };
                    tweets.push(tweetData);
                });

                // Set a key 'tweets' in the infoObj for rendering the 1st column
                infoObj.tweets = tweets;


                // Perform second request - Get Followers
                app.getFollowersList(infoObj, app.error, function (data) {
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

                    infoObj.followers = followers;

                    // Perform third request - Get Direct Messages
                    app.getDirectMessagesReceived(infoObj, app.error, function (data) {
                        var messages = [];
                        var message = {};
                        var json = JSON.parse(data);

                        json.forEach(function (message) {
                            message = {
                                timestamp: new Date(message.created_at).getTime(),
                                created_at: app.parseTime(new Date(message.created_at), 24, " hours ago"),
                                messageText: message.text,
                                from: {
                                    screen_name: message.sender.screen_name,
                                    name: message.sender.name,
                                    profile_image_url: message.sender.profile_image_url
                                },
                            };
                            messages.push(message);
                        });

                        app.getDirectMessagesSent(infoObj, app.error, function (data) {
                            var json = JSON.parse(data);
                            json.forEach(function (message) {
                                message = {
                                    timestamp: new Date(message.created_at).getTime(),
                                    created_at: app.parseTime(new Date(message.created_at), 24, " hours ago"),
                                    messageText: message.text,
                                    to: {
                                        screen_name: message.recipient.screen_name,
                                        name: message.recipient.name,
                                        profile_image_url: message.recipient.profile_image_url
                                    }
                                };
                                messages.push(message);
                            });

                            messages = app.sortObjectArrayByTimestamp(messages);

                            infoObj.messages = messages.slice(0, 5); // Get only the first 5 messages

                            app.getUserInfo(infoObj, app.error, function (data) {
                                var json = JSON.parse(data);

                                infoObj.username = json.name;
                                infoObj.screen_name = json.screen_name;
                                infoObj.userProfileImageUrl = json.profile_image_url;
                                infoObj.profileBackgroundImageUrl = json.profile_background_image_url;
                                infoObj.followingNumber = json.followers_count;

                                // Render, at the end of the requests chain 
                                res.render('index', infoObj);
                            });
                        });
                    });
                });
            });
        },
    };

    module.exports.ServerApp = ServerApp;
})();