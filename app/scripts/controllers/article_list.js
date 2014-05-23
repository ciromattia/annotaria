'use strict';

angular.module('annotariaApp')
/**
 * Controller for the article list widget
 *
 * @description
 */
    .controller('ArticleListCtrl', ['$scope', '$http',
      function ($scope, $http) {
        /* Entry point: this should be the first thing the controller does when instantiated. */
        /* It actually get the whole document list from the backend and assigns it to "articlelist" variable in the scope */
        $http.jsonp('http://localhost/annotaria-td/articlelist?callback=JSON_CALLBACK')
            .success(function (data) {
              $scope.articlelist = data;
            });
      }]);