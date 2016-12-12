# Twitter Interface Node.js application
## Installation instructions

1. Download the code in your machine and run `npm init` to download and instal all necessary dependencies
2. Create, inside `src` folder another folder `data` with a file named `twitter_config.json` (full path: `src/data/twitter_config.json`)
3. Inside `twitter_config.json`, add the following code:

  ```javascript
  {
      "consumerKey": "",
      "consumerSecret": "",
      "accessToken": "",
      "accessTokenSecret": "",
      "twitterUsername": ""
  }
  ```

4. Fill in your `consumerKey`, `consumerSecret`, `accessToken`, `accessTokenSecret` from your Twitter app account
5. Inside `twitterUsername`, fill in your twitter username, id or screen_name (as it is known in the Twitter API description)
6. Run `npm start` to start the web server in `http://localhost:3000`
