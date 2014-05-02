'use strict';

describe('Controller: ArticleListCtrl', function () {

	// load the controller's module
	beforeEach(module('annotariaApp'));

	var ArticleListCtrl,
		scope,
		$httpBackend;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($controller, $rootScope, _$httpBackend_) {
		$httpBackend = _$httpBackend_;
		$httpBackend.expectGET('annotaria-td/article-list.json').
			respond([
				{
					'href': 'Adv_Virol_2012_Apr_2_2012_803535.html',
					'title': 'Almond, Krachmarov, Swetnam, Zolla-Pazner, and Cardozo: Resistance of Subtype C HIV-1 Strains to Anti-V3 Loop Antibodies'
				},
				{
					'href': 'Ann_Med_2012_Sep_3_44(6)_616-626.html',
					'title': 'Luoto, Moilanen, Heinonen, Mikkola, Raitanen, Tomas, Ojala, Mansikkamäai, and Nygård: Effect of aerobic training on hot flushes and quality of life—a randomized controlled trial'
				},
				{
					'href': 'BMC_Bioinformatics_2008_Jan_23_9_40.html',
					'title': 'Zhang: I-TASSER server for protein 3D structure prediction'
				}
			]);
		scope = $rootScope.$new();
		ArticleListCtrl = $controller('ArticleListCtrl', {
			$scope: scope
		});
	}));

	it('should create "articlelist" model with 3 documents', function () {
		expect(scope.articlelist).toBeUndefined();
		$httpBackend.flush();

		expect(scope.articlelist).toEqual([
			{
				'href': 'Adv_Virol_2012_Apr_2_2012_803535.html',
				'title': 'Almond, Krachmarov, Swetnam, Zolla-Pazner, and Cardozo: Resistance of Subtype C HIV-1 Strains to Anti-V3 Loop Antibodies'
			},
			{
				'href': 'Ann_Med_2012_Sep_3_44(6)_616-626.html',
				'title': 'Luoto, Moilanen, Heinonen, Mikkola, Raitanen, Tomas, Ojala, Mansikkamäai, and Nygård: Effect of aerobic training on hot flushes and quality of life—a randomized controlled trial'
			},
			{
				'href': 'BMC_Bioinformatics_2008_Jan_23_9_40.html',
				'title': 'Zhang: I-TASSER server for protein 3D structure prediction'
			}
		]);
	});
});
