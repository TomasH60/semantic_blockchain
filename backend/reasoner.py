from owlready2 import *
from rdflib.namespace import RDF, RDFS, OWL
import importlib.util
import os
from config import BASE_DIR, INFERRED_DUMP


onto_path = os.path.join(BASE_DIR, "config", "ontology.owl")
data_path = os.path.join(BASE_DIR, "dump", "rdf_dump.rdf")
custom_path = os.path.join(BASE_DIR, "classes", "custom_classes.py")

# Load ontologies
onto = get_ontology(f"file://{onto_path}").load()
data = get_ontology(f"file://{data_path}").load()

# Before reasoning: snapshot the original set of triples
original_triples = set(onto.world.as_rdflib_graph())

with onto:
    # Merge RDF dump
    for triple in data.world.as_rdflib_graph().triples((None, None, None)):
        onto.world.as_rdflib_graph().add(triple)

    # Custom OWL classes
    spec = importlib.util.spec_from_file_location("custom_classes", custom_path)
    custom_classes = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(custom_classes)
    custom_classes.define_custom_classes(onto)

    # Run reasoner, inject inferred axioms into `onto`
    sync_reasoner()

# After reasoning: get new set of triples
new_triples = set(onto.world.as_rdflib_graph())
inferred_triples = new_triples - original_triples

# Analyze inferred triples
inferred_types = [t for t in inferred_triples if t[1] == RDF.type]
inferred_subclasses = [t for t in inferred_triples if t[1] == RDFS.subClassOf]
inferred_equivalents = [t for t in inferred_triples if t[1] == OWL.equivalentClass]

# Print statistics
print("=== REASONING INFERENCES ===")
print(f"Total new inferred triples: {len(inferred_triples)}")
print(f"Inferred rdf:type (class memberships): {len(inferred_types)}")
print(f"Inferred rdfs:subClassOf (hierarchy): {len(inferred_subclasses)}")
print(f"Inferred owl:equivalentClass axioms: {len(inferred_equivalents)}")
print("=============================")

# Save
onto.save(file=INFERRED_DUMP, format="rdfxml")
print(f"Saved combined and reasoned ontology to: {INFERRED_DUMP}")
