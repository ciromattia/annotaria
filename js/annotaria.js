'use strict';

$(document).ready(main);

function main() {
	$.ajax({
		method: 'GET',
		url: 'articles/articlelist',
		success: function (d) {
			for (var i = 0; i < d.length; i++) {
				$('#articlelist').append('<li class="nav-index-listing">' +
				'<small><a href="#" onclick="load(\'' + d[i].href + '\')">' +
				d[i].title + "</a></li>");
			}
		},
		error: function (a, b, c) {
			alert('No documents.')
		}
	});
}

function load(file) {
	$.ajax({
		method: 'GET',
		url: 'articles/' + file,
		success: function (d) {
			$('#current_article').html(d)
		},
		error: function (a, b, c) {
			alert('Cannot load file ' + file)
		}
	});
}
