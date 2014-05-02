'use strict';

angular
	.module('annotariaApp', [
		'ngCookies',
		'ngResource',
		'ngSanitize',
		'ngRoute'
	])
	.config(function ($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/main.html',
				controller: 'MainCtrl'
			})
			.when('/annotaria-td/:articlePath', {
				templateUrl: 'views/article.html',
				controller: 'ArticleDetailCtrl'
			})
			.otherwise({
				redirectTo: '/'
			});
	});