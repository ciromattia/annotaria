# !/usr/local/bin/python
# -*- coding: utf-8 -*-

from rdflib import ConjunctiveGraph, Namespace
from rdflib.namespace import DC, DCTERMS, FOAF, RDF, RDFS, XSD
from rdflib.plugins.stores.sparqlstore import SPARQLUpdateStore
from annotation import Annotation

AO = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/")
AON = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/annotation/")
AOP = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/person/")
FABIO = Namespace("http://purl.org/spar/fabio/")
FRBR = Namespace("http://purl.org/vocab/frbr/core#")
OA = Namespace("http://www.w3.org/ns/oa#")
SCHEMA = Namespace("http://schema.org/")
SEM = Namespace("http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#")
initNS = {'ao': AO, 'aon': AON, 'aop': AOP, 'dc': DC, 'dcterms': DCTERMS, 'fabio': FABIO, 'foaf': FOAF, 'frbr': FRBR,
          'oa': OA, 'rdf': RDF, 'rdfs': RDFS, 'schema': SCHEMA, 'sem': SEM, 'xsd': XSD}


class Store:
    def __init__(self, endpoint):
        self.endpoint = endpoint
        query_ep = self.endpoint + '/query'
        update_ep = self.endpoint + '/query'
        self.sparql = SPARQLUpdateStore(queryEndpoint=query_ep,
                                        update_endpoint=update_ep,
                                        bNodeAsURI=True)

    def store_annotations(self, annotations):
        graph = self.init_graph()
        for annotation in annotations:
            ann = Annotation(annotation)
            ann.get_rdf(self.sparql)
        query_string = ""
        for subject, predicate, obj in graph.triples((None, None, None)):
            triple = "%s %s %s ." % (subject.n3(), predicate.n3(), obj.n3())
            query_string += "INSERT DATA { %s };\n" % triple
        r = self.sparql.update(query_string, initNs=initNS)
        content = r.read()  # we expect no content
        if r.status not in (200, 204):
            raise Exception("Could not update: %d %s\n%s" % (
                r.status, r.reason, content))
        return

    def query_article(self, article):
        ret = []
        query = """
        SELECT DISTINCT ?annotation
        WHERE {
            ?annotation rdf:type oa:Annotation .
            {?annotation oa:hasTarget ao:""" + article + """ . }
             UNION
            {?annotation oa:hasTarget ?bnode .
             ?bnode rdf:type oa:SpecificResource ;
                    oa:hasSource ao:""" + article + """ . }
        }"
        """
        ret = self.sparql.query(query, initNs=initNS)
        return ret

    def query_annotation(self, annotation_id):
        return

    @staticmethod
    def init_graph():
        rdf = ConjunctiveGraph()
        for ns in initNS:
            rdf.bind(ns, initNS[ns])
        return rdf
