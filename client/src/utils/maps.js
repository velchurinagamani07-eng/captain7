export function googleMapsSearchUrl(address = "") {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
