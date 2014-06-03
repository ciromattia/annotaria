import glob
import json
from os.path import basename, dirname, realpath
from BeautifulSoup import BeautifulSoup
from flask import request, g, redirect, Response, request, render_template, send_from_directory
from annotaria import app
from store import Store

app.config.from_object(__name__)

# Load default config and override config from an environment variable
app.config.update(dict(
    SPARQL_ENDPOINT="http://localhost:3030/annotaria",
    DEBUG=True
))
app.config.from_envvar('ANNOTARIA_SETTINGS', silent=True)


# We define our own jsonify rather than using flask.jsonify because we wish
# to jsonify arbitrary objects (e.g. index returns a list) rather than kwargs.
def jsonify(obj, *args, **kwargs):
    res = json.dumps(obj, indent=None if request.is_xhr else 2)
    return Response(res, mimetype='application/json', *args, **kwargs)


def parse_article(html):
    soup = BeautifulSoup(html)
    # fix img "src" attribute
    for img in soup.findAll('img'):
        img['src'] = 'articles/images/' + basename(img['src'])
    return {
        'title': soup.title.string,
        'body': str(soup.body)
    }


# ## ROUTING ###
# root
@app.route('/')
def root():
    return render_template('index.html')


# retrieve articles list
@app.route('/articles', methods=['GET'])
def get_articles():
    path = dirname(realpath(__file__))
    ret = []
    for f in glob.glob(path + "/articles/*.html"):
        if basename(f) != "index.html":  # skip index
            ret.append({
                'href': basename(f),
                'title': basename(f)
            })
    return jsonify(ret)


# retrieve a single article
@app.route('/article/<file_name>', methods=['GET'])
def get_article(file_name):
    try:
        path = dirname(realpath(__file__))
        with open(path + '/articles/' + file_name, 'r') as content_file:
            ret = parse_article(content_file.read())
    except Exception, e:
        raise e
    return jsonify(ret)


# proxy article images
@app.route('/articles/images/<file_name>', methods=['GET'])
def get_article_image(file_name):
    try:
        path = dirname(realpath(__file__))
        return send_from_directory(path + '/articles/images/', file_name)
    except Exception, e:
        raise e


# get all annotations for a single article
@app.route('/annotations/<article>', methods=['GET'])
def get_annotations(article):
    store = Store(app.config['SPARQL_ENDPOINT'])
    return jsonify(store.query_article(article))


# store a bunch of annotations in the triple store
@app.route('/annotations/', methods=['POST'])
def set_annotations():
    store = Store(app.config['SPARQL_ENDPOINT'])
    annotations = json.loads(request.form['annotations'])
    return jsonify(store.store_annotations(annotations))


# # get a single annotation
# @app.route('/annotations/<int:annotation_id>', methods=['GET'])
# def read_annotation(annotation_id):
#     store = Store(app.config['SPARQL_ENDPOINT'])
#     annotation = store.query_annotation(annotation_id)
#     if not annotation:
#         return jsonify('Annotation not found!', status=404)
#     return jsonify(annotation)
#
#
# # update a single annotation
# @app.route('/annotations/<int:annotation_id>', methods=['POST', 'PUT'])
# def update_annotation(annotation_id):
#     store = Store(app.config['SPARQL_ENDPOINT'])
#     annotation = store.query_annotation(annotation_id)
#     if not annotation:
#         return jsonify('Annotation not found! No update performed.', status=404)
#     return jsonify(annotation)
#
#
# # delete a single annotation
# @app.route('/annotations/<int:annotation_id>', methods=['DELETE'])
# def delete_annotation(annotation_id):
#     store = Store(app.config['SPARQL_ENDPOINT'])
#     annotation = store.query_annotation(annotation_id)
#     if not annotation:
#         return jsonify('Annotation not found. No delete performed.', status=404)
#     annotation.delete()
#     return '', 204
