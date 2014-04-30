var appOtaria = angular.module('appotaria', [])

appOtaria.controller('AppotariaCtrl', function ($scope, $http, $sce) {

	/* Entry point: this should be the first thing the controller does when instantiated. */
	/* It actually get the whole document list from the backend and assigns it to "documents" variable in the scope */
	$http.get('document.php?id=all').success(function (data) {
		$scope.documents = data;
	});

	/* */
	$scope.loadDocument = function (filename) {
		$http.get('document.php?id=file&filepath=' + filename).success(function (data) {
			$scope.doctext = $sce.trustAsHtml(data);
		});
	};
});

appOtaria.controller('AppotariaSearchCtrl', function ($scope, $http, $sce) {

});

appOtaria.controller('LoginCtrl', function ($scope, $http, $window) {
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