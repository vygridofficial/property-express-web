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
  
  // 1. Match @lat,lng format commonly in standard maps URLs
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  
  // 2. Match iframe pb=!2dLONG!3dLAT format
  const pbMatch = url.match(/!2d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (pbMatch) {
    return { lat: parseFloat(pbMatch[2]), lng: parseFloat(pbMatch[1]) }; // Note: 2d=lng, 3d=lat
  }

  // 3. Match query params &query=lat,lng or q=lat,lng
  const qMatch = url.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  
  return null;
}

export const getPropertyCoordinates = (property) => {
  if (!property) return null;
  if (property.mapsUrl) {
    const exactCoords = extractCoordsFromUrl(property.mapsUrl);
    if (exactCoords) {
      // Use exact coordinates provided in DB document
      return { id: property.id || `exact-${exactCoords.lat}-${exactCoords.lng}`, lat: exactCoords.lat, lng: exactCoords.lng };
    }
  }
  return null;
}
