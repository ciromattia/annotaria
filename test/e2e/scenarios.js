describe('AnnOtaria', function () {

	describe('Article list view', function () {

		beforeEach(function () {
			browser.get('app/');
		});

		it('should filter the document list as user types into the search box', function () {

			var articlelist = element.all(by.repeater('item in articlelist'));
			var query = element(by.model('articlequery'));

			expect(articlelist.count()).toBe(16);

			query.sendKeys('almo');
			expect(articlelist.count()).toBe(3);

			query.clear();
			query.sendKeys('zhang');
			expect(articlelist.count()).toBe(1);
		});

		it('should render article specific links', function () {
			var query = element(by.model('articlequery'));
			query.sendKeys('almond');
			element(by.css('.articlelist li a')).click();
			browser.getLocationAbsUrl().then(function (url) {
				expect(url.split('#')[1]).toBe('/annotaria-td/Adv_Virol_2012_Apr_2_2012_803535.html');
			});
		});
	});
});