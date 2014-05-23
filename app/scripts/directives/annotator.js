'use strict';

angular.module('annotariaApp')
    .directive('annotator', function () {
      return {
        restrict: 'A',
        link: function (scope, element) {
          element[0].annotator();
        }
      };
    });
