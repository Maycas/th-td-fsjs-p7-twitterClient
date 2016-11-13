'use strict';

var twitter_config = require('./data/twitter_config.json');

var Twitter = require('twitter-node-client').Twitter;
var twitter = new Twitter(twitter_config);


function parseTime(timestamp, dayLimit) {
    var now = new Date();
    var timestamp = new Date(timestamp);
    // Calculate the days difference, taking into account the months as well
    var daysDifference = Math.round(Math.abs((now.getTime() - timestamp.getTime()) / (24 * 60 * 60 * 1000)));
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (daysDifference <= dayLimit) {
        return ((now.getHours() - timestamp.getHours()) + "h");
    } else {
        return (timestamp.getDate() + " " + monthNames[timestamp.getMonth()]);
    }
}

module.exports.getUserTimeline = function (errCallback, successCallback) {
    twitter.getUserTimeline({
        screen_name: twitter_config.twitterUsername,
        count: '5'
    }, errCallback, successCallback);
};


module.exports.performRequests = function (req, res, endedCallback) {
    var infoObj = {
        username: twitter_config.twitterUsername,
        userProfileImageUrl: 'http://localhost:3000/static/images/m-spore.png',
        followingNumber: 129
    };

    var tweets = [];
    var friends = [];
    var messages = [];

    // Get the tweets data
    this.getUserTimeline(error, function (data) {
        var tweetData = {};
        var user = {};
        var tweetInfo = {};
        var json = JSON.parse(data);

        console.log(json[2]);

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
                timeElapsed: parseTime(tweet.created_at, 1),
                user: user,
                tweetInfo: tweetInfo
            };
            tweets.push(tweetData);
        });

        // Set a key 'tweets' in the infoObj for rendering the 1st column
        infoObj.tweets = tweets;


        // Perform second request

        // Render 
        res.render('index', infoObj);

    });

};



//Callback functions
var error = function (err, response, body) {
    console.log('ERROR [%s]', JSON.stringify(err));
};
var success = function (data) {
    console.log('Data [%s]', JSON.stringify(data));
};