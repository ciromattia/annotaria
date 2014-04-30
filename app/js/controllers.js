'use strict';

/* Controllers */

var appotariaControllers = angular.module('appotariaControllers', [])

appotariaControllers.controller('AppotariaCtrl', ['$scope', '$http',
	function ($scope, $http) {
		/*$http.get('annotaria-td/' + data[0]['href']).success(function (article) {
			$scope.currentArticle = article;
		});*/
	}]);

appotariaControllers.controller('AppotariaArticleListCtrl', ['$scope', '$http',
	function ($scope, $http) {
		/* Entry point: this should be the first thing the controller does when instantiated. */
		/* It actually get the whole document list from the backend and assigns it to "articlelist" variable in the scope */
		$http.get('annotaria-td/article-list.json').success(function (data) {
			$scope.articlelist = data;
		});
	}]);


appotariaControllers.controller('AppotariaDetailCtrl', ['$scope', '$routeParams', '$http',
	function ($scope, $routeParams, $http) {
		$http.get('annotaria-td/' + $routeParams.articlePath).success(function (data) {
			$scope.article_body = data;
		});
	}]);

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
