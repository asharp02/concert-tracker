const mapboxAccessToken =
  "pk.eyJ1IjoiYXNoYXJwMDIiLCJhIjoiY2p5b3EwMTJyMTdoajNtbG1jZTJsaHJvYSJ9.KacigdAtzleu4QeM-dx7XQ";
let userLatitude = null;
let userLongitude = null;

let currentEventMarkers = [];
let userLocation = null;
async function handleSubmit(event) {
  const artistName = document.querySelector("#artist-input").value;
  event.preventDefault();
  clearList();
  const myRequest = new Request(`/api/events?artist_name=${artistName}`);
  const response = await fetch(myRequest);
  const events = await response.json();
  populateMap(events);
  handleListView(events);
}

function clearList() {
  const list = document.querySelector(".concert-list");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
}

const successCallback = (position) => {
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  drawMap(position);
};
const errorCallback = (error) => {
  console.log(error);
};
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

let submitBtn = document.querySelector("#submit-btn");
submitBtn.addEventListener("click", handleSubmit);
let map = null;
function drawMap() {
  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    center: [userLongitude, userLatitude], // starting position [lng, lat]
    zoom: 2.5, // starting zoom
  });
  let locationMarker = new mapboxgl.Marker({ color: "#50C878" })
    .setLngLat([userLongitude, userLatitude])
    .addTo(map);
}

function populateMap(shows) {
  // Remove previously placed markers
  for (const marker of currentEventMarkers) {
    marker.remove();
  }
  currId = 0;
  shows.forEach((show) => {
    // create the popup
    let popupHTML = `<h2 class="headliner popup-headliner">${show.headliner}</h3>`;
    if (show.openers != "") {
      popupHTML += `<h4 class="openers">${show.openers}</h4>`;
    }
    popupHTML += `<div class="showDetails">`;
    popupHTML += `<span class="startTime">${show.startsat.detailed}</span><br />`;
    popupHTML += `<span class="venueName">${show.venue.name}</span><br />`;
    popupHTML += `<span class="venueLocation">${show.venue.location}</span>`;
    popupHTML += `</div>`;
    show.id = currId;

    const popup = new mapboxgl.Popup({
      offset: 25,
    }).setHTML(popupHTML);
    const el = document.createElement("div");
    el.className = "marker";
    el.id = `marker-${currId}`;
    el.dataset.id = currId;
    const marker1 = new mapboxgl.Marker(el)
      .setLngLat([show.venue.longitude, show.venue.latitude])
      .setPopup(popup)
      .addTo(map);
    currentEventMarkers.push(marker1);
    currId++;
  });
}
/*
 * This function fetches the distance data for every venue currently in the
 * events list, then updates that venue object with the travel distance. An
 * additional mapping (lngLatDistances) is used to map {long},{lat} to distances
 * so that we only need to fetch the distance once per venue (in the case of multiple shows at one venue)
 */
