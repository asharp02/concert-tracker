const mapboxAccessToken = 'pk.eyJ1IjoiYXNoYXJwMDIiLCJhIjoiY2p5b3EwMTJyMTdoajNtbG1jZTJsaHJvYSJ9.KacigdAtzleu4QeM-dx7XQ'
let userLatitude =  null;
let userLongitude = null;

let currentEventMarkers = []
let userLocation = null;
async function handleSubmit(event){
    const artistName = document.querySelector("#artist-input").value
    event.preventDefault();
    const myRequest = new Request(`/api/events?artist_name=${artistName}`);
    const response = await fetch(myRequest);
    const events = await response.json();
    populateMap(events);
    handleListView(events);
}

const successCallback = (position) => {
    userLatitude = position.coords.latitude;
    userLongitude = position.coords.longitude;
    drawMap(position)
};
const errorCallback = (error) => {
    console.log(error);
};
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

let submitBtn = document.querySelector("#submit-btn");
submitBtn.addEventListener("click", handleSubmit);

function drawMap(){
    mapboxgl.accessToken = mapboxAccessToken;
    map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: [userLongitude, userLatitude], // starting position [lng, lat]
    zoom: 9, // starting zoom
    });
    let locationMarker = new mapboxgl.Marker({ "color": "#50C878" })
        .setLngLat([userLongitude, userLatitude])
        .addTo(map)
}

function populateMap(shows){
    // Remove previously placed markers
    for (const marker of currentEventMarkers) {
        marker.remove()
    }
    currId = 0;
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
        show.id = currId;
        currId++;

        const popup = new mapboxgl.Popup({
            offset: 25,
        }).setHTML(popupHTML)
        const el = document.createElement('div');
        el.className = 'marker';
        el.id = `marker-${currId}`;
        const marker1 = new mapboxgl.Marker(el)
            .setLngLat([show.venue.longitude, show.venue.latitude])
            .setPopup(popup)
            .addTo(map);
        currentEventMarkers.push(marker1);
    })
}
/*
* This function fetches the distance data for every venue currently in the 
* events list, then updates that venue object with the travel distance. An
* additional mapping (lngLatDistances) is used to map {long},{lat} to distances
* so that we only need to fetch the distance once per venue (in the case of multiple shows at one venue)
*/
async function getDistanceData(events){
    const lngLatDistances = new Map(); //mappings from event long,lat strings to distances response
    const userLngLat = `${userLongitude},${userLatitude}`;
    await Promise.all(events.map(async (event) => {
        const eventLngLat = `${event.venue.longitude},${event.venue.latitude}`
        if (lngLatDistances.has(eventLngLat) == true){
            // find distance and add it to curr event
            event.venue.distance = lngLatDistances.get(eventLngLat);
        } else {
            let mapboxMatrixURL = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${userLngLat};`
            mapboxMatrixURL += `${eventLngLat}?access_token=${mapboxAccessToken}`
            const response = await fetch(mapboxMatrixURL, {mode: 'cors'})
            const distances = await response.json()
            distanceInSeconds = distances["durations"][0][1];
            event.venue.distance = distanceInSeconds;
            lngLatDistances.set(eventLngLat, distanceInSeconds)
        }
    }));
    // sort events by distance
    events.sort((a, b) => {
        if (a.venue.distance == null) {
            return 1
        } else if (b.venue.distance == null) {
            return -1
        } else {
            return a.venue.distance - b.venue.distance
        }
    })
}

function populateList(events){
    const listElement = document.querySelector(".concert-list");
    for (const event of events) {
        const listItem = document.createElement("li");
        listItem.appendChild(document.createTextNode(`${event.venue.location}`));
        listElement.appendChild(listItem);
    }
}

async function handleListView(events){
    if (userLongitude == null || userLatitude == null){
        console.log("Please allow location on browser")
        return
    }
    await getDistanceData(events);
    populateList(events);
}
  


/*
1. Handle zoom to fit markers
2. styling
3. handle multiple shows at same venue
4. Add list of events ordered by distance from current location
5. Add hover effect + interactivity on list items
6. Style list!
7. Handle non-driveable venues


*/