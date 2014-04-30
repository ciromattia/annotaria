describe('AnnOtaria', function () {

	describe('Document list view', function () {

		beforeEach(function () {
			browser.get('index.html');
		});

		it('should filter the document list as user types into the search box', function () {

			var docList = element.all(by.repeater('item in documents'));
			var query = element(by.model('docquery'));

			expect(documents.count()).toBe(16);

			query.sendKeys('Almo');
			expect(phoneList.count()).toBe(3);

			query.clear();
			query.sendKeys('zhang');
			expect(phoneList.count()).toBe(1);
		});
	});
});