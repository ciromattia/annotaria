'use strict';

var open_docs = {};
var doc_loaded = false;
var temp_annotations = [];

$(document).ready(function () {
    reset();
});

function reset() {
    $('a[href="#tab_welcome"]').on('shown.bs.tab', function () {
        $('#annotationlist').html('');
        $('#annotationListPanel').collapse('hide');
        $('#add_annotation_doc').hide();
    });
    $("#widget_instance").hide();
    $("#widget_date").hide();
    $("#widget_longtext").hide();
    $("#widget_shorttext").hide();
    get_articlelist();
    redraw_temp_annotations();
    doc_loaded = false;
    $('#add_annotation_doc').hide();
}

function send_message(type, message) {
    $("#noti").html('<div class="alert alert-' + type + '">' + message + '</div>');
    $('#notify').toggleClass('in');
    setTimeout(function () {
        $('#notify').toggleClass('in')
    }, 5000);
}

function redraw_temp_annotations() {
    var btn = $("#temp_annot_button");
    btn.html('Unsaved annotations (' + temp_annotations.length + ')');
    if (temp_annotations.length > 0) {
        btn.addClass('btn-warning');
        $('.temp_annot_action').removeClass('disabled');
    } else {
        btn.removeClass('btn-warning');
        $('.temp_annot_action').addClass('disabled');
    }
    var tbody = $('#temp_annot_rows');
    tbody.empty();
    for (var i = 0; i < temp_annotations.length; i++) {
        tbody.append('<tr><td>' + temp_annotations[i]['predicate'] + '</td><td>' +
            temp_annotations[i]['object'] + '</td>');
    }
}

function doc_annot_form_onselect(sel) {
    $("#widget_instance").hide();
    $("#widget_date").hide();
    $("#widget_longtext").hide();
    $("#widget_shorttext").hide();
    switch (sel.value) {
        case "hasAuthor":
        case "hasPublisher":
            $("#widget_instance").show();
            break;
        case "hasPublicationYear":
            $("#widget_date").show();
            break;
        case "hasTitle":
        case "hasAbstract":
        case "hasComment":
            $("#widget_longtext").show();
            break;
        case "hasShortTitle":
            $("#widget_shorttext").show();
            break;
        default:
            break;
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
                    '" href="javascript:load_article(\'' + d[i].href + '\',\'' + d[i].title + '\')">' +
                    trimmed_title + "</a></li>");
            }
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

function load_article(file, title) {
    if (file in open_docs) {
        $('#tabs a[href="#tab' + open_docs[file] + '"]').tab('show');
    } else {
        var nextTab = $('#tabs li').size() + 1;
        open_docs[file] = nextTab;
        var trimmed_title = title.substr(0, 20);
        // create the tab
        $('<li><a href="#tab' + nextTab + '" data-toggle="tab"><button id="closeTab' + nextTab + '" ' +
            'class="close closeTab" type="button" >&times;</button> '
            + trimmed_title + '</a></li>').appendTo('#tabs');
        // create the tab content
        $('<div class="tab-pane" id="tab' + nextTab + '"><i class="fa fa-spinner fa-spin"></i></div>').appendTo('.tab-content');
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
    doc_loaded = file;
}

function get_annotations(file) {
    $('#annotationlist').html('');
    $.ajax({
        method: 'GET',
        url: 'annotations/' + file,
        success: function (d) {
            if (d.length < 1) {
                $('#annotationlist').html('');
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

                $('[data-toggle=popover]').popover();
            }
            $('#annotationListPanel').collapse('show');
            $('#add_annotation_doc').show();
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

function save_annotation() {
    var annotype = $('#doc_annot_type').find(":selected").text();
    var anno = {
        "type": annotype,
        "label": null,
        "body": {
            "label": null,
            "subject": null,
            "predicate": null,
            "literal": null,
            "object": null,
            "resource": null
        },
        "target": {
            "source": doc_loaded,
            "start_id": null,
            "start_off": null,
            "end_id": null,
            "end_off": null
        }
    };
    switch (annotype) {
        case "hasAuthor":
        case "hasPublisher":
            anno['object'] = $("#widget_instance_selector").find(":selected").text();
            break;
        case "hasPublicationYear":
            anno['object'] = $("#widget_date_input").val();
            break;
        case "hasTitle":
        case "hasAbstract":
        case "hasComment":
            anno['object'] = $("#widget_longtext_input").val();
            break;
        case "hasShortTitle":
            anno['object'] = $("#widget_shorttext_input").val();
            break;
        default:
            break;
    }
    temp_annotations.push(anno);
    redraw_temp_annotations();
    $('#doc_annot').modal('hide');
    send_message('info', 'The annotation has been temporarily saved.<br>You need to store it to make it actually resilient.');
}

function discard_annotations() {
    temp_annotations = [];
    $('#temp_annot').modal('hide');
    send_message('success', 'Your annotations have been discarded!');
    redraw_temp_annotations();
}

function store_annotations(doc) {
    var json_anno = {
        "annotations": [],
        "target": {
            "source": doc
        },
        "provenance": {
            "author": {
                "name": "Ciro Mattia Gonano",
                "email": "ciromattia@gmail.com"
            },
            "time": new Date().toISOString()
        }
    };
    for (var i = 0; i < temp_annotations.length; i++) {
        var anno = temp_annotations[i];
        if (anno['target'] != doc)
            continue;
        json_anno['annotations'].push(anno)
    }
    $.ajax({
        type: "POST",
        url: "annotations/",
        data: {data: JSON.stringify(json_anno)},
        success: function (msg) {
            temp_annotations = [];
            $('#temp_annot').modal('hide');
            send_message('success', 'Your annotations have been successfully stored!');
            redraw_temp_annotations();
            get_annotations(doc_loaded);
        },
        error: function () {
            send_message('danger', 'Fail to save annotations, check your logs.');
        }
    });
}
