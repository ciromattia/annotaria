'use strict';

var open_docs = {};
var doc_loaded = false;
var temp_annotations = [];
var range_selected = null;
var instance_kind = null;

var user = {
    id: null,
    name: null,
    email: null
};

var doc_anno_types = {
    'hasAuthor': 'Author',
    'hasPublisher': 'Publisher',
    'hasPublicationYear': 'Publication year',
    'hasTitle': 'Title',
    'hasAbstract': 'Abstract',
    'hasShortTitle': 'Short title',
    'hasComment': 'Comment'
};

var frag_anno_types = {
    'denotesPerson': 'Denotes person',
    'denotesPlace': 'Denotes place',
    'denotesDisease': 'Denotes disease',
    'hasSubject': 'Subject',
    'relatesTo': 'Relates to',
    'hasClarityScore': 'Clarity score',
    'hasOriginalityScore': 'Originality score',
    'hasFormattingScore': 'Formatting score',
    //'cites': 'Cites',
    'hasComment': 'Comment'
};

$(document).ready(function () {
    setValidators();
    reset();
});

function reset() {
    $('a[href="#tab_welcome"]').on('shown.bs.tab', function () {
        $('#annotationlist').html('');
        $('#annotationListPanel').collapse('hide');
        $('#add_annotation_doc').hide();
    });
    $('#doc_annot').on('show.bs.modal', redraw_annotation_types_selector);
    $("#create_ranged_annot_button").hide();
    $("#widget_instance").hide();
    $("#widget_date").hide();
    $("#widget_longtext").hide();
    $("#widget_shorttext").hide();
    $("#widget_choice").hide();
    get_articlelist();
    redraw_temp_annotations();
    doc_loaded = false;
    $('#current_article').bind({
        "mouseup": onSelection
    });
    $("button[type=submit]").click(function (event) {
        event.preventDefault(); // cancel default behavior
    });
    $('#add_annotation_doc').click(function (event) {
        event.preventDefault();
        open_global_annotation();
    })
        .hide();
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
        tbody.append('<tr><td>' + temp_annotations[i]['label'] + '</td><td>' +
            temp_annotations[i]['body']['object'] + '</td><td><button type="button"' +
            ' onclick="discard_annotation(' + i + ')"><i class="fa fa-times-circle-o"></i></button>' +
            '</td>');
    }
}

function redraw_annotation_types_selector() {
    $('#doc_annot_type').html('<option value="" selected disabled>select the annotation type</option>');
    var map = range_selected ? frag_anno_types : doc_anno_types;
    $.each(map, function (idx, val) {
        var option = '<option value="' +
            idx + '">' + val + '</option>';
        $('#doc_annot_type').append(option);
    });
    $("#widget_date").hide();
    $("#widget_longtext").hide();
    $("#widget_shorttext").hide();
    $("#widget_choice").hide();
    $("#widget_instance").hide();
}

function doc_annot_form_onselect(sel) {
    instance_kind = null;
    switch (sel.value) {
        case "hasAuthor":
        case "denotesPerson":
            instance_kind = 'person';
            reload_instance_widget();
            break;
        case "hasPublisher":
            instance_kind = 'organization';
            reload_instance_widget();
            break;
        case "denotesPlace":
            instance_kind = 'place';
            reload_instance_widget();
            break;
        case "denotesDisease":
            instance_kind = 'disease';
            reload_instance_widget();
            break;
        case "hasSubject":
            instance_kind = 'subject';
            reload_instance_widget();
            break;
        case "relatesTo":
            instance_kind = 'dbpedia';
            reload_instance_widget();
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
        case "hasClarityScore":
        case "hasOriginalityScore":
        case "hasFormattingScore":
            $("#widget_choice").show();
            break;
        case "relatesTo":
            break;
        default:
            break;
    }
}

function reload_instance_widget() {
    var fs = $('#widget_instance_new_entry');
    fs.html('');
    switch (instance_kind) {
        case 'person':
            fs.append('<input id="widget_instance_new_id" type="text" class="form-control" placeholder="Id" maxlength="80">'
                + '<input id="widget_instance_new_name" type="text" class="form-control" placeholder="Name" maxlength="80">'
                + '<input id="widget_instance_new_email" type="email" class="form-control" placeholder="Email" maxlength="80">');
            break;
        case 'organization':
        case 'place':
        case 'disease':
        case 'subject':
        case 'dbpedia':
            fs.append('<input id="widget_instance_new_uri" type="text" class="form-control" placeholder="Uri" maxlength="80">'
                + '<input id="widget_instance_new_label" type="text" class="form-control" placeholder="Label" maxlength="80">');
            break;
        default:
            break;
    }
    fs.append('<button type="button" class="btn btn-primary pull-right" id="widget_instance_new_save"' +
        ' onclick="save_instance()"><i class="fa fa-check"></i> Create new</button>');
    populate_instances();
    $("#widget_instance").show();
}

