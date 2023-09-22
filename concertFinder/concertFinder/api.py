from datetime import datetime, timedelta
from ninja import NinjaAPI
import requests

api = NinjaAPI()

YEAR_AGO_STR = (datetime.now() - timedelta(days=365)).isoformat()
EVENT_API_DOMAIN = "https://rest.bandsintown.com/artists"
DATE_RANGE = f"events"  # ?date={YEAR_AGO_STR}"


@api.get("/events")
def events(request, artist_name):
    payload = {"app_id": "483d381aff87901fe3a13652bd00a995"}
    r = requests.get(
        f"{EVENT_API_DOMAIN}/{artist_name}/{DATE_RANGE}", params=payload
    )  # consider switching to SeatGeek for tour name data
    data = {"status": r.status_code, "events": []}
    if r.status_code == 200:
        for event in r.json():
            show = {"past": False}  # default 'past' key to False
            event_datetime = datetime.strptime(event["starts_at"], "%Y-%m-%dT%H:%M:%S")
            if datetime.now() > event_datetime:
                # show["past"] = True # implement feature with previous dates
                continue

            show["venue"] = event["venue"]
            show["headliner"] = event["lineup"][0] if len(event["lineup"]) > 0 else ""
            show["openers"] = ", ".join(event["lineup"][1:])
            show["startsat"] = {}
            show["startsat"]["detailed"] = event_datetime.strftime(
                "%a %B %-d, %-I:%M %p"
            )
            show["startsat"]["day"] = event_datetime.strftime("%a")
            show["startsat"]["month"] = event_datetime.strftime("%b")
            show["startsat"]["date"] = event_datetime.strftime("%-d")
            show["startsat"]["time"] = event_datetime.strftime("%-I:%M %p")
            offers = event["offers"]
            show["url"] = offers[0].get("url") if offers else ""
            data["events"].append(show)

    return data
