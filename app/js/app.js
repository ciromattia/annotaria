'use strict';

/* App Module */

var appotaria = angular.module('appotaria', [
	'ngRoute',
	'appotariaControllers'
]);

appotaria.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'partials/home.html',
				controller: 'AppotariaCtrl'
			}).
			when('/annotaria-td/:articlePath', {
				templateUrl: 'partials/article.html',
				controller: 'AppotariaDetailCtrl'
			}).
			otherwise({
				redirectTo: '/'
			});
	}]);