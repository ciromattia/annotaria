'use strict';

var open_docs = {};


$(document).ready(function () {
    reset();
//    $("#noti").html("<div class='alert alert-info'>Put the mouse over the title.</div>");
//    $('#notify').toggleClass('in');
//    setTimeout(function () {
//        $('#notify').toggleClass('in');
//    }, 5000);
});
    
function reset() {
    $('a[href="#tab_welcome"]').on('shown.bs.tab', function () {
        $('#annotationlist').html('');
        $('#annotationListPanel').collapse('hide');
    });
    get_articlelist();
}

function get_key_for_doc(value) {
    for (var key in open_docs) {
        if (open_docs.hasOwnProperty(key)) {
            if (open_docs[key] === value)
                return key;
        }
    }
}

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
        var tabContentId = $(this).parent().attr("href");
        $(this).parent().parent().remove(); //remove li of tab
        $('#tabs a:last').tab('show'); // Select first tab
        $(tabContentId).remove(); //remove respective tab content
        var file = get_key_for_doc()
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
        $('<li><a href="#tab' + nextTab + '" data-toggle="tab"><button id="closeTab' + nextTab + '" ' +
            'class="close closeTab" type="button" >×</button> '
            + trimmed_title + '</a></li>').appendTo('#tabs');
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
        $('a[href="#tab' + nextTab + '"]').on('shown.bs.tab', function () {
            get_annotations(file);
        });
        $('#closeTab' + nextTab).click(function () {
            $('#closeTab' + nextTab).parent().remove(); //remove li of tab
            $('#tabs a:last').tab('show'); // Select first tab
            $('#tab' + nextTab).remove(); //remove respective tab content
            delete open_docs[file];
        });
    }
    $('#articleListPanel').collapse('hide');
}

function get_annotations(file) {
    $('#annotationlist').html('');
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

