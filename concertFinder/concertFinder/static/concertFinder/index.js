let currentEventMarkers = []
async function handleSubmit(event){
    const artistName = document.querySelector("#artist-input").value
    event.preventDefault();
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
    // Remove previously placed markers
    for (const marker of currentEventMarkers) {
        marker.remove()
    }
    
    shows.forEach((show) => {
        // create the popup
        let popupHTML = `<h2 class="headliner">${show.headliner}</h3>`
        if (show.openers != ""){
            popupHTML += `<h4 class="openers">${show.openers}</h4>`
        }
        popupHTML += `<div class="showDetails">`
        popupHTML += `<span class="startTime">${show.startsat}</span><br />`
        popupHTML += `<span class="venueName">${show.venue.name}</span><br />`
        popupHTML += `<span class="venueLocation">${show.venue.location}</span>`
        popupHTML += `</div>`


        const popup = new mapboxgl.Popup({
            offset: 25,
        }).setHTML(popupHTML)
        const el = document.createElement('div');
        el.className = 'marker';
        const marker1 = new mapboxgl.Marker(el)
            .setLngLat([show.venue.longitude, show.venue.latitude])
            .setPopup(popup)
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