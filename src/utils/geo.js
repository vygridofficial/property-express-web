export function deg2rad(deg) { return deg * (Math.PI / 180); }

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getCoordinatesForLocation = (locationName) => {
  if (!locationName) return null;
  const norm = locationName.toLowerCase();

  if (norm.includes('trivandrum') || norm.includes('thiruvananthapuram')) return { id: 'Trivandrum', lat: 8.5241, lng: 76.9366 };
  if (norm.includes('kochi') || norm.includes('ernakulam') || norm.includes('kakkanad') || norm.includes('edappally') || norm.includes('infopark') || norm.includes('alumon')) return { id: 'Kochi', lat: 9.9816, lng: 76.2999 };
  if (norm.includes('kollam')) return { id: 'Kollam', lat: 8.8932, lng: 76.6141 };
  if (norm.includes('thrissur')) return { id: 'Thrissur', lat: 10.5276, lng: 76.2144 };
  if (norm.includes('kottayam') || norm.includes('kumarakom') || norm.includes('pala')) return { id: 'Kottayam', lat: 9.5916, lng: 76.5222 };
  if (norm.includes('kannur')) return { id: 'Kannur', lat: 11.8745, lng: 75.3704 };
  if (norm.includes('kozhikode') || norm.includes('calicut')) return { id: 'Kozhikode', lat: 11.2588, lng: 75.7804 };
  if (norm.includes('palakkad')) return { id: 'Palakkad', lat: 10.7760, lng: 76.6548 };
  if (norm.includes('alappuzha') || norm.includes('alleppey')) return { id: 'Alappuzha', lat: 9.4981, lng: 76.3388 };
  if (norm.includes('pathanamthitta')) return { id: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 };
  if (norm.includes('idukki') || norm.includes('munnar')) return { id: 'Idukki', lat: 9.8553, lng: 76.9722 };
  if (norm.includes('wayanad') || norm.includes('bathery') || norm.includes('kalpetta')) return { id: 'Wayanad', lat: 11.6854, lng: 76.1320 };
  if (norm.includes('malappuram')) return { id: 'Malappuram', lat: 11.0733, lng: 76.0740 };
  if (norm.includes('kasaragod')) return { id: 'Kasaragod', lat: 12.4996, lng: 74.9869 };
  if (norm.includes('angamaly') || norm.includes('aluva')) return { id: 'Aluva', lat: 10.1960, lng: 76.3860 };
  return null;
}

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
  // Fallback for missing/unparseable URLs returning the city average approximation
  return getCoordinatesForLocation(property.location || property.address);
}
