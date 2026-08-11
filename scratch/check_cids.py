import json

with open('/home/aquistus/Documents/Project/drl_20261_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cids = []
for ct in data["CriteriaTypeDetailsLst"]:
    for cg in ct["CriteriaGroupDetailsLst"]:
        for c in cg["UserCriteriaDetailsLst"]:
            cids.append((c["CId"], c["CName"], c["CMaxPoint"]))

print(f"Total criteria count: {len(cids)}")
for cid, cname, maxp in cids:
    print(f"CId {cid}: {cname[:50]}... ({maxp}pt)")
