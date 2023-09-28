from django.core.management.base import BaseCommand, CommandError, CommandParser
from datetime import datetime, timedelta

from concertFinder.mongo_setup import collection
import environ
import requests

env = environ.Env()
environ.Env.read_env()

MONGO_PASS = env("MONGO_PASS")
SG_CLIENT_ID = env("SG_CLIENT_ID")
SG_CLIENT_SECRET = env("SG_CLIENT_SECRET")
BANDSINTOWN_APP_ID = env("BANDSINTOWN_APP_ID")

SEATGEEK_API_URL = f"https://api.seatgeek.com/2/performers?client_id={SG_CLIENT_ID}&client_secret={SG_CLIENT_SECRET}&sort=score.desc&type=band"
BANDSINTOWN_API_URL = "https://rest.bandsintown.com/artists/"


class Command(BaseCommand):
    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--full-update", action="store_true")

    def handle(self, *args, **options):
        full_update = options["full_update"]
        for i in range(61, 80):
            print(i)
            seatgeek_request = requests.get(f"{SEATGEEK_API_URL}&per_page=50&page={i}")
            seatgeek_request.raise_for_status()
            top_artists = handle_sg_response(seatgeek_request.json(), full_update)
            print(top_artists)
            populate_mongo_events(top_artists)


def handle_sg_response(content, full_update):
    artists = []
    performers = content.get("performers")
    for artist in performers:
        name = artist["name"]
        if not full_update and collection.find_one({"artist_name": name}):
            continue
        artists.append(artist["name"])
    return artists


def populate_mongo_events(top_artists):
    payload = {"app_id": BANDSINTOWN_APP_ID}
    for artist in top_artists:
        bandsintown_request = requests.get(
            f"{BANDSINTOWN_API_URL}{artist}/events", params=payload
        )
        events_formatted = []
        if bandsintown_request.ok:
            events_formatted = parse_events(bandsintown_request.json())
        collection.update_one(
            {"artist_name": artist},
            {"$set": {"events": events_formatted}},
            upsert=True,
        )


def parse_events(events):
    formatted_events = []
    for event in events:
        show = {}
        date = datetime.strptime(event["starts_at"], "%Y-%m-%dT%H:%M:%S")
        show["venue"] = event["venue"]
        show["headliner"] = event["lineup"][0] if len(event["lineup"]) > 0 else ""
        show["openers"] = ", ".join(event["lineup"][1:])
        show["startsat"] = {}
        show["startsat"]["detailed"] = date.strftime("%a %B %-d %Y, %-I:%M %p")
        show["startsat"]["day"] = date.strftime("%a")
        show["startsat"]["month"] = date.strftime("%b")
        show["startsat"]["date"] = date.strftime("%-d")
        show["startsat"]["time"] = date.strftime("%-I:%M %p")
        offers = event["offers"]
        show["url"] = offers[0].get("url") if offers else ""
        formatted_events.append(show)
    return formatted_events
