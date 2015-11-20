try { require('newrelic'); } catch(e) { }

// heroku assigns port randomly, when running locally, port==5000
var port = process.env.PORT || 5000;

var express = require('express');
var app = express();
var server = require('http').createServer(app);

var io = require('socket.io')(server);

var less = require('express-less');
var Twitter = require('twitter');

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

server.listen(port);

var stats = {
	total_tweets: 0,
	geo_tweets: 0,
	connected_clients: 0,
	time_start: Date.now()
};


app.use('/css', less(__dirname + '/less', {compress: true}));

// URL Routes
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/json/world-50m.json', function(req, res) {
	res.sendFile(__dirname + "/public/json/world-50m.json");
});

app.get('/js/worldtweets.js', function(req, res) {
	res.sendFile(__dirname + "/public/js/worldtweets.js");
});

app.get('/css/bootstrap-lumen.min.css', function(req, res) {
	res.sendFile(__dirname + "/public/css/bootstrap-lumen.min.css");
});


console.log(' >> Listening on port ' + port);

io.on('connection', function (socket)
{
	socket.emit('msg', { message: 'Welcome.' });

	stats.connected_clients++;

	socket.on('disconnect', function() {
		stats.connected_clients--;
	});
});

// instantiate twitter class
var T = new Twitter({
	consumer_key: config.twitter.consumer_key,
	consumer_secret: config.twitter.consumer_secret,
	access_token_key: config.twitter.access_token_key,
	access_token_secret: config.twitter.access_token_secret
});


// tap into dat stream
T.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {

	stream.on('data', function(data) {
		stats.total_tweets++;
		if (data.coordinates && data.coordinates.type == 'Point' && data.coordinates.coordinates[0] != 0 && data.coordinates.coordinates[1] != 0) {
			stats.geo_tweets++;
			io.emit('msg', { coords: data.coordinates.coordinates});
		}
	});

	stream.on('error', function(err) {
		console.log('error!');
		console.log(err);
	});
});

// periodically send updates to client (total tweets)
setInterval(function() {
	print_status();
}, 1000);

function print_status() {
	io.emit('stats', { data: { 
		tt: stats.total_tweets, // total tweets
		gt: stats.geo_tweets, // geo tweets
		ut: Date.now() - stats.time_start, // uptime in ms
		cc: stats.connected_clients // connected clients
	} });
}
