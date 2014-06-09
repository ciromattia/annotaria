'use strict';

var open_docs = {};
var doc_loaded = false;
var temp_annotations = [];
var range_selected = null;
var annotaria_fragment_applier;

$(document).ready(function () {
    reset();
});

function reset() {
    $('a[href="#tab_welcome"]').on('shown.bs.tab', function () {
        $('#annotationlist').html('');
        $('#annotationListPanel').collapse('hide');
        $('#add_annotation_doc').hide();
    });
    $("#create_ranged_annot_button").hide();
    $("#widget_instance").hide();
    $("#widget_date").hide();
    $("#widget_longtext").hide();
    $("#widget_shorttext").hide();
    get_articlelist();
    redraw_temp_annotations();
    doc_loaded = false;
    $('#add_annotation_doc').hide();
    $('#current_article').bind({
        "mouseup": onSelection
    });
    rangy.init();
    var classApplierModule = rangy.modules.CssClassApplier;
    annotaria_fragment_applier = rangy.createCssClassApplier("annotaria_fragment");
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
            temp_annotations[i]['type'] + '</td>');
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
            get_authors();
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

function clear_instance_widget() {
    $("#widget_instance_new_id").val("");
    $("#widget_instance_new_name").val("");
    $("#widget_instance_new_email").val("");
}

