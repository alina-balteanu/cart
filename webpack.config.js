const path = require("path");

const autoprefixer = require("autoprefixer");
const webpack = require("webpack");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/js/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,

        use: [
          "style-loader",
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
        query: {
          presets: ["@babel/preset-env"]
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "style.css"
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [autoprefixer()]
      }
    })
  ]
};
