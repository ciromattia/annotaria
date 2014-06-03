'use strict';
$(document).ready(function () {
    main();
    $("#noti").html("<div class='alert alert-info'>Put the mouse over the title.</div>");
    $('#notify').toggleClass('in');
    setTimeout(function () {
        $('#notify').toggleClass('in');
    }, 5000);
});

function main() {
    $.ajax({
        method: 'GET',
        url: 'articles',
        success: function (d) {
            for (var i = 0; i < d.length; i++) {
                var stringa = d[i].title;
                var subb = stringa.substr(0, 25);
                $('#articlelist').append('<li class="nav-index-listing">' +
                    '<small><a data-toggle="tooltip" data-placement="left" title="' + d[i].title + '"  href="javascript:load(\'' + d[i].href + '\',\'' + d[i].title + '\')">' +
                    subb + "</a></li>");
            }
        },
        error: function (a, b, c) {
            alert('No documents.')
        }
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
        var string = titolo;
        var sub = string.substr(0, 26);
        $("#tabs").append('<li id="doc' + titolo + '" class="active"><input type="hidden" name="' + titolo + '" value="'
            + titolo + '"></input><a href="javascript:reload(\'' + file + '\');">' + sub + '</a></li>');
        //$('#doc'+titolo+'').addClass('active');
        $.ajax({
            method: 'GET',
            url: 'article/' + file,
            success: function (d) {
                //  if   ($('[name="'+sub+'"]').val()==sub) {
                //}else{
                //}
                $('#current_article').html(d['body']);
                $('#doc' + titolo + '').addClass('active');
            },
            error: function (a, b, c) {
                alert('Cannot load file ' + file)
            }
        });
    }
}

function reload(file) {
    $.ajax({
        method: 'GET',
        url: 'article/' + file,
        success: function (d) {
            $('#current_article').html(d['body'])
        },
        error: function (a, b, c) {
            alert('Cannot load file ' + file)
        }
    });


}