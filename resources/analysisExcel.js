console.log('analysis excel !');

var xlsx = require("node-xlsx");

var list = xlsx.parse("APT_DATA.xlsx");

for (var i = 0, d; d = list[i]; i++) {
	// console.log(d.name);
	var data = d.data;

	if(data.length == 5){
		console.log(d.data);
	}
}