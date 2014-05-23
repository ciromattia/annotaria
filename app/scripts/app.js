'use strict';

angular
    .module('annotariaApp', [
      'ngCookies',
      'ngResource',
      'ngSanitize',
      'ngRoute'
    ])
    .config(['$routeProvider', '$httpProvider', function ($routeProvider) {
      $routeProvider
          .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
          })
          .when('/article/:articlePath', {
            templateUrl: 'views/article.html',
            controller: 'ArticleDetailCtrl'
          })
          .otherwise({
            redirectTo: '/'
          });
    }]);
