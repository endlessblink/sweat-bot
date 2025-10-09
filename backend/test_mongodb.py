import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test_mongodb():
    try:
        # Connect to MongoDB
        mongo_url = "mongodb://sweatbot:secure_password@localhost:8002/"
        print(f"Connecting to MongoDB at: {mongo_url}")

        client = AsyncIOMotorClient(mongo_url)
        db = client["sweatbot_conversations"]
        collection = db["conversations"]

        # Test document
        test_doc = {
            "session_id": "test_from_python",
            "user_id": "test_user",
            "messages": [
                {
                    "role": "user",
                    "content": "Test message from Python script",
                    "timestamp": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": {}
        }

        print(f"Inserting test document: {test_doc}")
        result = await collection.insert_one(test_doc)
        print(f"Insert result: {result.inserted_id}")

        # Verify insertion
        count = await collection.count_documents({})
        print(f"Total documents in collection: {count}")

        # Retrieve the document
        doc = await collection.find_one({"session_id": "test_from_python"})
        print(f"Retrieved document: {doc}")

        print("✅ MongoDB test successful!")

    except Exception as e:
        print(f"❌ MongoDB test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mongodb())
