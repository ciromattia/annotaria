exports.config = {
	allScriptsTimeout: 11000,

	specs: [
		'e2e/*.js'
	],

	capabilities: {
		'browserName': 'phantomjs'
	},

	chromeOnly: true,

	baseUrl: 'http://localhost:9001',

	framework: 'jasmine',

	jasmineNodeOpts: {
		defaultTimeoutInterval: 30000
	}
};