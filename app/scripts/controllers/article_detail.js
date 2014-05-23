'use strict';

angular.module('annotariaApp')
	/**
	 * Controller for the article detail page
	 *
	 * @description
	 */
	.controller('ArticleDetailCtrl', ['$scope', '$routeParams', '$http',
		function ($scope, $routeParams, $http) {
			$http.jsonp('http://localhost/annotaria-td/article/' + $routeParams.articlePath + '?callback=JSON_CALLBACK').success(function (data) {
				// TODO: here we should add all the logic for parsing the HTML of the selected article.
        $scope.title = 'My title here';
				$scope.articleBody = data;
			});
		}]);