'use strict';

angular.module('annotariaApp')
	/**
	 * Controller for the article detail page
	 *
	 * @description
	 */
	.controller('ArticleDetailCtrl', ['$scope', '$routeParams', '$http', '$sce',
		function ($scope, $routeParams, $http, $sce) {
			$http.get('annotaria-td/' + $routeParams.articlePath).success(function (data) {
				// TODO: here we should add all the logic for parsing the HTML of the selected article.
				$scope.articleBody = $sce.trustAsHtml(data);
			});
		}]);