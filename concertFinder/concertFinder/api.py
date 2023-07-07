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
        show = {}
        show["venue"] = event["venue"]
        show["lineup"] = event["lineup"]
        show["startsat"] = event["starts_at"]
        events.append(show)

    return events
