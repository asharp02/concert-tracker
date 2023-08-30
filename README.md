# concert-tracker

The ultimate live music guide! Explore an artist's tour locations on an interactive map and get live travel times to each show 🎸
The idea for this project was sparked immediately after attending an amazing concert. I wanted to quickly see the closest shows on the same tour along
with an estimated travel time. This project achieves exactly that: a map populated with all of an artists' upcoming shows + an ordered list of closest shows to my current
location.

## Setup

Run the following commands to get this project working locally:

```
git clone https://github.com/asharp02/concert-tracker.git
```

Build the Docker image specified within the Dockerfile:

```
docker build -t closest_concert . --no-cache
```

Run the container with this image (port 8000 is accessible on the host machine at port 8080):

```
docker run --name closest_concert -p 8080:8000 closest_concert
```

Visit http://localhost:8080 to view the app
