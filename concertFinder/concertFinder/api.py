from datetime import datetime, timedelta
from ninja import NinjaAPI
from concertFinder.mongo_setup import collection
import requests
import environ

api = NinjaAPI()

env = environ.Env()
environ.Env.read_env()


@api.get("/events")
def events(request, artist_name):
    response = {"status": 200, "events": []}
    record = collection.find_one({"artist_name": artist_name})
    if record:
        response["events"] = record["events"]
    return response
