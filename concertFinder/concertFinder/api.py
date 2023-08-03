from datetime import datetime
from ninja import NinjaAPI
import requests

api = NinjaAPI()


@api.get("/events")
def events(request, artist_name):
    payload = {"app_id": "483d381aff87901fe3a13652bd00a995"}
    r = requests.get(
        f"https://rest.bandsintown.com/artists/{artist_name}/events", params=payload
    )
    events = []
    for event in r.json():
        event_datetime = datetime.strptime(event["starts_at"], "%Y-%m-%dT%H:%M:%S")
        if datetime.now() > event_datetime:
            continue  # Do not display shows that have already taken place
        show = {}
        show["venue"] = event["venue"]
        show["headliner"] = event["lineup"][0] if len(event["lineup"]) > 0 else ""
        show["openers"] = ", ".join(event["lineup"][1:])
        show["startsat"] = event_datetime.strftime("%a %B %-m, %-I:%M %p")
        events.append(show)

    return events
