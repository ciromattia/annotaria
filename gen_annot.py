# !/usr/local/bin/python
# -*- coding: utf-8 -*-

from os.path import basename, dirname, realpath, splitext
import glob
from rdflib import Graph, Namespace, Literal
from rdflib.namespace import DC, DCTERMS, FOAF, RDF, RDFS, SKOS, XSD

AO = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/")
AON = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/annotation/")
AOP = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/person/")
CITO = Namespace("http://purl.org/spar/cito/")
FABIO = Namespace("http://purl.org/spar/fabio/")
FRBR = Namespace("http://purl.org/vocab/frbr/core#")
OA = Namespace("http://www.w3.org/ns/oa#")
SCHEMA = Namespace("http://schema.org/")
SEM = Namespace("http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#")
initNS = {'ao': AO, 'aon': AON, 'aop': AOP, 'cito': CITO, 'dc': DC, 'dcterms': DCTERMS, 'fabio': FABIO, 'foaf': FOAF,
          'frbr': FRBR, 'oa': OA, 'rdf': RDF, 'rdfs': RDFS, 'schema': SCHEMA, 'sem': SEM, 'skos': SKOS, 'xsd': XSD}

graph = Graph()
for ns in initNS:
    graph.bind(ns, initNS[ns])

path = dirname(realpath(__file__))
for f in glob.glob(path + "/annotaria/articles/*.html"):
    if basename(f) != "index.html":  # skip index
        docname, docext = splitext(basename(f))
        item = AO[basename(f)]
        work = AO[docname]
        expression = AO[docname + '_ver1']
        graph.add((work, RDF.type, FABIO.Work))
        graph.add((work, FABIO.hasPortrayal, item))
        graph.add((work, FRBR.realization, expression))
        graph.add((expression, RDF.type, FABIO.Expression))
        graph.add((expression, FABIO.hasRepresentation, item))
        graph.add((item, RDF.type, FABIO.Item))

# add some people
p = AOP['ciromattia-gonano']
graph.add((p, SCHEMA.email, Literal('ciromattia@gmail.com')))
graph.add((p, FOAF.name, Literal('Ciro Mattia Gonano')))
p = AOP['fabio-vitali']
graph.add((p, SCHEMA.email, Literal('fabio@cs.unibo.it')))
graph.add((p, FOAF.name, Literal('Fabio Vitali')))
p = AOP['pedro']
graph.add((p, FOAF.name, Literal('Pedro Madrigal')))



graph.serialize('test_annotations.ttl', format='turtle')