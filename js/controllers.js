var appOtaria = angular.module('appOtaria', [])

appOtaria.controller('AppOtariaCtrl', function ($scope, $http, $sce) {
	$http.get('document.php?id=all').success(function (data) {
		$scope.documents = data;
	});

	$scope.loadDocument = function (filename) {
		$http.get('document.php?id=file&filepath=' + filename).success(function (data) {
			$scope.doctext = $sce.trustAsHtml(data);
		});
	};
});
