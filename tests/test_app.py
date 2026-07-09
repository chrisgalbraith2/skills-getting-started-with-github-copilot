from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_unregister_participant_from_activity():
    response = client.post(
        "/activities/Chess Club/signup?email=test@mergington.edu"
    )
    assert response.status_code == 200

    unregister_response = client.delete(
        "/activities/Chess Club/unregister?email=test@mergington.edu"
    )
    assert unregister_response.status_code == 200
    assert "unregistered" in unregister_response.json()["message"].lower()
