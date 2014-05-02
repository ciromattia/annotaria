'use strict';

/* Controllers */
var appotariaControllers = angular.module('appotariaControllers', [])

appotariaControllers.controller('AppotariaCtrl', []);

/**
 * Controller for the article list widget
 *
 * @description
 */
appotariaControllers.controller('AppotariaArticleListCtrl', ['$scope', '$http',
	function ($scope, $http) {
		/* Entry point: this should be the first thing the controller does when instantiated. */
		/* It actually get the whole document list from the backend and assigns it to "articlelist" variable in the scope */
		$http.get('annotaria-td/article-list.json').success(function (data) {
			$scope.articlelist = data;
		});
	}]);

/**
 * Controller for the article detail page
 *
 * @description
 */
appotariaControllers.controller('AppotariaDetailCtrl', ['$scope', '$routeParams', '$http', '$sce',
	function ($scope, $routeParams, $http, $sce) {
		$http.get('annotaria-td/' + $routeParams.articlePath).success(function (data) {
			// TODO: here we should add all the logic for parsing the HTML of the selected article.
			$scope.article_body = $sce.trustAsHtml(data);
		});
	}]);

/**
 * Controller for the user login
 *
 * @description Log in a user
 * @todo It's only a stub for now
 */
appotariaControllers.controller('LoginCtrl', function ($scope, $http, $window) {
	$scope.user = {username: '', password: ''};
	$scope.message = '';
	$scope.submit = function () {
		$http
			.post('/authenticate', $scope.user)
			.success(function (data, status, headers, config) {
				$window.sessionStorage.token = data.token;
				$scope.message = 'Welcome';
			})
			.error(function (data, status, headers, config) {
				// Erase the token if the user fails to log in
				delete $window.sessionStorage.token;

				// Handle login errors here
				$scope.message = 'Error: Invalid user or password';
			});
	};
});
