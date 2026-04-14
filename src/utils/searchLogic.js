export const normalizeSearchQuery = (query) => {
  if (!query) return '';
  let q = query.toLowerCase().trim();
  // Handling Plural and Singular Type Names
  const pluralToSingular = {
    'apartments': 'apartment',
    'villas': 'villa',
    'commercials': 'commercial',
    'plots': 'plot',
    'penthouses': 'penthouse'
  };
  
  if (pluralToSingular[q]) {
    q = pluralToSingular[q];
  } else if (q.endsWith('es') && q.length > 3) {
    if (q === 'penthouses') q = 'penthouse';
    else q = q.slice(0, -2);
  } else if (q.endsWith('s') && q.length > 2) {
    q = q.slice(0, -1);
  }
  return q;
};

export const getTypeEmojiMap = () => ({
  'Apartment': { color: '#E3F2FD', emoji: '🏢' },
  'Villa': { color: '#E8F5E9', emoji: '🏡' },
  'Commercial': { color: '#FFF3E0', emoji: '🏬' },
  'Plot': { color: '#F3E5F5', emoji: '🗺️' },
  'Penthouse': { color: '#FCE4EC', emoji: '🌆' }
});

export const isPropertyTypeKeyword = (query) => {
  const norm = normalizeSearchQuery(query);
  return ['apartment', 'villa', 'commercial', 'plot', 'penthouse'].includes(norm);
};

export const getCategoryFromKeyword = (query) => {
  const norm = normalizeSearchQuery(query);
  const map = {
    'apartment': 'Apartment',
    'villa': 'Villa',
    'commercial': 'Commercial',
    'plot': 'Plot',
    'penthouse': 'Penthouse'
  };
  return map[norm] || null;
}

export const LOCATION_ALIASES = {
  'ernakulam': 'kochi',
  'cochin': 'kochi',
  'trivandrum': 'thiruvananthapuram',
  'calicut': 'kozhikode',
  'quilon': 'kollam',
  'trichur': 'thrissur',
  'palghat': 'palakkad',
  'cannanore': 'kannur',
  'bombay': 'mumbai',
  'madras': 'chennai',
  'bengaluru': 'bangalore',
  'calcutta': 'kolkata',
  'delhi': 'new delhi'
};

export const normalizeLocationsInText = (text) => {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();
  Object.entries(LOCATION_ALIASES).forEach(([alias, target]) => {
    const regex = new RegExp(`\\b${alias}\\b`, 'gi');
    normalized = normalized.replace(regex, target);
  });
  return normalized;
};

export const parsePhraseQuery = (query, knownLocations = []) => {
  let result = { type: null, locationSearch: null, freeText: query };
  if (!query) return result;
  
  // Pre-process aliases
  const qLower = normalizeLocationsInText(query);
  result.freeText = qLower;

  // Extract type from last word if applicable
  const words = qLower.split(/\s+/);
  if (words.length >= 1) {
    const lastWord = words[words.length - 1];
    const typeCat = getCategoryFromKeyword(lastWord);
    if (typeCat) {
      result.type = typeCat;
      result.freeText = words.slice(0, -1).join(' ');
    }
  }

  // Explicit location preposition matcher "in/at/near/around"
  const inMatch = qLower.match(/^(.*?)\s*((?:in|at|near|around)\s+(.+))$/i);
  if (inMatch) {
     const locPart = inMatch[2]; 
     const actualLoc = locPart.replace(/^(in|at|near|around)\s+/i, '').trim();

     result.locationSearch = actualLoc;
     result.freeText = result.freeText.replace(locPart, '').trim();
     
     // Extract type before "in" if not already captured
     if (!result.type) {
        const beforeLoc = inMatch[1].trim(); 
        const parts = beforeLoc.split(/\s+/);
        if (parts.length > 0) {
          const typeCatBefore = getCategoryFromKeyword(parts[parts.length - 1]);
          if (typeCatBefore) {
            result.type = typeCatBefore;
            result.freeText = result.freeText.replace(parts[parts.length - 1], '').trim();
          }
        }
     }
  }

  // Scan against known Dictionary Locations if no preposition was used
  if (!result.locationSearch && knownLocations && knownLocations.length > 0) {
      const normalizedLocs = knownLocations
          .filter(l => l && l !== 'All Locations')
          .map(l => ({ original: l, normalized: normalizeLocationsInText(l) }));
          
      // Sort to match longest location first (e.g. "Navi Mumbai" before "Mumbai")
      normalizedLocs.sort((a,b) => b.normalized.length - a.normalized.length);

      for (const locObj of normalizedLocs) {
          // Splitting by comma allows extracting primary city from "Kochi, Kerala"
          const dbParts = locObj.normalized.split(',').map(p => p.trim()).filter(p => p.length >= 3);
          
          let matchedPart = null;
          for (const part of dbParts) {
             const regex = new RegExp(`\\b${part}\\b`, 'i');
             if (regex.test(qLower)) {
                 matchedPart = part;
                 break;
             }
          }

          if (matchedPart) {
              result.locationSearch = locObj.original;
              result.freeText = result.freeText.replace(new RegExp(`\\b${matchedPart}\\b`, 'gi'), '').trim();
              break;
          }
      }
  }

  // Cleanup extra spaces
  result.freeText = result.freeText.replace(/\s+/g, ' ').trim();
  
  return result;
};

