# !/usr/local/bin/python
# -*- coding: utf-8 -*-

from rfc3987 import parse
from rdflib import Graph, Namespace, Literal, URIRef
from rdflib.namespace import DC, DCTERMS, FOAF, RDF, RDFS, SKOS, XSD
from rdflib.plugins.stores.sparqlstore import SPARQLUpdateStore
from annotation import Annotation

AO = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/")
AON = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/annotation/")
AOP = Namespace("http://vitali.web.cs.unibo.it/AnnOtaria/person/")
CITO = Namespace("http://purl.org/spar/cito/")
DBPEDIA = Namespace("http://dbpedia.org/resource/")
FABIO = Namespace("http://purl.org/spar/fabio/")
FRBR = Namespace("http://purl.org/vocab/frbr/core#")
OA = Namespace("http://www.w3.org/ns/oa#")
SCHEMA = Namespace("http://schema.org/")
SEM = Namespace("http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#")
BNCF = Namespace("http://purl.org/bncf/")
initNS = {'ao': AO, 'aon': AON, 'aop': AOP, 'cito': CITO, 'dc': DC, 'dcterms': DCTERMS, 'dbpedia': DBPEDIA,
          'fabio': FABIO, 'foaf': FOAF, 'frbr': FRBR, 'oa': OA, 'rdf': RDF, 'rdfs': RDFS, 'schema': SCHEMA, 'sem': SEM,
          'skos': SKOS, 'xsd': XSD}


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
                'author': row[0].encode('utf-8'),
                'author_fullname': row[1].encode('utf-8') if row[1] is not None else None,
                'author_email': row[2].encode('utf-8') if row[2] is not None else None,
                'created': row[3].encode('utf-8') if row[3] is not None else None,
                'label': row[4].encode('utf-8') if row[4] is not None else None,
                'type': row[5].encode('utf-8') if row[5] is not None else None,
                'subject': row[6].encode('utf-8') if row[6] is not None else None,
                'predicate': row[7].encode('utf-8') if row[7] is not None else None,
                'object': row[8].encode('utf-8') if row[8] is not None else None,
                'obj_label': row[9].encode('utf-8') if row[9] is not None else None,
                'target_start': row[10].encode('utf-8') if row[10] is not None else None,
                'target_startoff': int(row[11]) if row[11] is not None else None,
                'target_endoff': int(row[12]) if row[12] is not None else None
            })
            ret.append(annotation.to_dict())
        return ret

    def query_authors(self):
        authors = []
        query = """
        SELECT DISTINCT ?author ?author_fullname ?author_email
        WHERE {
            ?author a foaf:Person ;
                foaf:name ?author_fullname .
            OPTIONAL { ?author schema:email ?author_email }
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            authors.append({
                'author_id': row[0].encode('utf-8'),
                'author_fullname': row[1].encode('utf-8'),
                'author_email': row[2].encode('utf-8') if row[2] is not None else None,
            })
        return authors

    # Inserts a new author.
    # Expects a dict:
    # {
    # 'author_id': ...,
    # 'author_fullname': ...,
    # 'author_email': ...
    # }
    def insert_author(self, author):
        try:
            parse(author['author_id'], rule='IRI')
            a = author['author_id']
        except ValueError:
            a = AOP[author['author_id']]
        self.sparql.add((a, RDF.type, FOAF.Person))
        self.sparql.add((a, FOAF.name, Literal(author['author_fullname'])))
        if 'author_email' in author:
            self.sparql.add((a, SCHEMA.email, Literal(author['author_email'])))
        return 'OK'

    def query_organization(self):
        ret = []
        query = """
        SELECT DISTINCT ?node ?label
        WHERE {
            ?node a foaf:Organization ;
                foaf:name ?label .
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            ret.append({
                'id': row[0].encode('utf-8'),
                'label': row[1].encode('utf-8')
            })
        return ret

    def query_place(self):
        ret = []
        query = """
        SELECT DISTINCT ?node ?label
        WHERE {
            ?node a dbpedia:Place ;
                rdfs:label ?label .
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            ret.append({
                'id': row[0].encode('utf-8'),
                'label': row[1].encode('utf-8')
            })
        return ret

    def query_concept(self):
        ret = []
        query = """
        SELECT DISTINCT ?node ?label
        WHERE {
            ?node a skos:Concept ;
                rdfs:label ?label .
        }
        """
        for row in self.sparql.query(query, initNs=initNS):
            ret.append({
                'id': row[0].encode('utf-8'),
                'label': row[1].encode('utf-8')
            })
        return ret

    def insert_organization(self, data):
        try:
            parse(data['id'], rule='IRI')
            a = URIRef(data['id'])
        except ValueError:
            a = AOP[data['id']]
        self.sparql.add((a, RDF.type, FOAF.Organization))
        self.sparql.add((a, FOAF.name, Literal(data['label'])))
        return 'OK'

    def insert_place(self, data):
        try:
            parse(data['id'], rule='IRI')
            a = URIRef(data['id'])
        except ValueError:
            a = DBPEDIA[data['id']]
        self.sparql.add((a, RDF.type, DBPEDIA.Place))
        self.sparql.add((a, RDFS.label, Literal(data['label'])))
        return 'OK'

    def insert_concept(self, data):
        try:
            parse(data['id'], rule='IRI')
            a = URIRef(data['id'])
        except ValueError:
            a = BNCF[data['id']]
        self.sparql.add((a, RDF.type, SKOS.Concept))
        self.sparql.add((a, RDFS.label, Literal(data['label'])))
        return 'OK'

    @staticmethod
    def init_graph():
        rdf = Graph()
        for ns in initNS:
            rdf.bind(ns, initNS[ns])
        return rdf

    @staticmethod
    def escape_sparql(string):
        return string.replace('(', '\(').replace(')', '\)')