function populate_instances() {
    $('#widget_instance_selector').html('');
    $.ajax({
        method: 'GET',
        url: instance_kind,
        success: function (d) {
            if (d.length > 0) {
                for (var i = 0; i < d.length; i++) {
                    var instance = d[i];
                    switch (instance_kind) {
                        case 'person':
                            var option = '<option value="' +
                                instance['author_id'] + '">' +
                                instance['author_fullname'];
                            if (instance['author_email'] != null)
                                option += ' &lt;' + instance['author_email'] + '&gt;';
                            option += '</option>';
                            break;
                        default:
                            var option = '<option value="' +
                                instance['id'] + '">' +
                                instance['label'];
                            option += '</option>';
                            break;
                    }
                    $('#widget_instance_selector').append(option);
                }
            }
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}

function save_instance() {
    switch (instance_kind) {
        case 'person':
            var instance = {
                "author_id": $("#widget_instance_new_id").val(),
                "author_fullname": $("#widget_instance_new_name").val(),
                "author_email": $("#widget_instance_new_email").val()
            };
            break;
        default:
            var instance = {
                "id": $("#widget_instance_new_uri").val(),
                "label": $("#widget_instance_new_label").val()
            };
            break;
    }
    var url = instance_kind + '/';
    $.ajax({
        type: "POST",
        url: url,
        data: {'data': JSON.stringify(instance)},
        success: function (msg) {
            send_message('success', 'New instance has been successfully stored!');
            reload_instance_widget();
        },
        error: function () {
            send_message('danger', 'Failed to save instance, check your logs.');
        }
    });
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
                for (var i = 0; i < d.length; i++) {
                    var annotation = d[i];
                    if (annotation['target']['start_id'] == null) {
                        var a = document.createElement('a');
                        a.setAttribute('data-container', 'body');
                        a.setAttribute('data-toggle', 'popover');
                        a.setAttribute('data-html', 'true');
                        a.setAttribute('data-content', build_metadata(annotation));
                        var label = annotation['body']['label'] != null ?
                            annotation['body']['label'] : annotation['body']['object'];
                        a.innerHTML = '<small><strong>' + annotation['label'] + ':</strong> ' +
                            label + '</small>';
                        var li = document.createElement('li');
                        li.appendChild(a);
                        $('#annotationlist').append(li);
                    } else {
                        var node = document.getElementById(annotation['target']['start_id']);
                        render_fragment(node, annotation['target']['start_off'], annotation['target']['end_off'], annotation);
                    }
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

function render_fragment(node, start, end, annotation) {
    var range = document.createRange();
    while (node.nodeType != 3)
        node = node.firstChild;
    while (node.length < start) {
        start -= node.length;
        end -= node.length;
        if (node.nextSibling != null && node.nextSibling.nodeType == 8)
            node = node.nextSibling;
        if (node.nextSibling == null) {
            node = node.parentNode.nextSibling;
        } else {
            node = node.nextSibling.firstChild;
        }
    }
    range.setStart(node, start);
    if (node.length < end) {
        range.setEnd(node, node.length);
        if (node.nextSibling != null && node.nextSibling.nodeType == 8)
            node = node.nextSibling;
        if (node.nextSibling == null) {
            render_fragment(node.parentNode.nextSibling, 0, (end - node.length), annotation);
        } else {
            render_fragment(node.nextSibling, 0, (end - node.length), annotation);
        }
    } else {
        range.setEnd(node, end);
    }

    var a = document.createElement('a');
    a.setAttribute('data-container', 'body');
    a.setAttribute('data-toggle', 'popover');
    a.setAttribute('data-html', 'true');
    a.setAttribute('data-content', build_metadata(annotation));
    a.setAttribute('class', 'annotaria_fragment ' + annotation['type']);
    range.surroundContents(a);
    return range;
}

function build_metadata(annotation) {
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

    return annotation_metadata;
}

function register_user() {
    user = {
        id: $('#user_id').val(),
        name: $('#user_fullname').val(),
        email: $('#user_email').val()
    };
    $('#loginModal').modal('hide');
    if (user.id && user.name) {
        var msg = '<em>' + user.name;
        if (user.email)
            msg += ' &lt;' + user.email + '&gt;';
        msg += '</em>';
    } else {
        var msg = '<em>not registered</em>';
    }
    $('#annotator_data').html('');
    $('#annotator_data').append(msg);
}

function save_annotation() {
    var annotype = $('#doc_annot_type').find(":selected");
    var author = user.id ? user : {id: 'ciromattia-gonano', name: 'Ciro Mattia Gonano', email: 'ciromattia@gmail.com'};
    var anno = {
        "type": annotype.val(),
        "label": annotype.text(),
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
            "author": author,
            "time": new Date().toISOString()
        }
    };
    if (range_selected) {
        var myRange = parse_range(range_selected);
        anno["target"]["start_id"] = myRange.container;
        anno["target"]["start_off"] = myRange.startOffset;
        anno["target"]["end_off"] = myRange.endOffset;
    }
    switch (annotype.val()) {
        case "hasAuthor":
        case "hasPublisher":
        case "denotesPerson":
        case "denotesPlace":
        case "denotesDisease":
        case "hasSubject":
            anno['body']['object'] = $('#widget_instance_selector').find(':selected').val();
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
        case "hasClarityScore":
        case "hasOriginalityScore":
        case "hasFormattingScore":
            anno['body']['object'] = $("#widget_choice_input").val();
            break;
        case "relatesTo":
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

function discard_annotation(i) {
    temp_annotations.splice(i, 1);
    send_message('success', 'Annotation correctly removed');
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

function open_global_annotation() {
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {  // IE?
        document.selection.empty();
    }
    $('#create_ranged_annot_button').hide();
    range_selected = null;
    $('#doc_annot').modal('show');
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

function setValidators() {
    $('#loginModal').on('show.bs.modal', function () {
        $('#loginForm').bootstrapValidator('resetForm', true);
    });
    $('#loginForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'fa fa-check',
            invalid: 'fa fa-times',
            validating: 'fa fa-refresh'
        },
        fields: {
            user_id: {
                validators: {
                    notEmpty: {
                        message: 'The User ID is required and cannot be empty'
                    }
                }
            },
            user_fullname: {
                validators: {
                    notEmpty: {
                        message: 'The Fullname is required and cannot be empty'
                    }
                }
            },
            user_email: {
                validators: {
                    emailAddress: {
                        message: 'The input is not a valid email address'
                    }
                }
            }
        }
    });
}