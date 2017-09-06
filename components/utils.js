import _ from "lodash"

export function ShaderMatch() {

    const regExp = new RegExp();
    let regSource = "";

    return function(para, str) {

        regSource = "/\\*.*" + para + ".*\\*/([\\w\\W]*?(?=/\\*[\\w\\W]*\\*/)|[\\w\\W]*)";

        regExp.compile(regSource);

        return regExp.exec(str);
    }
}
export function extendOptions () {
	//arguments : object, options, defaultOptions

	var argLen = arguments.length;

	if (argLen == 2) {

	    arguments[0] || (arguments[0] = {});
	    arguments[1] || (arguments[1] = {});

	    _.extend(arguments[0], arguments[1]);

	} else if (argLen == 3) {

	    arguments[0] || (arguments[0] = {});
	    arguments[1] || (arguments[1] = {});
	    arguments[2] || (arguments[2] = {});

	    _.extend(arguments[0], _.extend(arguments[2], arguments[1]));

	} else {

	    console.log("Arguments not enough.");
	}
}


export function toSphere() {
	var lon = 0.0, lat = 0.0;
	var vertex = new THREE.Vector3();

	return function (x, y, r){

	    r = r !== undefined ? r : this.DefaultRadius;

	    lon = x * Math.PI / 180;
	    lat = y * Math.PI / 180;

	    vertex.x = r * Math.cos(lat) * Math.sin(lon);
	    vertex.y = r * Math.sin(lat);
	    vertex.z = r * Math.cos(lat) * Math.cos(lon);

	    return vertex;
	}
}
