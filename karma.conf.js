module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [ 'browserify', 'mocha' ],
        files: [
            'tests/**/*-tests.js'
        ],
        exclude: [],
        preprocessors: {
            'tests/**/*-tests.js': [ 'browserify' ]
        },
        reporters: [ 'progress' ],
        port: 12000,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: [ 'PhantomJS' ],
        singleRun: false,
        concurrency: Infinity,

        browserify: {
            debug: true
        }
    })
};
