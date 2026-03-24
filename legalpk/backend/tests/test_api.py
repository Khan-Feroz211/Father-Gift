import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "app" in data


@pytest.mark.asyncio
class TestAuth:
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newadvocate@legalpk.test",
                "password": "SecurePass123!",
                "full_name": "New Advocate",
                "bar_number": "SHC-2024-002",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newadvocate@legalpk.test"
        assert data["full_name"] == "New Advocate"
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: dict):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "testadvocate@legalpk.test",
                "password": "AnotherPass123!",
                "full_name": "Duplicate User",
            },
        )
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    async def test_login_success(self, client: AsyncClient, test_user: dict):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "testadvocate@legalpk.test", "password": "TestPass123!"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user: dict):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "testadvocate@legalpk.test", "password": "WrongPass!"},
        )
        assert resp.status_code == 401

    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "testadvocate@legalpk.test"
        assert data["full_name"] == "Test Advocate"

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestCases:
    async def test_create_case(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/api/v1/cases/",
            json={
                "title": "State vs. Ahmad Khan",
                "case_type": "criminal",
                "status": "active",
                "case_number": "FIR-2024-001",
                "court_name": "Sessions Court Lahore",
                "facts": "The accused was apprehended at the crime scene.",
                "legal_issues": "Bail application under section 497 CrPC",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "State vs. Ahmad Khan"
        assert data["case_type"] == "criminal"
        assert data["status"] == "active"
        assert "id" in data
        return data

    async def test_list_cases(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/cases/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)

    async def test_get_case(self, client: AsyncClient, auth_headers: dict):
        # Create first
        create_resp = await client.post(
            "/api/v1/cases/",
            json={"title": "Civil Case Test", "case_type": "civil", "status": "pending"},
            headers=auth_headers,
        )
        case_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/cases/{case_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == case_id

    async def test_update_case(self, client: AsyncClient, auth_headers: dict):
        create_resp = await client.post(
            "/api/v1/cases/",
            json={"title": "Update Test Case", "case_type": "family", "status": "active"},
            headers=auth_headers,
        )
        case_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/v1/cases/{case_id}",
            json={"status": "disposed", "notes": "Case resolved by compromise"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "disposed"

    async def test_delete_case(self, client: AsyncClient, auth_headers: dict):
        create_resp = await client.post(
            "/api/v1/cases/",
            json={"title": "Delete Test Case", "case_type": "other", "status": "active"},
            headers=auth_headers,
        )
        case_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/v1/cases/{case_id}", headers=auth_headers)
        assert resp.status_code == 204

        # Confirm deleted
        get_resp = await client.get(f"/api/v1/cases/{case_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_filter_cases_by_status(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/cases/?status=active", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        for item in data["items"]:
            assert item["status"] == "active"


@pytest.mark.asyncio
class TestClients:
    async def test_create_client(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/api/v1/clients/",
            json={
                "full_name": "Muhammad Ali",
                "cnic": "3520212345678",
                "phone": "+923001234567",
                "address": "123 Main Street, Lahore",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["full_name"] == "Muhammad Ali"
        assert data["cnic"] == "3520212345678"

    async def test_list_clients(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/clients/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert isinstance(data["items"], list)

    async def test_search_clients(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/clients/?search=Ali", headers=auth_headers)
        assert resp.status_code == 200

    async def test_update_client(self, client: AsyncClient, auth_headers: dict):
        create_resp = await client.post(
            "/api/v1/clients/",
            json={"full_name": "Update Client Test"},
            headers=auth_headers,
        )
        client_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/v1/clients/{client_id}",
            json={"phone": "+923339876543"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["phone"] == "+923339876543"

    async def test_delete_client(self, client: AsyncClient, auth_headers: dict):
        create_resp = await client.post(
            "/api/v1/clients/",
            json={"full_name": "Delete Client Test"},
            headers=auth_headers,
        )
        client_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/v1/clients/{client_id}", headers=auth_headers)
        assert resp.status_code == 204
