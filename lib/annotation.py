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
    def __init__(self, annotation_src=None):
        self.id = uuid4()
        # init fields
        self.type = self.created = self.text = self.uri = self.user = self.target = None
        self.range = {}
        if annotation_src is not None:
            self.parse_dict(annotation_src)

    # Takes an array and parses it into our object
    def parse_dict(self, annotation_src):
        for key in annotation_src:
            setattr(self, key, annotation_src[key])
        pass

    def parse_rdf(self, annotation_rdf):
        pass

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
        rdf.add((anno, OA.annotatedBy, AOP[self.user]))

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
