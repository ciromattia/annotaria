describe('AppOtaria controllers', function () {

	beforeEach(function(){
		this.addMatchers({
			toEqualData: function(expected) {
				return angular.equals(this.actual, expected);
			}
		});
	});

	// Load our app module definition before each test.
	beforeEach(module('appotaria'));

	describe('AppotariaArticleListCtrl', function () {
		var scope, ctrl, $httpBackend;

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function (_$httpBackend_, $rootScope, $controller) {
			$httpBackend = _$httpBackend_;
			$httpBackend.expectGET('annotaria-td/article-list.json').
				respond([
					{
						"href": "Adv_Virol_2012_Apr_2_2012_803535.html",
						"title": "Almond, Krachmarov, Swetnam, Zolla-Pazner, and Cardozo: Resistance of Subtype C HIV-1 Strains to Anti-V3 Loop Antibodies"
					},
					{
						"href": "Ann_Med_2012_Sep_3_44(6)_616-626.html",
						"title": "Luoto, Moilanen, Heinonen, Mikkola, Raitanen, Tomas, Ojala, Mansikkamäai, and Nygård: Effect of aerobic training on hot flushes and quality of life—a randomized controlled trial"
					},
					{
						"href": "BMC_Bioinformatics_2008_Jan_23_9_40.html",
						"title": "Zhang: I-TASSER server for protein 3D structure prediction"
					}
				]);

			scope = $rootScope.$new();
			ctrl = $controller('AppotariaArticleListCtrl', {$scope: scope});
		}));

		it('should create "articlelist" model with 3 documents', function () {
			expect(scope.articlelist).toBeUndefined();
			$httpBackend.flush();

			expect(scope.articlelist).toEqual([
				{
					"href": "Adv_Virol_2012_Apr_2_2012_803535.html",
					"title": "Almond, Krachmarov, Swetnam, Zolla-Pazner, and Cardozo: Resistance of Subtype C HIV-1 Strains to Anti-V3 Loop Antibodies"
				},
				{
					"href": "Ann_Med_2012_Sep_3_44(6)_616-626.html",
					"title": "Luoto, Moilanen, Heinonen, Mikkola, Raitanen, Tomas, Ojala, Mansikkamäai, and Nygård: Effect of aerobic training on hot flushes and quality of life—a randomized controlled trial"
				},
				{
					"href": "BMC_Bioinformatics_2008_Jan_23_9_40.html",
					"title": "Zhang: I-TASSER server for protein 3D structure prediction"
				}
			]);
		});
	});
});