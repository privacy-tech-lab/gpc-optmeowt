const CopyPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const path = require("path")

// ! Reminder: add a isDev feature

module.exports = {
	name: "background",
	entry: {
		background: "./src/background/background.js",
		popup: "./src/popup/popup.js",
		options: "./src/options/options.js",
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist")
	},
	// output: {
	// 	path: _resolve(__dirname, isDev ? "dev" : "dist"),
	// 	publicPath: "/",
	// },
	// mode: 'development',
	module: {
		rules: [
			{
				test: /\.js$/,
				// exclude: /node_modules/,
				use: {
					// without additional settings, this will reference .babelrc ?
					loader: 'babel-loader'
				}
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"]
			}
		]
	},
	// devtool: 'source-map'
	
	// All of our "extra" stuff is currently being copies over
	// When time permits, lets have everything compile correclty
	plugins: [
		new CleanWebpackPlugin(),
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

		// HTML
		new HtmlWebpackPlugin({
			filename: "options.html",
			template: "src/options/options.html",
			chunks: ["options"],
		}),
		new HtmlWebpackPlugin({
			filename: "popup.html",
			template: "src/popup/popup.html",
			chunks: ["popup"],
		}),

	]
}