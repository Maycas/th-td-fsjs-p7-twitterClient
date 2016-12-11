(function ($) {
    'use strict';

    /**
     * Twitter client-side app constructor
     * @constructor
     */
    function TwitterClient() {
        // The only required step it to attach the listeners to the right elements in the page
        this.registerListeners();
    }

    /**
     * Registers the keyup listener to the twitter text-area
     */
    TwitterClient.prototype.registerListeners = function () {
        var context = this; // Get the context (object instance reference)

        // Text Area keyup handler
        $('#tweet-textarea').on('keyup', context.tweetCharCounter);
    };

    /**
     * Keyup event handler that updates the char counter in the text-area and disables the 'Tweet' button in case it exceeded
     * Twitter's limit of 140 characters
     */
    TwitterClient.prototype.tweetCharCounter = function () {
        var $charCounter = $('#tweet-char');
        var textAreaChars = $('#tweet-textarea').val().length;
        var $submitButton = $('button.button-primary');

        // Update the remaining characters for the tweet
        $charCounter.text(140 - textAreaChars);

        // Change the text color when the counter reaches 0 and enable or disable the submit button
        if ($charCounter.text() < 0) {
            $charCounter.css('color', '#ef8686');
            $submitButton.prop('disabled', true);
        } else {
            $charCounter.css('color', '#ccc');
            $submitButton.prop('disabled', false);
        }
    };

    // Create and initialize the twitter client application
    var app = new TwitterClient();
})(jQuery);