async function getDistanceData(events) {
  const lngLatDistances = new Map(); //mappings from event long,lat strings to distances response
  const userLngLat = `${userLongitude},${userLatitude}`;
  await Promise.all(
    events.map(async (event) => {
      const eventLngLat = `${event.venue.longitude},${event.venue.latitude}`;
      if (lngLatDistances.has(eventLngLat) == true) {
        // find distance and add it to curr event
        event.venue.distance = lngLatDistances.get(eventLngLat);
      } else {
        let mapboxMatrixURL = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${userLngLat};`;
        mapboxMatrixURL += `${eventLngLat}?access_token=${mapboxAccessToken}`;
        const response = await fetch(mapboxMatrixURL, { mode: "cors" });
        const distances = await response.json();
        distanceInSeconds = distances["durations"][0][1];
        event.venue.distance = distanceInSeconds;
        event.venue.distanceReadable = convertTravelTime(distanceInSeconds);
        lngLatDistances.set(eventLngLat, event.venue.distance);
      }
    })
  );

  // sort events by distance
  events.sort((a, b) => {
    if (a.venue.distance == null) {
      return 1;
    } else if (b.venue.distance == null) {
      return -1;
    } else {
      return a.venue.distance - b.venue.distance;
    }
  });
}

function convertTravelTime(durationInSeconds) {
  const hours = durationInSeconds / 3600;
  const minutes = (hours % 1) * 60;
  let timeString = "";
  if (hours >= 1) {
    timeString += `${Math.round(hours)} Hours `;
  }
  timeString += `${Math.round(minutes)} Minutes`;
  return timeString;
}

function populateList(events) {
  const listElement = document.querySelector(".concert-list");
  for (const event of events) {
    const distanceNullHTML = `This event is not travellable via car from you, consider a plane ✈️`;
    const distanceFoundHTML = `Travel Time: ${event.venue.distanceReadable}`;
    let distanceHTML =
      event.venue.distance == null ? distanceNullHTML : distanceFoundHTML;
    const listItemHTML = `<li id='item-${event.id}' data-id='${event.id}' data-lat='${event.venue.latitude}' data-lng='${event.venue.longitude}'> 
            <div class='date-list-view'>
                <p class="list-month-date">${event.startsat.month} ${event.startsat.date}</p>
                <p>${event.startsat.day} ${event.startsat.time} </p>
            </div>
            <div class="venue-list-view">
                <p class="headliner list-headliner"> ${event.headliner} </p>
                <p> ${event.venue.name} ${event.venue.location}<br><strong>${distanceHTML}</strong></p>
            </div>
        `;
    listElement.insertAdjacentHTML("beforeend", listItemHTML);
  }
}

async function handleListView(events) {
  if (userLongitude == null || userLatitude == null) {
    console.log("Please allow location on browser");
    return;
  }
  await getDistanceData(events);
  populateList(events);
  console.log(events);
  setHoverAndClickEventsForListItems();
}

let showDelay = 300,
  hideDelay = 300;
let itemHoverOverTimer, itemHoverOutTimer;
let currentHighlightedMarker;
function setHoverAndClickEventsForListItems() {
  document.querySelectorAll(".concert-list li").forEach((listItem) => {
    listItem.addEventListener("mouseover", handleItemHoverOver);
    listItem.addEventListener("mouseout", () => {
      clearTimeout(itemHoverOverTimer);
    });
    listItem.addEventListener("click", zoomMarker);
  });
}

function handleItemHoverOver(event) {
  const listItem = event.currentTarget;
  itemHoverOverTimer = setTimeout(centerMarker, 400, listItem);
}

function handleItemHoverOut(event) {
  clearTimeout(itemHoverOverTimer);
  itemHoverOutTimer = setTimeout(unHighlightMarker, 0, event);
}

function highlightMarker(listItem) {
  const showId = listItem.dataset.id;
  const showMarker = document.querySelector(`#marker-${showId}`);
  showMarker.style.width = "40px";
  showMarker.style.height = "40px";
}

function centerMarker(event) {
  if (currentHighlightedMarker) {
    handleItemHoverOut(currentHighlightedMarker);
  }
  currentHighlightedMarker = event;
  highlightMarker(event);
  const lat = event.dataset.lat;
  const lng = event.dataset.lng;
  // center map to currently highlighter marker
  map.flyTo({
    center: [lng, lat],
    speed: 0.5,
    zoom: 3,
  });
}

function zoomMarker(event) {
  const targetedListItem = event.currentTarget;
  if (currentHighlightedMarker != targetedListItem) {
    handleItemHoverOut(currentHighlightedMarker);
  }
  clearTimeout(itemHoverOverTimer);
  currentHighlightedMarker = targetedListItem;
  highlightMarker(targetedListItem);
  const lat = targetedListItem.dataset.lat;
  const lng = targetedListItem.dataset.lng;
  map.flyTo({
    center: [lng, lat],
    zoom: 9,
  });
}

function unHighlightMarker(listItem) {
  const showId = listItem.dataset.id;
  const showMarker = document.querySelector(`#marker-${showId}`);
  showMarker.style.width = "20px";
  showMarker.style.height = "20px";
}

/*
1. Handle zoom to fit markers
2. styling
3. handle multiple shows at same venue
4. Add list of events ordered by distance from current location
5. Add hover effect + interactivity on list items
6. Style list!
7. Handle non-driveable venues
8. Have multiple list view options: sort by travel time or sort by date!
9. Make list view scrollable within container!
10. Add loading bar
11. Convert travel time to hours/minutes!
*/
