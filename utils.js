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
