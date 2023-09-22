import { convertTravelTime, sortConcertList } from "./helpers.js";

/******************************************
 *          Fetch User Location           *
 *                                        *
 ******************************************/
let userLatitude;
let userLongitude;
const successCallback = (position) => {
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  drawMap(position);
};
const errorCallback = (error) => {
  console.log(error);
};
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

/*************************************************************
 *  Fetch concert data + distance data from user's location  *
 *                                                           *
 *************************************************************/

let submitBtn = document.querySelector("#submit-btn");
submitBtn.addEventListener("click", handleSubmit);

async function handleSubmit(event) {
  const artistName = document.querySelector("#artist-input").value;
  event.preventDefault();
  clearList();
  clearMap();
  const myRequest = new Request(`/api/events?artist_name=${artistName}`);
  const response = await fetch(myRequest);
  const content = await response.json();
  const artistNotFoundP = document.querySelector(".artist-not-found");

  if (content.status === 200 && content.events.length > 0) {
    populateMap(content.events);
    handleListView(content.events);
    artistNotFoundP.style.display = "none";
  } else {
    artistNotFoundP.style.display = "block";
  }
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
        let distanceInSeconds = distances["durations"][0][1];
        event.venue.distance = distanceInSeconds;
        event.venue.distanceReadable = convertTravelTime(distanceInSeconds);
        lngLatDistances.set(eventLngLat, event.venue.distance);
      }
    })
  );
}

/************************************************
 *    Render + populate map with concert data   *
 *                                              *
 ************************************************/
let map;
let currentEventMarkers = [];

let hiddenInput = document.querySelector("#MAPBOX_API_KEY");
let mapboxAccessToken = hiddenInput.value;

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

function clearMap() {
  // Remove previously placed markers
  for (const marker of currentEventMarkers) {
    marker.remove();
  }
}

function populateMap(shows) {
  let currId = 0;
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

/*************************************************************
 *   Display concert list + handle list item interactivity   *
 *                                                           *
 *************************************************************/

async function handleListView(events) {
  if (userLongitude == null || userLatitude == null) {
    console.log("Please allow location on browser");
    return;
  }
  await getDistanceData(events);
  sortConcertList(events);
  populateList(events);
  setHoverAndClickEventsForListItems();
  handleAnchorTags();
}

function handleAnchorTags() {
  const anchors = document.querySelectorAll(".concert-list a");
  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
}

function clearList() {
  const list = document.querySelector(".concert-list");
  list.style.display = "none";
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
}

function populateList(events) {
  const listElement = document.querySelector(".concert-list");
  listElement.style.display = "block";
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
                <a class="headliner-link" href="${event.url}" target="_blank"><p class="headliner list-headliner"> ${event.headliner} </p> </a>
                <p> ${event.venue.name} ${event.venue.location}<br><strong>${distanceHTML}</strong></p>
            </div>
        `;
    listElement.insertAdjacentHTML("beforeend", listItemHTML);
  }
}

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
