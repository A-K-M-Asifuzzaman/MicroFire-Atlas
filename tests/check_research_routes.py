"""HTTP smoke check, not a browser test. Run against a local production server with AI keys disabled."""
import json
import urllib.error
import urllib.request

BASE = "http://localhost:3420"
ROUTES = ["/", "/challenge", "/challenge?atm=ea-alt", "/mission", "/mission/brief", "/gaps?scenario=mission-moon-base", "/ask", "/atlas", "/compare", "/expedition", "/story", "/learn", "/methodology", "/saffire", "/sources", "/tour", "/analyze", "/analyze/saffire-vi-pmma", "/experiments/bass2-B19"]


def main():
    count = 0
    for route in ROUTES:
        with urllib.request.urlopen(BASE + route, timeout=30) as response:
            body = response.read().decode()
            assert response.status == 200, route
            if route.startswith("/gaps"):
                assert "Evidence Gain Planner" in body and "mission-moon-base" in body
        print("PASS", route)
        count += 1
    for name in ["mission-scenarios", "gap-registry", "candidate-experiments", "evidence-gain", "research-planning-graph"]:
        with urllib.request.urlopen(BASE + "/downloads/" + name + ".json", timeout=30) as response:
            obj = json.load(response)
            assert obj["schema_version"] == 1 and obj["status"] == "derived-research-planning"
            assert "attachment" in response.headers["Content-Disposition"]
            if name == "candidate-experiments":
                assert all(c["status"] == "hypothetical-research-question" and "outcome" not in c for c in obj["data"])
            if name == "evidence-gain":
                top = obj["data"][0]
                assert top["potentialDirectQuestions"] == top["currentDirectQuestions"] + len(top["affectedScenarioIds"])
        print("PASS download", name)
        count += 1
    for name in ["evidence-graph.json", "source-manifest.json"]:
        with urllib.request.urlopen(BASE + "/downloads/" + name, timeout=30) as response:
            json.load(response)
            assert response.status == 200
        print("PASS legacy download", name)
        count += 1
    try:
        urllib.request.urlopen(BASE + "/downloads/not-allowed.json")
    except urllib.error.HTTPError as error:
        assert error.code == 404
    else:
        raise AssertionError("Missing export allowlist")
    print("PASS unknown export 404")
    count += 1
    request = urllib.request.Request(BASE + "/api/ask", data=json.dumps({"question":"What happened in B19?"}).encode(), headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
        assert result.get("mode") == "evidence-only"
        assert result.get("evidence")
    print("PASS no-key Ask evidence-only")
    count += 1
    print(f"TOTAL {count} HTTP checks passed; browser interactions remain a separate gate.")


if __name__ == "__main__":
    main()
