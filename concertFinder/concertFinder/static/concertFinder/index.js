let currentEventMarkers = []
async function handleSubmit(event){
    const artistName = document.querySelector("#artist-name").value
    const myRequest = new Request(`/api/events?artist_name=${artistName}`);
    const response = await fetch(myRequest);
    const events = await response.json();
    populateMap(events);
}

const successCallback = (position) => {
    userLocation = position;
    drawMap(position)
};
const errorCallback = (error) => {
    console.log(error);
};
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

let submitBtn = document.querySelector("#submit-btn");
submitBtn.addEventListener("click", handleSubmit);

function drawMap(position){
    console.log(position.coords.latitude);
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXNoYXJwMDIiLCJhIjoiY2p5b3EwMTJyMTdoajNtbG1jZTJsaHJvYSJ9.KacigdAtzleu4QeM-dx7XQ';
    map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: [position.coords.longitude, position.coords.latitude], // starting position [lng, lat]
    zoom: 9, // starting zoom
    });
    let locationMarker = new mapboxgl.Marker({ "color": "#50C878" })
        .setLngLat([position.coords.longitude, position.coords.latitude])
        .addTo(map)
}

function populateMap(shows){
    currentEventMarkers.forEach((marker) => {
        marker.remove();
    })
    console.log(shows)
    shows.forEach((show) => {
        console.log(show.venue.latitude)
        console.log(show.venue.longitude)
        const marker1 = new mapboxgl.Marker()
        .setLngLat([show.venue.longitude, show.venue.latitude])
        .addTo(map);
        currentEventMarkers.push(marker1);
    })
}


/*
1. Handle zoom to fit markers
2. styling
3. add tooltips to each marker with event data
4. handle multiple shows at same venue
5. Add list of events ordered by distance from current location
6. Add hover effect + interactivity on list items


*/