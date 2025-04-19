from owlready2 import *
import importlib.util
import datetime

onto = get_ontology("file:////home/tomas/semantica/backend/ontology.owl").load()
data = get_ontology("file:////home/tomas/semantica/backend/rdf_dump.rdf").load()
onto.imported_ontologies.append(data)

spec = importlib.util.spec_from_file_location("custom_classes", "/home/tomas/semantica/backend/custom_classes.py")
custom_classes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(custom_classes)

custom_classes.define_custom_classes(onto)

sync_reasoner()

# Collect summary
total_classes = 0
total_instances = 0
classes_with_instances = 0
inferred_output = []

for cls in onto.classes():
    instances = list(cls.instances())
    total_classes += 1
    if not instances:
        continue
    classes_with_instances += 1
    total_instances += len(instances)

    output = [f"\nClass: {cls.name} ({len(instances)} instances)"]
    for inst in instances:
        output.append(f"  • Instance: {inst.name}")
        for prop in inst.get_properties():
            try:
                values = getattr(inst, prop.name, [])
                if values:
                    output.append(f"    - {prop.name}: {values}")
            except Exception as e:
                output.append(f"    - {prop.name}: <error: {e}>")
    inferred_output.append("\n".join(output))

# Print summary
print("=== Reasoning Summary ===")
print(f"Total Classes: {total_classes}")
print(f"Classes with Inferred Instances: {classes_with_instances}")
print(f"Total Inferred Instances: {total_instances}")
print("=========================")

# Print details
print("\nInferred Instances:")
for block in inferred_output:
    print(block)
