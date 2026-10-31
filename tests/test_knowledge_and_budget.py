import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.routes.knowledge import rank_vulnerabilities

@pytest.mark.asyncio
async def test_budget_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/budget")
        assert response.status_code == 200
        data = response.json()
        assert "budget_limit_usd" in data
        assert "remaining_usd" in data
        assert "percent_used" in data
        assert data["budget_limit_usd"] > 0

@pytest.mark.asyncio
async def test_knowledge_graph_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/knowledge-graph")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert "stats" in data
        assert "top_vulnerabilities" in data["stats"]
        assert isinstance(data["stats"]["top_vulnerabilities"], list)
        assert len(data["nodes"]) > 0
        assert len(data["edges"]) > 0

@pytest.mark.asyncio
async def test_knowledge_graph_stats_include_top_vulnerabilities():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/knowledge-graph")
        assert response.status_code == 200
        vulnerabilities = response.json()["stats"]["top_vulnerabilities"]
        assert isinstance(vulnerabilities, list)
        for vulnerability in vulnerabilities:
            assert set(vulnerability) == {"name", "risk"}

def test_rank_vulnerabilities_orders_by_breaches_and_skips_clean_patterns():
    patterns = [
        {"label": "Clean", "rule": "rule_clean"},
        {"label": "Once", "rule": "rule_once"},
        {"label": "Often", "rule": "rule_often"},
    ]
    counts = {"rule_once": 1, "rule_often": 3}

    assert rank_vulnerabilities(patterns, counts) == [
        {"name": "Often", "risk": "3 breaches"},
        {"name": "Once", "risk": "1 breach"},
    ]

@pytest.mark.asyncio
async def test_scenarios_catalog():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/runs/scenarios/catalog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5
        assert "id" in data[0]
        assert "language" in data[0]

@pytest.mark.asyncio
async def test_sarvam_verification_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create a run and call or inspect existing
        runs_res = await ac.get("/runs")
        assert runs_res.status_code == 200
        runs = runs_res.json()
        if runs:
            run_id = runs[0]["id"]
            run_detail = await ac.get(f"/runs/{run_id}")
            calls = run_detail.json().get("calls", [])
            if calls:
                call_id = calls[0]["id"]
                sarvam_res = await ac.post(f"/calls/{call_id}/sarvam-verify")
                assert sarvam_res.status_code == 200
                sdata = sarvam_res.json()
                assert "sarvam_indic_stt" in sdata
                assert "english_translation" in sdata
                assert "cultural_etiquette_audit" in sdata
