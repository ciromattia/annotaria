# !/usr/local/bin/python
# -*- coding: utf-8 -*-

from rdflib import Namespace, Literal, URIRef
from rdflib.namespace import DCTERMS, FOAF, RDF, RDFS, SKOS, XSD
from uuid import uuid4
from os.path import splitext

AO = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/")
AOP = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/person/")
AON = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/annotation/")
CITO = Namespace("http://purl.org/spar/cito/")
DBPEDIA = Namespace("http://dbpedia.org/resource/")
FABIO = Namespace("http://purl.org/spar/fabio/")
FRBR = Namespace("http://purl.org/vocab/frbr/core#")
OA = Namespace("http://www.w3.org/ns/oa#")
SCHEMA = Namespace("http://schema.org/")
SEM = Namespace("http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#")

map_type_to_predicate = {
    'hasAuthor': DCTERMS.creator,
    'hasPublisher': DCTERMS.publisher,
    'hasPublicationYear': FABIO.hasPublicationYear,
    'hasTitle': DCTERMS.title,
    'hasAbstract': DCTERMS.abstract,
    'hasShortTitle': FABIO.hasShortTitle,
    'hasComment': SCHEMA.comment,
    'denotesPerson': SEM.denotes,
    'denotesPlace': SEM.denotes,
    'denotesDisease': SEM.denotes,
    'hasSubject': FABIO.hasSubjectTerm,
    'relatesTo': SKOS.related,
    'hasClarityScore': AO.hasClarityScore,
    'hasOriginalityScore': AO.hasOriginalityScore,
    'hasFormattingScore': AO.hasFormattingScore,
    'cites': CITO.cites
}

map_type_to_label = {
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


class Annotation:
    def __init__(self):
        # init fields
        self.item = self.work = self.expression = None
        self.annotation = {
            "type": None,
            "label": None,
            "body": {
                "label": None,
                "subject": None,
                "predicate": None,
                "object": None
            },
            "target": {
                "source": None,
                "start_id": None,
                "start_off": None,
                "end_off": None
            },
            "provenance": {
                "author": {
                    "id": None,
                    "name": None,
                    "email": None
                },
                "time": None
            }
        }

    # Takes an array and parses it into our object
    def parse_json(self, annotation):
        for key in annotation:
            self.annotation[key] = annotation[key]
        pass

    def parse_rdf(self, annotation_rdf):
        if annotation_rdf['label'] != 'None':
            self.annotation['label'] = annotation_rdf['label']
        elif annotation_rdf['type'] != 'None':
            self.annotation['label'] = map_type_to_label[annotation_rdf['type']]
        self.annotation['type'] = annotation_rdf['type']
        # provenance
        self.annotation['provenance']['author']['id'] = annotation_rdf['author']
        self.annotation['provenance']['author']['name'] = annotation_rdf['author_fullname']
        if annotation_rdf['author_email'] != 'None':
            self.annotation['provenance']['author']['email'] = annotation_rdf['author_email']
        self.annotation['provenance']['time'] = annotation_rdf['created']
        # target
        self.annotation['target']['source'] = annotation_rdf['target']
        # if 'target_start' is None it's a global annotation (no fragment selection)
        if annotation_rdf['target_start'] != 'None':
            self.annotation['target']['start_id'] = annotation_rdf['target_start']
            self.annotation['target']['start_off'] = annotation_rdf['target_startoff']
            self.annotation['target']['end_off'] = annotation_rdf['target_endoff']
        # body
        self.annotation['body']['subject'] = annotation_rdf['subject']
        self.annotation['body']['predicate'] = annotation_rdf['predicate']
        self.annotation['body']['object'] = annotation_rdf['object']
        if annotation_rdf['obj_label'] != 'None':
            self.annotation['body']['label'] = annotation_rdf['obj_label']
        return self

    def to_dict(self):
        return self.annotation

    # Returns an RDF object
    def add_to_graph(self, graph):
        # build FRBR
        anno_id = str(uuid4())
        docname, docext = splitext(self.annotation['target']['source'])
        self.item = AO[self.annotation['target']['source']]
        self.work = AO[docname]
        self.expression = AO[docname + '_ver1']
        graph.add((self.work, RDF.type, FABIO.Work))
        graph.add((self.work, FABIO.hasPortrayal, self.item))
        graph.add((self.work, FRBR.realization, self.expression))
        graph.add((self.expression, RDF.type, FABIO.Expression))
        graph.add((self.expression, FABIO.hasRepresentation, self.item))
        graph.add((self.item, RDF.type, FABIO.Item))

        # build annotation
        anno = AON[anno_id]
        graph.add((anno, AO.type, Literal(self.annotation['type'])))
        graph.add((anno, RDFS.label, Literal(self.annotation['label'])))

        # set PROVENANCE
        graph.add((anno, RDF.type, OA.Annotation))
        graph.add((anno, OA.annotatedAt, Literal(self.annotation['provenance']['time'])))
        author = AOP[self.annotation['provenance']['author']['id']]
        graph.add((author, FOAF.name, Literal(self.annotation['provenance']['author']['name'])))
        if self.annotation['provenance']['author']['email'] is not None:
            graph.add((author, SCHEMA.email, Literal(self.annotation['provenance']['author']['email'])))
        graph.add((anno, OA.annotatedBy, author))

        # set TARGET
        # if 'start_id' is None it's a global annotation (no fragment selection)
        if self.annotation['target']['start_id'] is not None:
            resource = AON[anno_id + "_target"]
            graph.add((resource, RDF.type, OA.SpecificResource))
            selector = AON[anno_id + "_selector"]
            graph.add((selector, RDF.type, OA.FragmentSelector))
            graph.add((selector, RDF.value, Literal(self.annotation['target']['start_id'])))
            graph.add((selector, OA.start, Literal(self.annotation['target']['start_off'],
                                                   datatype=XSD.nonNegativeIntegeroa)))
            graph.add((selector, OA.end, Literal(self.annotation['target']['end_off'],
                                                 datatype=XSD.nonNegativeIntegeroa)))
            graph.add((resource, OA.hasSelector, selector))
            graph.add((resource, OA.hasSource, self.item))
            graph.add((anno, OA.hasTarget, resource))
        else:
            graph.add((anno, OA.hasTarget, self.item))

        # build BODY upon annotation type
        (s, p, o) = self.get_resources_upon_type()
        reifiedstmt = AON[anno_id + "_body"]
        graph.add((reifiedstmt, RDF.type, RDF.Statement))
        graph.add((reifiedstmt, RDF.subject, s))
        graph.add((reifiedstmt, RDF.predicate, p))
        graph.add((reifiedstmt, RDF.object, o))
        if self.annotation['body']['label'] is not None:
            graph.add((reifiedstmt, RDFS.label, self.annotation['body']['label']))
        graph.add((anno, OA.hasBody, reifiedstmt))
        return graph

    def get_resources_upon_type(self):
        p = map_type_to_predicate[self.annotation['type']]
        if self.annotation['type'] == "hasAuthor":
            s = self.work
        else:
            s = self.expression
        if self.annotation['type'] == "hasPublicationDate":
            o = Literal(self.annotation['body']['object'],
                        datatype=XSD.date)
        elif self.annotation['type'] == "hasAuthor" or \
                        self.annotation['type'] == "hasPublisher" or \
                        self.annotation['type'] == "denotesPerson" or \
                        self.annotation['type'] == "denotesPlace":
            o = URIRef(self.annotation['body']['object'])
        else:
            o = Literal(self.annotation['body']['object'])
        return [s, p, o]
