const CopyPlugin = require("copy-webpack-plugin")
const path = require("path")

// * Reminder: add a isDev feature

module.exports = {
	entry: "./src/background/background.js",
	output: {
		filename: "bundle.background.js",
		path: path.resolve(__dirname, "dist")
	},
	// output: {
	// 	filename: "bundle.[name].js",
	// 	path: _resolve(__dirname, isDev ? "dev" : "dist"),
	// 	publicPath: "/",
	// },
	// mode: 'development',
	// module: {
	// 	rules: [
	// 		{
	// 			test: /\.js$/,
	// 			exclude: /node_modules/,
	// 			use: {
	// 				// without additional settings, this will reference .babelrc
	// 				loader: 'babel-loader'
	// 			}
	// 		}
	// 	]
	// },
	// devtool: 'source-map'
	
	// All of our "extra" stuff is currently being copies over
	// When time permits, lets have everything compile correclty
	plugins: [
		new CopyPlugin({
			patterns: [{ context: path.resolve(__dirname, "src"), from: "assets", to: "assets" }],
		}),
		new CopyPlugin({
			patterns: [{ context: path.resolve(__dirname, "src"), from: "manifest.json" }],
		}),
		// NOTE: This file should be temporary: when we update the content scripts, change this.
		new CopyPlugin({
			patterns: [{ context: path.resolve(__dirname, "src/background"), from: "contentScript.js" }],
		}),
		new CopyPlugin({
			patterns: [{ context: path.resolve(__dirname, "src/options"), from: "options.html" }],
		}),
		new CopyPlugin({
			patterns: [{ context: path.resolve(__dirname, "src/popup"), from: "popup.html" }],
		}),

		// new HtmlWebpackPlugin({
		// 	filename: "popup.html",
		// 	template: "./src/popup/index.html",
		// 	chunks: ["popup"],
		// }),
		// new HtmlWebpackPlugin({
		// 	filename: "options.html",
		// 	template: "./src/options/index.html",
		// 	chunks: ["options"],
		// }),		    
	]
}