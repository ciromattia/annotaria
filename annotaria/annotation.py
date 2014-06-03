# !/usr/local/bin/python
# -*- coding: utf-8 -*-

import rdflib
from rdflib import Namespace, Literal, BNode, URIRef
from rdflib.namespace import DC, DCTERMS, FOAF, RDF, RDFS, XMLNS, XSD
from uuid import uuid4
from os.path import splitext

AO = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/")
AOP = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/person/")
AON = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/annotation/")
FABIO = Namespace("http://purl.org/spar/fabio/")
FRBR = Namespace("http://purl.org/vocab/frbr/core#")
OA = Namespace("http://www.w3.org/ns/oa#")
SCHEMA = Namespace("http://schema.org/")
SEM = Namespace("http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#")


class Annotation:
    def __init__(self):
        self.id = uuid4()
        # init fields
        self.label = self.type = self.created = self.text = self.uri = self.author =\
            self.author_fullname = self.target = None
        self.range = {}

    # Takes an array and parses it into our object
    def parse_json(self, annotation_json):
        for key in annotation_json:
            setattr(self, key, annotation_json[key])
        pass

    def parse_rdf(self, annotation_rdf):
        # ret.append({
        #     'author':           str(row[0]),
        #     'author_fullname':  str(row[1]),
        #     'created':             str(row[2]),
        #     'label':            str(row[3]),
        #     'type':             str(row[4]),
        #     'subject':             str(row[5]),
        #     'predicate':        str(row[6]),
        #     'object':           str(row[7]),
        #     'target_start':     str(row[8]),
        #     'target_end':       str(row[9]),
        #     'target_startoff':  int(row[10]),
        #     'target_endoff':    int(row[11]),
        # })
        if annotation_rdf['object'] != 'None':
            self.type = annotation_rdf['predicate']
        if annotation_rdf['label'] != 'None':
            self.label = annotation_rdf['label']
        elif annotation_rdf['type'] != 'None':
            self.label = annotation_rdf['type']
        self.created = annotation_rdf['created']
        self.author = annotation_rdf['author']
        self.author_fullname = annotation_rdf['author_fullname']
        self.uri = annotation_rdf['target']
        self.text = annotation_rdf['object']
        # we don't translate subject and predicate cause they are inferred by annotation type
        if annotation_rdf['target_start'] != 'None':
            self.target = 'fragment'
            self.range = {
                "start": annotation_rdf['target_start'],
                "end": annotation_rdf['target_end'],
                "startOffset": annotation_rdf['target_startoff'],
                "endOffset": annotation_rdf['target_endoff']
            }
        else:
            self.target = 'document'
        return self

    def get_json(self):
        return {
            "label": self.label,
            "type": self.type,
            "created": self.created,
            "text": self.text,
            "uri": self.uri,
            "range": self.range,
            "author": self.author,
            "author_fullname": self.author_fullname,
            "target": self.target
        }

    # Returns an RDF object
    def get_rdf(self, rdf):
        # build FRBR
        docname, docext = splitext(self.uri)
        item = AO[self.uri]
        work = AO[docname]
        expression = AO[docname + '_ver1']
        rdf.add((work, RDF.type, FABIO.Work))
        rdf.add((work, FABIO.hasPortrayal, item))
        rdf.add((work, FRBR.realization, expression))
        rdf.add((expression, RDF.type, FABIO.Expression))
        rdf.add((expression, FABIO.hasRepresentation, item))
        rdf.add((item, RDF.type, FABIO.Item))
        # build annotation
        # anno = BNode(self.id)
        anno = AON[self.id]
        rdf.add((anno, RDF.type, OA.Annotation))
        rdf.add((anno, OA.annotatedAt, Literal(self.created)))
        rdf.add((anno, OA.annotatedBy, AOP[self.author]))

        # set target
        if self.range:
            # resource = BNode(str(self.id) + "target")
            resource = AON[str(self.id) + "_target"]
            rdf.add((resource, RDF.type, OA.SpecificResource))
            # selector = BNode(str(self.id) + "selector")
            selector = AON[str(self.id) + "_selector"]
            rdf.add((selector, RDF.type, OA.FragmentSelector))
            rdf.add((selector, RDF.value, Literal(self.range['start'])))
            rdf.add((selector, OA.start, Literal(self.range['startOffset'], datatype=XSD.nonNegativeIntegeroa)))
            rdf.add((selector, OA.end, Literal(self.range['endOffset'], datatype=XSD.nonNegativeIntegeroa)))
            rdf.add((resource, OA.hasSelector, selector))
            rdf.add((resource, OA.hasSource, item))
            rdf.add((anno, OA.hasTarget, resource))
        else:
            rdf.add((anno, OA.hasTarget, item))

        # process specific annotation types
        if self.type == "Title":
            rdf.add((anno, RDFS.label, Literal("Title")))
            # reifiedstmt = BNode(str(self.id) + "body")
            reifiedstmt = AON[str(self.id) + "_body"]
            rdf.add((reifiedstmt, RDF.type, RDF.Statement))
            rdf.add((reifiedstmt, RDF.subject, expression))
            rdf.add((reifiedstmt, RDF.predicate, FABIO.hasTitle))
            rdf.add((anno, OA.hasBody, reifiedstmt))
        elif self.type == "Subject":
            rdf.add((anno, RDFS.label, Literal("Subject")))
            # reifiedstmt = BNode(str(self.id) + "body")
            reifiedstmt = AON[str(self.id) + "_body"]
            rdf.add((reifiedstmt, RDF.type, RDF.Statement))
            rdf.add((reifiedstmt, RDF.subject, expression))
            rdf.add((reifiedstmt, RDF.object, URIRef(self.text)))
            rdf.add((reifiedstmt, RDF.predicate, FABIO.hasSubjectTerm))
            rdf.add((anno, OA.hasBody, reifiedstmt))
        elif self.type == "Comment":
            rdf.add((anno, RDFS.label, Literal("Comment")))
            # reifiedstmt = BNode(str(self.id) + "body")
            reifiedstmt = AON[str(self.id) + "_body"]
            rdf.add((reifiedstmt, RDF.type, RDF.Statement))
            rdf.add((reifiedstmt, RDF.subject, work))
            rdf.add((reifiedstmt, RDF.object, Literal(self.text)))
            rdf.add((reifiedstmt, RDF.predicate, SCHEMA.comment))
            rdf.add((anno, OA.hasBody, reifiedstmt))
        elif self.type == "Person":
            rdf.add((anno, RDFS.label, Literal("Person")))
            # reifiedstmt = BNode(str(self.id) + "body")
            reifiedstmt = AON[str(self.id) + "_body"]
            rdf.add((reifiedstmt, RDF.type, RDF.Statement))
            rdf.add((reifiedstmt, RDF.subject, AO[docname + '_ver1#']))
            rdf.add((reifiedstmt, RDF.object, URIRef(self.text)))
            rdf.add((reifiedstmt, RDF.predicate, SEM.denotes))
            rdf.add((anno, OA.hasBody, reifiedstmt))
        elif self.type == "Author":
            rdf.add((anno, AO.type, Literal("hasAuthor")))
            # reifiedstmt = BNode(str(self.id) + "body")
            reifiedstmt = AON[str(self.id) + "_body"]
            rdf.add((reifiedstmt, RDF.type, RDF.Statement))
            rdf.add((reifiedstmt, RDF.subject, work))
            rdf.add((reifiedstmt, RDF.object, AOP[self.text]))
            rdf.add((reifiedstmt, RDF.predicate, DCTERMS.creator))
            rdf.add((anno, OA.hasBody, reifiedstmt))

        return rdf