export const filterProperties = (properties, query, filters, knownLocations = []) => {
  let results = [...properties];
  
  // 1. Text Search (Phrase & Tokenized match)
  if (query && query.length >= 3) {
    const parsed = parsePhraseQuery(query, knownLocations);
    
    // Implicit Type from phrase
    if (parsed.type) {
      results = results.filter(p => p.category === parsed.type);
    }
    
    // Implicit Location from phrase 
    if (parsed.locationSearch) {
      const locSearch = normalizeLocationsInText(parsed.locationSearch);
      results = results.filter(p => {
         const pLoc = normalizeLocationsInText(p.location);
         const pAddress = normalizeLocationsInText(p.address || '');
         const pDist = normalizeLocationsInText(p.district || '');
         return pLoc.includes(locSearch) || pAddress.includes(locSearch) || pDist.includes(locSearch);
      });
    }
    
    // Remaining free text (tokenized AND match over all searchable fields)
    if (parsed.freeText) {
      const tokens = parsed.freeText.toLowerCase().split(/\s+/).filter(Boolean);
      results = results.filter(p => {
        const targetString = normalizeLocationsInText(`${p.title || ''} ${p.location || ''} ${p.address || ''} ${p.district || ''} ${p.category || ''}`);
        return tokens.every(token => {
           const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
           const regex = new RegExp(`\\b${escapedToken}`, 'i');
           return regex.test(targetString);
        });
      });
    }
  }

  // 2. Type Filter
  if (filters.type && filters.type !== 'All Types') {
    results = results.filter(p => p.category === filters.type);
  }

  // 3. Location Filter
  if (filters.location && filters.location !== 'All Locations') {
    const loc = filters.location.toLowerCase();
    results = results.filter(p => 
      (p.location || '').toLowerCase() === loc || 
      (p.district || '').toLowerCase() === loc
    );
  }

  // 4. Price Filter
  if (filters.price && filters.price !== 'Any Price') {
    results = results.filter(p => {
      // Use numericPrice if available (set by admin), otherwise parse from price string
      let priceVal = 0;
      if (p.numericPrice && p.numericPrice > 0) {
        priceVal = p.numericPrice;
      } else {
        const raw = (p.price || '0').toString().replace(/[^0-9.]/g, '');
        priceVal = parseFloat(raw) || 0;
      }

      const priceLower = filters.price.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Keyword pattern matching (avoids ₹ URL-encoding issues)
      if (priceLower.startsWith('under') || (priceLower.includes('50') && priceLower.startsWith('under'))) {
        return priceVal < 5000000;
      }
      if (priceLower.includes('50') && priceLower.includes('1cr')) {
        return priceVal >= 5000000 && priceVal <= 10000000;
      }
      if (priceLower.includes('1cr') && priceLower.includes('3cr')) {
        return priceVal >= 10000000 && priceVal <= 30000000;
      }
      if (priceLower.startsWith('above') || (priceLower.includes('3cr') && !priceLower.includes('1cr'))) {
        return priceVal > 30000000;
      }
      return true;
    });
  }

  // 5. Sort
  if (filters.sort) {
    const parseDate = (p) => {
      // Support addedOn (ISO string or Firestore Timestamp) and createdAt
      if (p.addedOn) {
        if (typeof p.addedOn === 'string') return new Date(p.addedOn).getTime();
        if (p.addedOn.seconds) return p.addedOn.seconds * 1000;
      }
      if (p.createdAt) {
        if (typeof p.createdAt === 'string') return new Date(p.createdAt).getTime();
        if (p.createdAt.seconds) return p.createdAt.seconds * 1000;
      }
      return 0;
    };
    const parsePrice = (p) => parseFloat((p.price || '0').toString().replace(/[^0-9.]/g, '')) || 0;

    switch (filters.sort) {
      case 'Newest First':
        results.sort((a, b) => parseDate(b) - parseDate(a));
        break;
      case 'Oldest First':
        results.sort((a, b) => parseDate(a) - parseDate(b));
        break;
      case 'Price Low to High':
        results.sort((a, b) => parsePrice(a) - parsePrice(b));
        break;
      case 'Price High to Low':
        results.sort((a, b) => parsePrice(b) - parsePrice(a));
        break;
      default:
        break;
    }
  }

  return results;
};
