import kuzu

def process_graph_data(result):
    results = result.get_as_df()

    nodes = {}
    links = []

    for _, row in results.iterrows():
        m = row["m"]
        r = row["r"]
        n = row["n"]

        m_id = m["movieId"]

        if m_id not in nodes:
            nodes[m_id] = {
                "id": m_id,
                "labels": ["Movie"],
                "properties": {"title": m["title"], "year": m["year"], "genres": m["genres"]}
            }

        n_id = n["userId"]

        if n_id not in nodes:
            nodes[n_id] = {
                "id": n_id,
                "labels": ["User"],
                "properties": {}
            }

        links.append({
            "source": m_id,
            "target": n_id,
            "type": r["_label"]
        })

    return {"nodes": list(nodes.values()), "links": links}
    

def construct_query(year=None, operator='>', limit=100):
    return f"""MATCH (m:Movie) 
               WHERE m.year {operator} {year} 
               MATCH (m)-[r]-(n)
               RETURN m, r, n
               LIMIT {limit}"""