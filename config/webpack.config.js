const path = require('path');

const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { devPlugin, devProdOption, prodPlugin } = require('./helpers');

const ENTRY = require('./entry.js');
const OUTPUT_DIR = 'dist';

const uglifyjsplugin = {
  minimizer: [
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: false
        }
      }
    })
  ]
}

// Configure Babel Loader
const configureBabelLoader = () => {
  return {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader'
    }
  }
}

// Configure Html Loader
const configureHtmlLoader = (mode) => {
  return {
    test: /\.html$/,
    use: [{
      loader: 'html-loader',
      options: {
        minimize: mode === 'development' ? false : true
      }
    }]
  }
}

// Configure Style Loader
const configureStyleLoader = (mode) => {
  return {
    test: /\.(css|sass|scss)$/,
    use: [
      mode === 'development' ?
        'style-loader' :
        MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          importLoaders: 2,
          sourceMap: true
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          config: {
            path: './config/'
          }
        }
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  }
}

// Configure File Loader
const configureFileLoader = (imageModeFileLoader) => {
  return {
    test: /\.(jpe?g|png|gif|svg)$/i,
    loader: 'file-loader',
    options: {
      name: '[name]-[hash:8].[ext]',
      outputPath: imageModeFileLoader,
      publicPath: imageModeFileLoader,
      useRelativePath: true
    }
  }
}

// Configure SW
const configureSW = () => {
  return {
    swDest: 'sw.js',
    clientsClaim: true,
    skipWaiting: true,
  }
}

// Configure CopyWebpack
const configureCopy = () => {
  return [
    { from: 'sources/assets/', to: 'assets/' },
    { from: 'sources/images/static/', to: 'images/static' },
    { from: 'sources/assets/favicon.ico', to: './' },
    { from: 'sources/assets/.htaccess', to: './' },
    { from: 'sources/assets/robots.txt', to: './' },
  ]
}

// Configure Pug Loader
const configurePugLoader = () => {
  return {
    test: /\.pug$/,
    loader: 'pug-loader',
    options: {
      pretty: true,
      self: true
    }
  }
}

module.exports = (env, argv) => {

  const imageModeFileLoader = argv.mode === 'production' ? './images/' : ''

  const type =
    argv.mode === 'production' ? {
      pathToDist: `../${OUTPUT_DIR}`,
      mode: 'production',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true
      }
    } : {
        pathToDist: 'dist',
        mode: 'development',
        minify: false
      };

  // HtmlWebPackPlugin
  const entryHtmlPlugins = Object.keys(ENTRY.html).map(entryName => {
    const fileName = entryName === 'index-de' ? 'index' : 'index-pl';
    return new HtmlWebPackPlugin({
      filename: `${fileName}.html`,
      template: `./sources/templates/index.pug`,
      file: require(`../sources/data/${entryName}.json`),
      chunks: [entryName],
      minify: type.minify,
      mode: type.mode,
      inlineSource: '.(css)$'
    });
  });

  const output = {
    path: path.resolve(__dirname, `../${OUTPUT_DIR}`),
    filename: 'vendor/js/index.[hash].js'
  };

  return {
    devtool: devProdOption('source-map', 'none', argv),
    entry: ENTRY.html,
    output: output,
    module: {
      rules: [
        configureBabelLoader(),
        configureHtmlLoader(argv.mode),
        configureStyleLoader(argv.mode),
        configureFileLoader(imageModeFileLoader),
        configurePugLoader()
      ]
    },
    optimization: uglifyjsplugin,
    plugins: [
      prodPlugin(
        new CleanWebpackPlugin({
          verbose: true
        }),
        argv
      ),
      prodPlugin(
        new MiniCssExtractPlugin({
          filename: "vendor/css/index.[hash].css",
        }),
        argv
      ),
      prodPlugin(
        new WorkboxPlugin.GenerateSW(
          configureSW()
        ),
        argv
      ),
      prodPlugin(
        new CopyWebpackPlugin(
          configureCopy()
        ),
        argv
      ),
    ]
      .concat(entryHtmlPlugins)
      .concat(
        prodPlugin(
          new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'async'
          }),
          argv
        )
      )
      .concat(prodPlugin(new HtmlWebpackInlineSourcePlugin(), argv))
      .concat(
        prodPlugin(
          new BundleAnalyzerPlugin({
            openAnalyzer: true
          }),
          argv
        )
      )
  };
};