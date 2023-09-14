import environ

from django.shortcuts import render

env = environ.Env()
environ.Env.read_env()


def index(request):
    context = {"MAPBOX_API_KEY": env("MAPBOX_API_KEY")}
    return render(request, "concertFinder/index.html", context)
