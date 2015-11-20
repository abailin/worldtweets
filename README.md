worldtweets
===========

Real time mapping of public tweets sampled from [Twitter's Streaming API](https://dev.twitter.com/docs/streaming-apis/streams/public), delivered to your browser using [socket.io](http://socket.io), and mapped using [D3.js](http://d3js.org).


# Running Locally
Copy `config/config-sample.js` to `config/config.js`. Add in your Twitter API keys (which can be generated [here](https://dev.twitter.com/apps/new)).

Then run:
``` bash
npm install
foreman start # (or node server.js)
```


# Running on Heroku

``` bash
heroku create
```

You will need to set the twitter config vars that are normally specified in config.js. To do so run:

``` bash
heroku config:set consumer_key=XXX consumer_secret=XXX access_token_key=XXX access_token_secret=XXX
```

Finally, deploy it:

``` bash
git push heroku master
heroku open
```