function get_articlelist() {
    $.ajax({
        method: 'GET',
        url: 'articles',
        success: function (d) {
            for (var i = 0; i < d.length; i++) {
                var trimmed_title = d[i].title.substr(0, 25);
                $('#articlelist').append('<li class="nav-index-listing">' +
                    '<small><a title="' + d[i].title +
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
        $('<div id="#orig' + nextTab + '" style="display:none;"></div>').appendTo('#tabs');
        // create the tab content
        $('<div class="tab-pane" id="tab' + nextTab + '"><i class="fa fa-spinner fa-spin"></i></div>').appendTo('.tab-content');
        $.ajax({
            method: 'GET',
            url: 'article/' + file,
            success: function (d) {
                $('#tab' + nextTab).html(d['body']);
                $('#orig' + nextTab).html(d['body']);
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
    var doc_id = open_docs[file];
    $('#annotationlist').html('');
    $('#tabs a[href="#tab' + doc_id + '"]').html($('#orig' + doc_id).html());
    $.ajax({
        method: 'GET',
        url: 'annotations/' + file,
        success: function (d) {
            if (d.length < 1) {
                $('#annotationlist').html('');
            } else {
                var rangeArray = [];
                for (var i = 0; i < d.length; i++) {
                    var annotation = d[i];
                    if (annotation['target']['start_id'] == null) {
                        var annotation_metadata = '<div><strong>annotator:</strong> ' + annotation['provenance']['author']['name'] +
                            '</a><br><strong>created:</strong> ' + annotation['provenance']['time'] + '</div>';
                        $('#annotationlist').append('<li>' +
                            '<a data-container="body" data-toggle="popover" data-html="true" data-placement="top"' +
                            ' data-content="' + annotation_metadata + '">' +
                            '<small><strong>' + annotation['label'] + ':</strong> ' +
                            annotation['body']['object'] + '</small></a></li>');
                    } else {
                        // Add the new selection range
                        var range = rangy.createRangyRange();
                        var node = document.getElementById(annotation['target']['start_id']);
                        if (node.firstChild && node.firstChild.nodeType == 3)
                            range.setStart(node.firstChild, annotation['target']['start_off']);
                        else
                            range.setStart(node, annotation['target']['start_off']);
                        node = document.getElementById(annotation['target']['end_id']);
                        if (node.firstChild && node.firstChild.nodeType == 3)
                            range.setEnd(node.firstChild, annotation['target']['end_off']);
                        else
                            range.setEnd(node, annotation['target']['end_off']);
                        rangeArray.push(range);
                    }
                }
                for (var j = rangeArray.length - 1; j >= 0; j--) {
                    var fragment = null;
                    var html = '<span class="annotaria_fragment">' + range.toString() + '</span>';
                    rangeArray[j].deleteContents();
                    // Create a DocumentFragment to insert and populate it with HTML
                    // Need to test for the existence of range.createContextualFragment
                    // because it's non-standard and IE 9 does not support it
                    if (rangeArray[j].createContextualFragment) {
                        fragment = rangeArray[j].createContextualFragment(html);
                    } else {
                        // In IE 9 we need to use innerHTML of a temporary element
                        var div = document.createElement("div"), child;
                        div.innerHTML = html;
                        fragment = document.createDocumentFragment();
                        while ( (child = div.firstChild) ) {
                            fragment.appendChild(child);
                        }
                    }
                    rangeArray[j].insertNode(fragment);
                }
            }
            $('[data-toggle=popover]').popover();
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
            "object": null
        },
        "target": {
            "source": doc_loaded,
            "start_id": null,
            "start_off": null,
            "end_id": null,
            "end_off": null
        },
        "provenance": {
            "author": {
                "id": 'ciromattia-gonano',
                "name": "Ciro Mattia Gonano",
                "email": "ciromattia@gmail.com"
            },
            "time": new Date().toISOString()
        }
    };
    if (range_selected) {
        var namedAncestor = range_selected.startContainer;
        while (!namedAncestor.id)
            namedAncestor = namedAncestor.parentNode;
        anno["target"]["start_id"] = namedAncestor.id;
        namedAncestor = range_selected.endContainer;
        while (!namedAncestor.id)
            namedAncestor = namedAncestor.parentNode;
        anno["target"]["end_id"] = namedAncestor.id;
        anno["target"]["start_off"] = range_selected.startOffset;
        anno["target"]["end_off"] = range_selected.endOffset;
    }
    switch (annotype) {
        case "hasAuthor":
        case "hasPublisher":
            anno['body']['object'] = $("#widget_instance_selector option:selected").val();
            break;
        case "hasPublicationYear":
            anno['body']['object'] = $("#widget_date_input").val();
            break;
        case "hasTitle":
        case "hasAbstract":
        case "hasComment":
            anno['body']['object'] = $("#widget_longtext_input").val();
            break;
        case "hasShortTitle":
            anno['body']['object'] = $("#widget_shorttext_input").val();
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

function store_annotations() {
    $.ajax({
        type: "POST",
        url: "annotations/",
        data: {data: JSON.stringify(temp_annotations)},
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

function get_authors() {
    $('#widget_instance_selector').html('');
    $.ajax({
        method: 'GET',
        url: 'authors',
        success: function (d) {
            if (d.length > 0) {
                for (var i = 0; i < d.length; i++) {
                    var author = d[i];
                    var option = '<option value="' +
                        author['author_id'] + '">' +
                        author['author_fullname'];
                    if (author['author_email'] != 'None')
                        option += ' &lt;' + author['author_email'] + '&gt;';
                    option += '</option>';
                    $('#widget_instance_selector').append(option);
                }
            }
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

function save_author() {
    var author = {
        "author_id": $("#widget_instance_new_id").val(),
        "author_fullname": $("#widget_instance_new_name").val(),
        "author_email": $("#widget_instance_new_email").val()
    };
    $.ajax({
        type: "POST",
        url: "author/",
        data: {'data': JSON.stringify(author)},
        success: function (msg) {
            send_message('success', 'New instance has been successfully stored!');
            get_authors();
            clear_instance_widget();
        },
        error: function () {
            send_message('danger', 'Failed to save author, check your logs.');
        }
    });
}

function getRangeObject(selectionObject) {
    if (selectionObject.getRangeAt)
        return selectionObject.getRangeAt(0);
    else { // Safari!
        var range = document.createRange();
        range.setStart(selectionObject.anchorNode, selectionObject.anchorOffset);
        range.setEnd(selectionObject.focusNode, selectionObject.focusOffset);
        return range;
    }
}

function onSelection() {
    if (!doc_loaded)
        return false;

    var sel = null;
    if (window.getSelection) {
        sel = window.getSelection();
    } else if (document.getSelection) {
        sel = document.getSelection();
    } else if (document.selection) {
        sel = document.selection.createRange();
    }
    var range = getRangeObject(sel);
    if (range && !range.collapsed) {
        $('#create_ranged_annot_button').show();
        range_selected = range;
    } else {
        $('#create_ranged_annot_button').hide();
        range_selected = null;
    }
}

function replaceSelection(html, selectInserted) {
    var sel, range, fragment;

    if (typeof window.getSelection != "undefined") {
        // IE 9 and other non-IE browsers
        sel = window.getSelection();

        // Test that the Selection object contains at least one Range
        if (sel.getRangeAt && sel.rangeCount) {
            // Get the first Range (only Firefox supports more than one)
            range = window.getSelection().getRangeAt(0);
            range.deleteContents();

            // Create a DocumentFragment to insert and populate it with HTML
            // Need to test for the existence of range.createContextualFragment
            // because it's non-standard and IE 9 does not support it
            if (range.createContextualFragment) {
                fragment = range.createContextualFragment(html);
            } else {
                // In IE 9 we need to use innerHTML of a temporary element
                var div = document.createElement("div"), child;
                div.innerHTML = html;
                fragment = document.createDocumentFragment();
                while ( (child = div.firstChild) ) {
                    fragment.appendChild(child);
                }
            }
            var firstInsertedNode = fragment.firstChild;
            var lastInsertedNode = fragment.lastChild;
            range.insertNode(fragment);
            if (selectInserted) {
                if (firstInsertedNode) {
                    range.setStartBefore(firstInsertedNode);
                    range.setEndAfter(lastInsertedNode);
                }
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE 8 and below
        range = document.selection.createRange();
        range.pasteHTML(html);
    }
}