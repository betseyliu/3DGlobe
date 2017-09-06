'use strict';
 import CHINA_CITY from './geo/china_city.json'
 import WORLD_COUNTRY from './geo/country_center.json'



var CHINA = JSON.parse( CHINA_CITY );
var WORLD = JSON.parse( WORLD_COUNTRY );

export default Locator = {

	ChinaState: function ( stateName ){

		var STATE = CHINA[ stateName ];

		if ( STATE ) {

			var COORD = STATE[ stateName ];

			if ( COORD ) {

				return [ COORD.x, COORD.y ]
			}

			return null;
		}

		return null;
	}, 

	ChinaCity: function ( stateName, cityName ) {

		var STATE = CHINA[ stateName ];

		if ( STATE ) {

			var COORD = STATE[ cityName ];

			if ( COORD ) {

				return [ COORD.x, COORD.y ]
			}

			return null;
		}

		return null;
	}, 

	WorldCountry: function ( countryName ){

		return WORLD[ countryName ];
	}
};
