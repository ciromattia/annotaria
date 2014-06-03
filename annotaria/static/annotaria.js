'use strict';
var aperto = false;
var j = 0;

$(document).ready(function () {
    get_articlelist();
    $("#noti").html("<div class='alert alert-info'>Put the mouse over the title.</div>");
    $('#notify').toggleClass('in');
    setTimeout(function () {
        $('#notify').toggleClass('in');
    }, 5000);
});

function get_articlelist() {
    $.ajax({
        method: 'GET',
        url: 'articles',
        success: function (d) {
            for (var i = 0; i < d.length; i++) {
                var stringa = d[i].title;
                var subb = stringa.substr(0, 25);
                $('#articlelist').append('<li class="nav-index-listing">' +
                    '<small><a data-toggle="tooltip" data-placement="left" title="' + d[i].title + '"   href="javascript:load(\'' + d[i].href + '\',\'' + d[i].title + '\')">' +
                    subb + "</a></li>");
            }
        },
        error: function (a, b, c) {
            alert('No documents.')
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

function load(file, titolo) {
    if ($('[name="' + titolo + '"]').val() == titolo) {

        $("#noti").html("<div class='alert alert-danger'>The document is already open.</div>");
        $('#notify').toggleClass('in');
        setTimeout(function () {
            $('#notify').toggleClass('in');
        }, 5000);
    } else {
        var sub = titolo.substr(0, 20);
        if (j < 3) {
            $("#tabs").append('<li class="active" class="close closeTab" id="doc' + titolo + '" >' +
                '<button class="close closeTab" type="button" >×</button>' +
                '<input type="hidden" name="' + titolo + '" value="' + titolo + '"></input>' +
                '<a href="javascript:reload(\'' + file + '\');">' + sub + '</a>' +
                '</li>');
            $('#articleListPanel').collapse('hide');
            j++;
            $.ajax({
                method: 'GET',
                url: 'article/' + file,
                success: function (d) {
                    $('#current_article').html(d['body']);
                    $('#doc' + titolo + '').addClass('active');
                    get_annotations(file);
                },
                error: function () {
                    alert('Cannot load file ' + file)
                }

            });
        } else {
            $("#noti").html("<div class='alert alert-danger'>You can open only 3 Document</div>");
            $('#notify').toggleClass('in');
            setTimeout(function () {
                $('#notify').toggleClass('in');
            }, 5000);
        }

    }
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

