"""Small fixed dataset for running/testing the agent on its own."""

SAMPLE_TRANSACTIONS = [
    {
        "id": "TXN-88213", "account": "AC-4471", "amount": 12500.0,
        "location": "Lagos, NG", "method": "Wire", "risk": 91,
        "status": "flagged", "time": "09:41:12", "cluster": 1,
        "_features": {"amount": 12500.0, "hour": 3, "distance_from_home": 410.2,
                      "is_new_location": 1, "velocity": 7, "is_foreign": 1},
    },
    {
        "id": "TXN-88214", "account": "AC-2290", "amount": 320.5,
        "location": "Austin, US", "method": "UPI", "risk": 12,
        "status": "cleared", "time": "09:42:03", "cluster": 0,
        "_features": {"amount": 320.5, "hour": 14, "distance_from_home": 3.1,
                      "is_new_location": 0, "velocity": 1, "is_foreign": 0},
    },
    {
        "id": "TXN-88215", "account": "AC-4471", "amount": 8900.0,
        "location": "Manila, PH", "method": "Wire", "risk": 78,
        "status": "review", "time": "09:44:51", "cluster": 1,
        "_features": {"amount": 8900.0, "hour": 4, "distance_from_home": 512.7,
                      "is_new_location": 1, "velocity": 5, "is_foreign": 1},
    },
    {
        "id": "TXN-88216", "account": "AC-1038", "amount": 54.99,
        "location": "Berlin, DE", "method": "Card", "risk": 4,
        "status": "cleared", "time": "09:45:22", "cluster": 0,
        "_features": {"amount": 54.99, "hour": 13, "distance_from_home": 1.4,
                      "is_new_location": 0, "velocity": 1, "is_foreign": 0},
    },
    {
        "id": "TXN-88219", "account": "AC-6610", "amount": 4100.0,
        "location": "Mumbai, IN", "method": "Card", "risk": 63,
        "status": "review", "time": "09:48:15", "cluster": 2,
        "_features": {"amount": 4100.0, "hour": 23, "distance_from_home": 45.0,
                      "is_new_location": 1, "velocity": 3, "is_foreign": 0},
    },
]
