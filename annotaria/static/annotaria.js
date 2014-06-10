'use strict';

var open_docs = {};
var doc_loaded = false;
var temp_annotations = [];
var range_selected = null;

var map_type_to_label = {
    'hasAuthor': 'Autore',
    'hasPublisher': 'Editore',
    'hasPublicationYear': 'Anno di pubblicazione',
    'hasTitle': 'Titolo',
    'hasAbstract': 'Abstract',
    'hasShortTitle': 'Titolo breve',
    'hasComment': 'Commento',
    'denotesPerson': 'Indicazione di persona',
    'denotesPlace': 'Indicazione di luogo',
    'denotesDisease': 'Indicazione di malattia',
    'hasSubject': 'Soggetto',
    'relatesTo': 'Relazione',
    'hasClarityScore': 'Chiarezza',
    'hasOriginalityScore': 'Originalità',
    'hasFormattingScore': 'Formattazione',
    'cites': 'Citazione'
}

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
            get_annotations(file, nextTab);
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

function get_annotations(file, docid) {
    $('#annotationlist').html('');
    $('.annotaria_fragment').contents().unwrap();
    document.getElementById('current_article').normalize();
    $.ajax({
        method: 'GET',
        url: 'annotations/' + file,
        success: function (d) {
            if (d.length < 1) {
                $('#annotationlist').html('');
            } else {
                var fragmentArray = [];
                var annotation_metadata;
                var html;
                for (var i = 0; i < d.length; i++) {
                    var annotation = d[i];
                    if (annotation['target']['start_id'] == null) {
                        annotation_metadata = '<div><strong>annotator:</strong> ' + annotation['provenance']['author']['name'] +
                            '</a><br><strong>created:</strong> ' + annotation['provenance']['time'] + '</div>';
                        $('#annotationlist').append('<li>' +
                            '<a data-container="body" data-toggle="popover" data-html="true" data-placement="top"' +
                            ' data-content="' + annotation_metadata + '">' +
                            '<small><strong>' + annotation['label'] + ':</strong> ' +
                            annotation['body']['object'] + '</small></a></li>');
                    } else {
                        var node = document.getElementById(annotation['target']['start_id']);
                        render_fragment(node, annotation['target']['start_off'], annotation['target']['end_off'], annotation);
                        
                        /*
                        var docrange = range.createRange();
                        docrange.selectNodeContents($('#current_article'));
                        outer_range.setEnd(range.endContainer, range.endOffset);
                        var offset = outer_range.toString().length;
                        start_offset += offset;
                        end_offset += offset;
                        */
                        /*
                        var k;
                        // Add the new selection range
                        var range = document.createRange();
                        var node = document.getElementById(annotation['target']['start_id']);
                        if (!node.childNodes)
                            range.setStart(node, annotation['target']['start_off']);
                        else
                            for (k = 0; k < node.childNodes.length; ++k)
                                if (!node.childNodes[k].id) {
                                    range.setStart(node.childNodes[k], annotation['target']['start_off']);
                                    break;
                                }
                        node = document.getElementById(annotation['target']['end_id']);
                        if (!node.childNodes)
                            range.setEnd(node, annotation['target']['end_off']);
                        else
                            for (k = 0; k < node.childNodes.length; ++k)
                                if (!node.childNodes[k].id) {
                                    range.setEnd(node.childNodes[k], annotation['target']['end_off']);
                                    break;
                                }
                        annotation_metadata = '<div><strong>annotator:</strong> ' + annotation['provenance']['author']['name'] +
                            '</a><br><strong>created:</strong> ' + annotation['provenance']['time'] + '</div>';
                        html = '<a data-container="body" data-toggle="popover" data-html="true" data-placement="top"' +
                            ' data-content="' + annotation_metadata + '" class="annotaria_fragment">' +
                            range.toString() + '</a>';
                        fragmentArray.push({
                            'offset': 0,
                            'range': range,
                            'html': html
                        });*/
                    }
                }
                /*for (var j = fragmentArray.length - 1; j >= 0; j--) {
                    var node = iframedoc.getElementById(note.target.id).firstChild; //prima era senza firstchild
                    render_fragment()
                    var fragment = null;
                    fragmentArray[j]['range'].deleteContents();
                    // Create a DocumentFragment to insert and populate it with HTML
                    // Need to test for the existence of range.createContextualFragment
                    // because it's non-standard and IE 9 does not support it
                    if (fragmentArray[j]['range'].createContextualFragment) {
                        fragment = fragmentArray[j]['range'].createContextualFragment(fragmentArray[j]['html']);
                    } else {
                        // In IE 9 we need to use innerHTML of a temporary element
                        var div = document.createElement("div"), child;
                        div.innerHTML = fragmentArray[j]['html'];
                        fragment = document.createDocumentFragment();
                        while ((child = div.firstChild)) {
                            fragment.appendChild(child);
                        }
                    }
                    fragmentArray[j]['range'].insertNode(fragment);
                }*/
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

function render_fragment(node, start, end, annotation) {
    var range = document.createRange();
    while (!node.hasOwnProperty('length'))
        node = node.firstChild;
    while (node.length < start) {
        start -= node.length;
        end -= node.length;
        if (node.nextSibling == null) {
            node = node.parentNode.nextSibling;
        } else {
            node = node.nextSibling.firstChild;
        }
    }
    range.setStart(node, start);
    if (node.length < end) {
        range.setEnd(node, node.length);
        if (node.nextSibling == null) {
            render_fragment(node.parentNode.nextSibling, 0, (end - node.length), annotation);
        } else {
            render_fragment(node.nextSibling, 0, (end - node.length), annotation);
        }
    } else {
        range.setEnd(node, end);
    }
    // build metadata
    var annotation_metadata = '<div><strong>' + annotation['label'] + '</strong>' +
        '<br><em>' + annotation['body']['object'] + '</em><br>';
    
    // provenance
    var author_name = annotation['provenance']['author']['name'];
    if (annotation['provenance']['author']['email'])
        author_name += '<' + annotation['provenance']['author']['email'] + '>';
    annotation_metadata += '<hr><strong>annotator:</strong> <a href="' +
        annotation['provenance']['author']['id'] + '" target="_blank">' + author_name +
        '</a><br><strong>created:</strong> ' + annotation['provenance']['time'] + '</div>';
    var a = document.createElement('a');
    a.setAttribute('data-container', 'body');
    a.setAttribute('data-toggle', 'popover');
    a.setAttribute('data-html', 'true');
    a.setAttribute('data-content', annotation_metadata);
    a.setAttribute('class', 'annotaria_fragment ' + annotation['type']);
    range.surroundContents(a);
    return range;
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
        var myRange = parse_range(range_selected);
        anno["target"]["start_id"] = myRange.container;
        anno["target"]["start_off"] = myRange.startOffset;
        anno["target"]["end_off"] = myRange.endOffset;
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

function parse_range(range) {
    var start_offset = Math.min(range.startOffset, range.endOffset);
    var end_offset = Math.max(range.startOffset, range.endOffset);
    var length = range.toString().length;
    var startContainer = range.startContainer.parentNode;
    var sib = range.startContainer.previousSibling;
    while (sib) {
        if (sib.hasOwnProperty('length')) {
            start_offset += sib.length;
            end_offset += sib.length;
        } else {
            start_offset += sib.firstChild.length;
            end_offset += sib.firstChild.length;
        }
        sib = sib.previousSibling;
    }
    var namedAncestor = range.commonAncestorContainer;
    while (!namedAncestor.id)
        namedAncestor = namedAncestor.parentNode;
    if (startContainer != namedAncestor) {
        /* calculate new offset */
        var outer_range = range.cloneRange();
        outer_range.selectNodeContents(namedAncestor);
        outer_range.setEnd(range.endContainer, range.endOffset);
        var offset = outer_range.toString().length - length;
        start_offset += offset;
        end_offset += offset;
    }
    return {
        startOffset: start_offset,
        endOffset: end_offset,
        container: namedAncestor.id
    };
}