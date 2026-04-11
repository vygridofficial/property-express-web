import { DISTRICT_COORDINATES, KERALA_DISTRICTS } from '../data/districts';

export function deg2rad(deg) { return deg * (Math.PI / 180); }

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Address-based fallback removed per user requirement. Link-based extraction only.

export const extractCoordsFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  let result = null;

  // 1. Match @lat,lng format commonly in standard maps URLs
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    result = { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // 2. Match iframe pb=!2dLONG!3dLAT format
  const pbMatch = url.match(/!2d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (pbMatch && !result) {
    result = { lat: parseFloat(pbMatch[2]), lng: parseFloat(pbMatch[1]) }; // Note: 2d=lng, 3d=lat
  }

  // 3. Match query params &query=lat,lng or q=lat,lng
  const qMatch = url.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch && !result) {
    result = { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // 4. Match search/place URLs where location name is in the path /place/NAME/
  const placeMatch = url.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    const label = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    if (result) {
      result.label = label;
    } else {
      // If no coords, just return the label as a search query
      result = { label };
    }
  }

  // 5. Match search query param q=...
  if (!result || !result.lat) {
    const sMatch = url.match(/[?&]q=([^&]+)/);
    if (sMatch) {
      const qVal = decodeURIComponent(sMatch[1].replace(/\+/g, ' '));
      // Only use it if it's not a coordinate pair (which was handled in step 3)
      if (!qVal.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) {
        if (!result) result = {};
        result.label = qVal;
      }
    }
  }

  return result;
}

export const getPropertyCoordinates = (property) => {
  if (!property) return null;
  if (property.mapsUrl) {
    const coords = extractCoordsFromUrl(property.mapsUrl);
    if (coords && (coords.lat || coords.label)) {
      // Use exact coordinates or label provided in DB document
      return {
        id: property.id || `exact-${coords.lat || 'query'}-${coords.lng || 'query'}`,
        lat: coords.lat,
        lng: coords.lng,
        label: coords.label || property.title
      };
    }
  }
  
  if (property.district) {
    const distKey = KERALA_DISTRICTS.find(d => d.toLowerCase() === (property.district || '').toLowerCase()) || property.district;
    const districtCoords = DISTRICT_COORDINATES[distKey];
    if (districtCoords) {
      // Fallback to district center
      return {
        id: property.id || `dist-${districtCoords.lat}-${districtCoords.lng}`,
        lat: districtCoords.lat,
        lng: districtCoords.lng,
        label: property.district
      };
    }
  }
  
  return null;
}
