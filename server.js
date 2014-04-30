try { require('newrelic'); } catch(e) { }

// heroku assigns port randomly, when running locally, port==5000
var port = process.env.PORT || 5000;
var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(port));
var twitter = require('ntwitter');

var config = {};

try {
	config = require('./config/config.js');
} catch (e) {
	// config file not available; try heroku config vars
	config = {
		twitter: {
			consumer_key: process.env.consumer_key,
			consumer_secret: process.env.consumer_secret,
			access_token_key: process.env.access_token_key,
			access_token_secret: process.env.access_token_secret
		}
	};
}

var stats = {
	total_tweets: 0,
	geo_tweets: 0,
	connected_clients: 0,
	time_start: Date.now()
};

// set up coffeescript compiler URL, but we will use straight JS for now
/*
app.configure(function() {
	app.use(coffee({
		src: __dirname + '/public/js',
		compress: true,
		prefix: '/js'
	}));

	app.use(express.static(__dirname + '/public/js'));
});
*/

// URL Routes
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

app.get('/json/world-50m.json', function(req, res) {
	res.sendfile(__dirname + "/public/json/world-50m.json");
});

app.get('/js/worldtweets.js', function(req, res) {
	res.sendfile(__dirname + "/public/js/worldtweets.js");
});


console.log(' >> Listening on port ' + port);

io.sockets.on('connection', function (socket)
{
	socket.emit('msg', { message: 'Welcome.' });

	stats.connected_clients++;

	socket.on('disconnect', function() {
		stats.connected_clients--;
	});


});

// instantiate twitter class
var twit = new twitter({
	consumer_key: config.twitter.consumer_key,
	consumer_secret: config.twitter.consumer_secret,
	access_token_key: config.twitter.access_token_key,
	access_token_secret: config.twitter.access_token_secret
});

// tap into dat stream
twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {
	stream.on('data', function(data) {
		stats.total_tweets++;
		if (data.coordinates && data.coordinates.type == 'Point') {
			stats.geo_tweets++;
			io.sockets.volatile.emit('msg', { coords: data.coordinates.coordinates});
		}
	});
});

// periodically send updates to client (total tweets)
setInterval(function() {
	print_status();
}, 1000);

function print_status() {
	io.sockets.emit('stats', { data: { 
		tt: stats.total_tweets, // total tweets
		gt: stats.geo_tweets, // geo tweets
		ut: Date.now() - stats.time_start, // uptime in ms
		cc: stats.connected_clients // connected clients
	} });
}
