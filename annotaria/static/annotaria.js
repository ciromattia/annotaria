'use strict';

var open_docs = {};

$(document).ready(function () {
    get_articlelist();
//    $("#noti").html("<div class='alert alert-info'>Put the mouse over the title.</div>");
//    $('#notify').toggleClass('in');
//    setTimeout(function () {
//        $('#notify').toggleClass('in');
//    }, 5000);
});

function get_articlelist() {
    $.ajax({
        method: 'GET',
        url: 'articles',
        success: function (d) {
            for (var i = 0; i < d.length; i++) {
                var trimmed_title = d[i].title.substr(0, 25);
                $('#articlelist').append('<li class="nav-index-listing">' +
                    '<small><a data-toggle="tooltip" data-placement="left" title="' + d[i].title +
                    '" href="javascript:loadArticle(\'' + d[i].href + '\',\'' + d[i].title + '\')">' +
                    trimmed_title + "</a></li>");
            }
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

//this method will register event on close icon on the tab..
function registerCloseEvent() {
    $(".closeTab").click(function () {
        //there are multiple elements which has .closeTab icon so close the tab whose close icon is clicked
        var tabContentId = $(this).parent().attr("li");
        $(this).parent().remove(); //remove li of tab
        $('#tabs a:last').tab('show'); // Select first tab
    });
}

function loadArticle(file, title) {
    if (file in open_docs) {
        $('#tabs a[href="#tab' + open_docs[file] + '"]').tab('show');
    } else {
        var nextTab = $('#tabs li').size() + 1;
        open_docs[file] = nextTab;
        var trimmed_title = title.substr(0, 20);
        // create the tab
        $('<li><a href="#tab' + nextTab + '" data-toggle="tab">' + trimmed_title + '</a></li>').appendTo('#tabs');
        // create the tab content
        $('<div class="tab-pane" id="tab' + nextTab + '"><img src="static/ajax-loader.gif"></div>').appendTo('.tab-content');
        $.ajax({
            method: 'GET',
            url: 'article/' + file,
            success: function (d) {
                $('#tab' + nextTab).html(d['body']);
                get_annotations(file);
            },
            error: function (request, status, error) {
                alert(request.responseText);
            }
        });
        // make the new tab active
        $('#tabs a:last').tab('show');
    }
    $('#articleListPanel').collapse('hide');
}

function reload(file) {
    $.ajax({
        method: 'GET',
        url: 'article/' + file,
        success: function (d) {
            $('#current_article').html(d['body']);
            get_annotations(file);
        },
        error: function (a, b, c) {
            alert('Cannot load file ' + file)
        }
    });
}

function get_annotations(file) {
    $.ajax({
        method: 'GET',
        url: 'annotations/' + file,
        success: function (d) {
            if (d.length < 1) {
                $('#annotationlist').html('');
                $('#annotationListPanel').collapse('hide');
            } else {
                for (var i = 0; i < d.length; i++) {
                    var annotation = d[i];
                    var annotation_metadata = '<div><strong>annotator:</strong> ' + annotation['author_fullname'] +
                        '</a><br><strong>created:</strong> ' + annotation['created'] + '</div>';
                    $('#annotationlist').append('<li>' +
                        '<a data-container="body" data-toggle="popover" data-html="true" data-placement="top"' +
                        ' data-content="' + annotation_metadata + '">' +
                        '<small><strong>' + annotation['label'] + ':</strong> ' +
                        annotation['text'] + '</small></a>' +
                        '</li>');
                }
                $('#annotationListPanel').collapse('show');
                $('[data-toggle=popover]').popover();
            }
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

