var fs = require('fs'); 

var data_list = [{
		name: "黑龙江",
		path: "hei_long_jiang.geo.json"
	},{
		name: "辽宁",
		path: "liao_ning.geo.json"
	},{
		name: "吉林",
		path: "ji_lin.geo.json"
	},{
		name: "内蒙古",
		path: "nei_meng_gu.geo.json"
	},{
		name: "新疆",
		path: "xin_jiang.geo.json"
	},{
		name: "甘肃",
		path: "gan_su.geo.json"
	},{
		name: "青海",
		path: "qing_hai.geo.json"
	},{
		name: "宁夏",
		path: "ning_xia.geo.json"
	},{
		name: "陕西",
		path: "shan_xi_1.geo.json"
	},{
		name: "山西",
		path: "shan_xi_2.geo.json"
	},{
		name: "河北",
		path: "he_bei.geo.json"
	},{
		name: "北京",
		path: "bei_jing.geo.json"
	},{
		name: "天津",
		path: "tian_jin.geo.json"
	},{
		name: "河南",
		path: "he_nan.geo.json"
	},{
		name: "山东",
		path: "shan_dong.geo.json"
	},{
		name: "江苏",
		path: "jiang_su.geo.json"
	},{
		name: "浙江",
		path: "zhe_jiang.geo.json"
	},{
		name: "上海",
		path: "shang_hai.geo.json"
	},{
		name: "安徽",
		path: "an_hui.geo.json"
	},{
		name: "江西",
		path: "jiang_xi.geo.json"
	},{
		name: "湖北",
		path: "hu_bei.geo.json"
	},{
		name: "湖南",
		path: "hu_nan.geo.json"
	},{
		name: "重庆",
		path: "chong_qing.geo.json"
	},{
		name: "四川",
		path: "si_chuan.geo.json"
	},{
		name: "贵州",
		path: "gui_zhou.geo.json"
	},{
		name: "西藏",
		path: "xi_zang.geo.json"
	},{
		name: "云南",
		path: "yun_nan.geo.json"
	},{
		name: "广西",
		path: "guang_xi.geo.json"
	},{
		name: "广东",
		path: "guang_dong.geo.json"
	},{
		name: "福建",
		path: "fu_jian.geo.json"
	},{
		name: "海南",
		path: "hai_nan.geo.json"
	},{
		name: "香港",
		path: "xiang_gang.geo.json"
	},{
		name: "澳门",
		path: "ao_men.geo.json"
	},{
		name: "台湾",
		path: "tai_wan.geo.json"
	}
];

// for (var n = 0, pro; pro = data_list[n]; n++) {
// 	readJson(pro);
// }

readJson(0);

function readJson (pro) {

	if(pro == data_list.length){

		// 写入文件
		fs.open('province.geo.json', 'w', function(e, fd) { 
			if(e) throw e;
			
			fs.write(fd, JSON.stringify(data_list), 0,'utf8', function(e){
				if(e) throw e;
				fs.closeSync(fd);
			})
		}); 
		

		return;
	}

	fs.readFile(data_list[pro].path, function(err, data) { 
		if(err) { 
			console.error("err"); 
		} else{ 
			var map = JSON.parse(data);

			var bbox = {};
			var lat_min = Infinity,
				lat_max = -Infinity,
				lon_max = -Infinity,
				lon_min = Infinity;
			for (var i = 0, features; features = map.features[i]; i++) {
				var geometry = features.geometry;
				// Polygon
				if(geometry.type === "Polygon"){
					for (var j = 0, coordinates; coordinates = geometry.coordinates[j]; j++) {
						for (var k = 0, point; point = coordinates[k]; k++) {
							lat_min = Math.min(lat_min, point[0]);
							lat_max = Math.max(lat_max, point[0]);

							lon_min = Math.min(lon_min, point[1]);
							lon_max = Math.max(lon_max, point[1]);
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
							}
						}
					}
				}
			}

			bbox.x = lat_min;
			bbox.y = lon_min;

			bbox.x2 = lat_max;
			bbox.y2 = lon_max;


			bbox.width = Math.abs(bbox.x2 - bbox.x);
			bbox.height = Math.abs(bbox.y2 - bbox.y);

			bbox.cx = bbox.x + bbox.width / 2;
			bbox.cy = bbox.y + bbox.height / 2;

			map.bbox = bbox;

			data_list[pro].map = map;
			readJson(++pro);
			
		} 
	}); 
}