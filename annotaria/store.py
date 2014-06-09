# !/usr/local/bin/python
# -*- coding: utf-8 -*-

from os.path import basename
from rdflib import ConjunctiveGraph, Namespace, Literal
from rdflib.namespace import DC, DCTERMS, FOAF, RDF, RDFS, SKOS, XSD
from rdflib.plugins.stores.sparqlstore import SPARQLUpdateStore
from annotation import Annotation

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


class Store:
    def __init__(self, endpoint):
        self.endpoint = endpoint
        query_ep = self.endpoint + '/query'
        update_ep = self.endpoint + '/update'
        self.sparql = SPARQLUpdateStore(queryEndpoint=query_ep,
                                        update_endpoint=update_ep,
                                        bNodeAsURI=True)

    def store_annotations(self, annotations):
        for annotation in annotations:
            ann = Annotation()
            ann.parse_json(annotation)
            ann.add_to_graph(self.sparql)
        return

    def query_article(self, article):
        escaped = self.escape_sparql(article)
        ret = []
        query = """
        SELECT DISTINCT ?author ?author_fullname ?author_email
         ?date ?label ?type ?body_s ?body_p ?body_o ?body_l
         ?target_start ?target_startoffset ?target_endoffset
        WHERE {
            ?annotation rdf:type oa:Annotation ;
                oa:annotatedAt ?date ;
                oa:annotatedBy ?author .
            OPTIONAL { ?author foaf:name ?author_fullname }
            OPTIONAL { ?author schema:email ?author_email }
            OPTIONAL { ?annotation rdfs:label ?label }
            OPTIONAL { ?annotation ao:type ?type }
            OPTIONAL { ?annotation oa:hasBody ?body }
            OPTIONAL { ?body rdf:subject ?body_s }
            OPTIONAL { ?body rdf:predicate ?body_p }
            OPTIONAL { ?body rdf:object ?body_o }
            OPTIONAL { ?body rdfs:label ?body_l }
            { ?annotation oa:hasTarget ao:""" + escaped + """ }
             UNION
            { ?annotation oa:hasTarget ?bnode .
              ?bnode rdf:type oa:SpecificResource ;
                    oa:hasSource ao:""" + escaped + """ ;
                    oa:hasSelector ?selector .
              ?selector rdf:type oa:FragmentSelector ;
                    rdf:value ?target_start ;
                    oa:start ?target_startoffset ;
                    oa:end ?target_endoffset }
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            annotation = Annotation()
            annotation.parse_rdf({
                'target': article,
                'author': str(row[0]),
                'author_fullname': str(row[1]),
                'author_email': str(row[2]),
                'created': str(row[3]),
                'label': str(row[4]),
                'type': str(row[5]),
                'subject': str(row[6]),
                'predicate': str(row[7]),
                'object': str(row[8]),
                'obj_label': str(row[9]),
                'target_start': str(row[10]),
                'target_startoff': int(row[11]) if row[11] is not None else None,
                'target_endoff': int(row[12]) if row[12] is not None else None,
            })
            ret.append(annotation.to_dict())
        return ret

    def query_authors(self):
        authors = []
        query = """
        SELECT DISTINCT ?author ?author_fullname ?author_email
        WHERE {
            ?author foaf:name ?author_fullname .
            OPTIONAL { ?author schema:email ?author_email }
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            authors.append({
                'author_id': str(row[0]),
                'author_fullname': str(row[1]),
                'author_email': str(row[2])
            })
        return authors

    # Inserts a new author.
    # Expects a dict:
    # {
    #   'author_id': ...,
    #   'author_fullname': ...,
    #   'author_email': ...
    # }
    def insert_author(self, author):
        # query_string = 'INSERT DATA { ' +\
        #                author['author_id'] + ' ' + FOAF.name + ' ' + author['author_fullname']
        # if 'author_email' in author:
        #     query_string += ' ; ' + SCHEMA.email + ' ' + author['author_email']
        # query_string += ' . };'
        # self.sparql.update(query=query_string, initNs=initNS)
        a = AOP[author['author_id']]
        self.sparql.add((a, FOAF.name, Literal(author['author_fullname'])))
        if 'author_email' in author:
            self.sparql.add((a, SCHEMA.email, Literal(author['author_email'])))
        return 'OK'

    @staticmethod
    def init_graph():
        rdf = ConjunctiveGraph()
        for ns in initNS:
            rdf.bind(ns, initNS[ns])
        return rdf

    @staticmethod
    def escape_sparql(string):
        return string.replace('(', '\(').replace(')', '\)')
