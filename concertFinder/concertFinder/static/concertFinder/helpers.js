export function convertTravelTime(durationInSeconds) {
  const hours = durationInSeconds / 3600;
  const minutes = (hours % 1) * 60;
  let timeString = "";
  if (hours >= 1) {
    timeString += `${Math.round(hours)} Hours `;
  }
  timeString += `${Math.round(minutes)} Minutes`;
  return timeString;
}

export function sortConcertList(events) {
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
