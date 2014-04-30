var App = {
	
	socket: null,
	svg: null,
	projection: null,
	
	config: {
		remove_dot_ms: 10000							// how long to wait to remove map point
	},
	
	stats: {
		num_tweets: 0,
		num_tweets_mapped: 0
	},
	
	map_dims: {
		width: 960,
		height: 700
	},
	
	init: function()
	{
		this.initSocket();
		this.initMap();	
	},
	
	initSocket: function()
	{
		this.socket = io.connect();

		// when we get a "stats" update from server
		this.socket.on("stats", function(response) {
			$(".server-total-count").text(response.data.tt);
			$(".server-geo-count").text(response.data.gt);
			$(".server-connected-clients").text(response.data.cc);
			
			// uptime: make human-readable string
			var server_uptime_ms = response.data.ut;
			var server_uptime_sec = Math.floor(response.data.ut / 1000);
			var server_uptime_human = '';
			
			if (server_uptime_sec >= 86400) {
				var days = Math.floor(server_uptime_sec / 86400);
				server_uptime_human += days + (days===1?' day ' : ' days ');
			}
			if (server_uptime_sec >= 3600) {
				server_uptime_human += (Math.floor(server_uptime_sec / 3600) % 24) + ' hr ';
			}
			if (server_uptime_sec >= 60) {
				server_uptime_human += (Math.floor(server_uptime_sec / 60) % 60) + ' min ';
			} 
			
			server_uptime_human += server_uptime_sec % 60 + ' sec';
			$(".server-uptime").text(server_uptime_human);
			
			var tweets_per_sec = Math.round(response.data.tt / server_uptime_sec);
			$(".tweets-per-sec").text(tweets_per_sec);
						
		});
		
		// when we get a "msg" update from server (coordinates)
		this.socket.on("msg", function(data) {

			App.stats.num_tweets_mapped++;

			$(".tweet-count").text(App.stats.num_tweets_mapped);
			
			if (data.coords) {
				// place point on map
				var p = App.projection([data.coords[0], data.coords[1]]);
				var circle = App.svg.append("circle")
					.attr("cx", p[0])
					.attr("cy", p[1])
					.attr("r", 4)
					.attr("fill","red")
					.attr("opacity", 0.6);

				// remove point after some time
				setTimeout(function() {
					circle.remove();
					App.stats.num_tweets_mapped--;
				}, 10000);
			}
			else if (data.message) {
				console.log("Message from server: " + data.message);
			}
		});
	},
	
	initMap: function() 
	{
		this.projection = d3.geo.stereographic()
			.scale(245)
			.translate([this.map_dims.width / 2, this.map_dims.height / 2])
			.rotate([-20, 0])
			.clipAngle(180 - 1e-4)
			.clipExtent([[0, 0], [this.map_dims.width, this.map_dims.height]])
			.precision(.1);

		var path = d3.geo.path()
			.projection(this.projection);

		var graticule = d3.geo.graticule();

		this.svg = d3.select("#map").append("svg")
			.attr("width", this.map_dims.width)
			.attr("height", this.map_dims.height);

		this.svg.append("path")
			.datum(graticule)
			.attr("class", "graticule")
			.attr("d", path);
		
		// load world features
		d3.json("/json/world-50m.json", function(error, world) {
			App.svg.insert("path", ".graticule")
				.datum(topojson.feature(world, world.objects.land))
				.attr("class", "land")
				.attr("d", path);

			App.svg.insert("path", ".graticule")
				.datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
				.attr("class", "boundary")
				.attr("d", path);
			});
			
		d3.select(self.frameElement).style("height", this.map_dims.height + "px");	
	}
	
};
