describe('AppotariaCtrl', function () {

	beforeEach(module('appotaria'));

	it('should create "documents" model with 16 documents', inject(function ($controller) {
		var scope = {},
			ctrl = $controller('AppotariaCtrl', {$scope: scope});

		expect(scope.documents.length).toBe(16);
	}));

});