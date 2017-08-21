var fs = require('fs'); 

readJson();

function readJson () {

	fs.readFile("./china.geo.json", function(err, data) { 
		if(err) { 
			console.error("err"); 
		} else{ 
			var map = JSON.parse(data);

			var result = {};
			var bbox = {};
			var lat_min = Infinity,
				lat_max = -Infinity,
				lon_max = -Infinity,
				lon_min = Infinity;
			for (var i = 0, features; features = map.features[i]; i++) {
				
				console.log(features);
				result[features.id] = {
					properties
				};

			}

			console.log(result);
			
		} 
	}); 
}