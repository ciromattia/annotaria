# !/usr/local/bin/python
# -*- coding: utf-8 -*-

import json
import sys
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
          'oa': OA,
          'rdf': RDF, 'rdfs': RDFS, 'schema': SCHEMA, 'sem': SEM, 'xsd': XSD}


def main():
    json_data = open('annotations.json')

    data = json.load(json_data)
    json_data.close()

    sparql = SPARQLUpdateStore(queryEndpoint="http://localhost:3030/annotator/query",
                               update_endpoint="http://localhost:3030/annotator/update",
                               bNodeAsURI=True)

    graph = init_graph()

    for annotation in data['annotations']:
        ann = Annotation(annotation)
        ann.get_rdf(sparql)

    query_string = ""
    for subject, predicate, obj in graph.triples((None, None, None)):
        triple = "%s %s %s ." % (subject.n3(), predicate.n3(), obj.n3())
        query_string += "INSERT DATA { %s };\n" % triple
    r = sparql.update(query_string, initNs=initNS)
    content = r.read()  # we expect no content
    if r.status not in (200, 204):
        raise Exception("Could not update: %d %s\n%s" % (
            r.status, r.reason, content))
    return


def init_graph():
    rdf = ConjunctiveGraph()
    for ns in initNS:
        rdf.bind(ns, initNS[ns])
    return rdf


if __name__ == "__main__":
    main()
    sys.exit(0)