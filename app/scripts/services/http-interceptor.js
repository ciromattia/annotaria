'use strict';

angular.module('annotariaApp')
    .factory('myHttpInterceptor', ['$q', function ($q) {
      return function (promise) {
        return promise.then(function (response) {
          $("#loading").hide();
          return response;
        }, function (response) {
          $("#loading").hide();
          return $q.reject(response);
        });
      };
    }]);