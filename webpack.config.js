/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
*/


import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ! Implement a "frontend" export in order to use a dev serve
// ! Implement terser for production
// ! Implement file loader for assets

export default (env, argv) => {
  const browser = env.chrome ? "chrome" : "firefox"; // default to firefox build
  const isProduction = argv.mode == "production"; // sets bool depending on build

  return {
    name: "background",
    // This is useful, plus we need it b/c otherwise we get an "unsafe eval" problem
    entry: {
      background: "./src/background/control.js",
      popup: "./src/popup/popup.js",
      options: "./src/options/options.js",
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve(
        __dirname,
        `${isProduction ? "dist" : "dev"}/${browser}`
      ),
    },
    devtool: isProduction ? "source-map" : "cheap-source-map",
    devServer: {
      open: true,
      host: "localhost",
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
    },
    module: {
      rules: [
        {
          // compile for the correct browser
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "string-replace-loader",
          options: {
            search: /\$BROWSER/g,
            replace: browser,
          },
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/,
          loader: "file-loader",
          options: {
            outputPath: "assets/",
            publicPath: "assets/",
            name: "[name].[ext]",
          },
        },
      ],
    },

    // All of our "extra" stuff is currently being copies over
    // When time permits, lets have everything compile correclty
    plugins: [
      new CleanWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, "src"),
            from: "assets",
            to: "assets",
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, "src"),
            from: "content-scripts",
            to: "content-scripts",
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(
              __dirname,
              env.chrome ? "src/manifests/chrome" : "src/manifests/firefox"
            ),
            from: isProduction ? "manifest-dist.json" : "manifest-dev.json",
            to: "manifest.json",
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, "src"),
            from: "rules",
            to: "rules",
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, "src/options"),
            from: "views",
            to: "views",
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, "src/options"),
            from: "components",
            to: "components",
          },
        ],
      }),
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
    ],
  };
};
