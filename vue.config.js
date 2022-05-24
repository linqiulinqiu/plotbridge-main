const pkg = require('./package.json')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

process.env.VUE_APP_MY_VERSION = JSON.stringify(pkg.version)
process.env.VUE_APP_DEP_VERSIONS = JSON.stringify(pkg.dependencies)

module.exports = {
    runtimeCompiler: true,
    lintOnSave: false,
    devServer: {
        host: 'localhost',
        hot: "only",
        compress: true,
        open: true
    },
    configureWebpack: {
        devtool:"source-map",
        plugins: [ new NodePolyfillPlugin()],
        optimization: {
            splitChunks: {
                chunks: "all"
            }
        }
    }
}
