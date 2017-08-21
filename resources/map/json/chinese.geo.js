var fs = require('fs'); 

readJson();

function readJson () {

	fs.readFile("./china.geo.json", function(err, data) { 
		if(err) { 
			console.error("err"); 
		} else{ 
			var map = JSON.parse(data);

			var lat_min = Infinity,
				lat_max = -Infinity,
				lon_max = -Infinity,
				lon_min = Infinity;
			for (var i = 0, features; features = map.features[i]; i++) {
				var geometry = features.geometry;

				var _prop = {
					lat_min: Infinity,
					lat_max: -Infinity,
					lon_max: -Infinity,
					lon_min: Infinity
				}

				// Polygon
				if(geometry.type === "Polygon"){
					for (var j = 0, coordinates; coordinates = geometry.coordinates[j]; j++) {
						for (var k = 0, point; point = coordinates[k]; k++) {
							lat_min = Math.min(lat_min, point[0]);
							lat_max = Math.max(lat_max, point[0]);

							lon_min = Math.min(lon_min, point[1]);
							lon_max = Math.max(lon_max, point[1]);


							//
							_prop.lat_min = Math.min(_prop.lat_min, point[0]);
							_prop.lat_max = Math.max(_prop.lat_max, point[0]);

							_prop.lon_min = Math.min(_prop.lon_min, point[1]);
							_prop.lon_max = Math.max(_prop.lon_max, point[1]);
						}
					}
				}else{
					for (var j = 0, coordinates; coordinates = geometry.coordinates[j]; j++) {
						for (var k = 0, points; points = coordinates[k]; k++) {
							for (var t = 0, point; point = points[t]; t++) {
								lat_min = Math.min(lat_min, point[0]);
								lat_max = Math.max(lat_max, point[0]);

								lon_min = Math.min(lon_min, point[1]);
								lon_max = Math.max(lon_max, point[1]);

								//
								_prop.lat_min = Math.min(_prop.lat_min, point[0]);
								_prop.lat_max = Math.max(_prop.lat_max, point[0]);

								_prop.lon_min = Math.min(_prop.lon_min, point[1]);
								_prop.lon_max = Math.max(_prop.lon_max, point[1]);
							}
						}
					}
				}

				features.properties.bbox = calBbox(_prop.lat_min, _prop.lat_max, _prop.lon_min, _prop.lon_max);

				console.log(features.properties);

			}

			map.bbox = calBbox(lat_min, lat_max, lon_min, lon_max);

			fs.open('chinese.geo.json', 'w', function(e, fd) { 
				if(e) throw e;
				
				fs.write(fd, JSON.stringify(map), 0,'utf8', function(e){
					if(e) throw e;
					fs.closeSync(fd);
				})
			}); 
			
		} 
	}); 
}

function calBbox (x1, x2, y1, y2) {
	var bbox = {};

	bbox.x = x1;
	bbox.y = y1;

	bbox.x2 = x2;
	bbox.y2 = y2;

	bbox.width = +(bbox.x2 - bbox.x).toFixed(4);
	bbox.height = +(bbox.y2 - bbox.y).toFixed(4);

	bbox.cx = +(bbox.x / 2 + bbox.x2 / 2).toFixed(4);
	bbox.cy = +(bbox.y / 2 + bbox.y2 / 2).toFixed(4);

	return bbox;
}