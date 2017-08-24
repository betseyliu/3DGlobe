module.exports = {
    entry: [
        "babel-polyfill",
        "./demo2.js"
    ],
    output: {
        path: __dirname ,
        filename: 'index.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.glsl$/,
                loader:'webpack-glsl-loader',
            }
        ]
    }
};