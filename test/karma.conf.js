module.exports = function (config) {
	config.set({

		basePath: '../',

		files: [
			'bower_components/angular/angular.js',
			'bower_components/angular-route/angular-route.js',
			'bower_components/angular-resource/angular-resource.js',
			'bower_components/angular-animate/angular-animate.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'app/js/**/*.js',
			'test/unit/**/*.js'
		],

		autoWatch: true,

		frameworks: ['jasmine'],

		browsers: ['PhantomJS'],

		plugins: [
			'karma-chrome-launcher',
			'karma-firefox-launcher',
			'karma-phantomjs-launcher',
			'karma-jasmine'
		],

		junitReporter: {
			outputFile: 'test_out/unit.xml',
			suite: 'unit'
		}

	});
};