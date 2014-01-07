// heroku assigns port randomly, when running locally, port==5000
var port = process.env.PORT || 5000;
var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(port));
var twitter = require('ntwitter');
var config = require('./config/config.js');

var stats = {
	total_tweets: 0,
	geo_tweets: 0
};

// URL Routes
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

app.get('/json/world-50m.json', function(req, res) {
	res.sendfile(__dirname + "/public/json/world-50m.json");
});



console.log(' >> Listening on port ' + port);

io.sockets.on('connection', function (socket) {
	socket.emit('msg', { message: 'Welcome.' });
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
			io.sockets.emit('msg', { coords: data.coordinates.coordinates});
		}
	});
});

// periodically send updates to client (total tweets)
setInterval(function() {
	print_status();
}, 1000);

function print_status() {
	// var geo_pct = Math.round( (stats.geo_tweets / stats.total_tweets) * 100 * 10 )/10;
	io.sockets.emit('stats', { data: { total_tweets: stats.total_tweets } });
}