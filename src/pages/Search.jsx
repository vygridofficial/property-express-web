import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ChevronDown } from 'lucide-react';
import { getAllProperties } from '../services/propertyService';
import { filterProperties, parsePhraseQuery } from '../utils/searchLogic';
import PropertyCard from '../components/ui/PropertyCard';
import SEO from '../components/common/SEO';
import { useAdmin } from '../admin/context/AdminContext';
import { FILTER_TAXONOMY } from '../data/filterTaxonomy';
import styles from './Search.module.css';

const CORE_FILTER_KEYS = ['sort', 'type', 'location', 'price'];

const DROPDOWN_OPTIONS = {
  sort: ['Newest First', 'Oldest First', 'Price Low to High', 'Price High to Low'],
  type: ['All Types', 'Apartment', 'Villa', 'Commercial', 'Plot', 'Penthouse'],
  price: ['Any Price', 'Under ₹50L', '₹50L to ₹1Cr', '₹1Cr to ₹3Cr', 'Above ₹3Cr']
};

const KERALA_DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const [allProps, setAllProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localQuery, setLocalQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const searchInputRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(null);
  const filterRef = useRef(null);

  // Extract query params, treating them as source of truth
  const query = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'All Types';
  const locationFilter = searchParams.get('location') || 'All Locations';
  const priceFilter = searchParams.get('price') || 'Any Price';
  const sortFilter = searchParams.get('sort') || 'Newest First';

  const filters = {
    type: typeFilter,
    location: locationFilter,
    price: priceFilter,
    sort: sortFilter
  };

  // Extract all other dynamic filters from searchParams
  searchParams.forEach((val, key) => {
    if (!CORE_FILTER_KEYS.includes(key) && key !== 'q') {
      filters[key] = val;
    }
  });

  const locations = useMemo(() => [
    'All Locations',
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad'
  ], []);

  const parsedQuery = useMemo(() => parsePhraseQuery(query, locations), [query, locations]);
  const isTypeDisabled = !!parsedQuery.type;
  const isLocationDisabled = !!parsedQuery.locationSearch;

  // Sync localQuery to URL param on mount
  useEffect(() => {
    setLocalQuery(searchParams.get('q') || '');
  }, []);

  // Fetch properties
  useEffect(() => {
    getAllProperties({}, false)
      .then(data => {
        setAllProps(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching properties:", err);
        setLoading(false);
      });
  }, []);

  // --- Scroll tracking ---
  // Save scroll position on every scroll event, keyed to this exact history entry
  useEffect(() => {
    const key = `scroll_search_${location.key}`;
    const handleScroll = () => {
      sessionStorage.setItem(key, Math.round(window.scrollY).toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  // INSTANT scroll restoration — runs before browser paints (useLayoutEffect)
  useLayoutEffect(() => {
    if (navType === 'POP') {
      const saved = sessionStorage.getItem(`scroll_search_${location.key}`);
      if (saved) {
        const target = parseInt(saved, 10);
        // Apply before first paint — no visible jump
        window.scrollTo({ top: target, behavior: 'instant' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.key, navType]);

  // Safety retry for async content (fires after data loads)
  useEffect(() => {
    if (navType !== 'POP' || loading) return;
    const saved = sessionStorage.getItem(`scroll_search_${location.key}`);
    if (!saved) return;
    const target = parseInt(saved, 10);
    if (Math.abs(window.scrollY - target) > 5) {
      window.scrollTo({ top: target, behavior: 'instant' });
    }
  }, [loading, location.key, navType]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Location autocomplete suggestion ---
  useEffect(() => {
    if (localQuery.length < 2) { setSuggestion(''); return; }
    const q = localQuery.toLowerCase();
    const districtMatch = KERALA_DISTRICTS.find(d => d.toLowerCase().startsWith(q));
    if (districtMatch && districtMatch.toLowerCase() !== q) {
      setSuggestion(districtMatch);
      return;
    }
    const propMatch = allProps.find(p => p.location && p.location.toLowerCase().startsWith(q));
    if (propMatch && propMatch.location.toLowerCase() !== q) {
      setSuggestion(propMatch.location);
      return;
    }
    setSuggestion('');
  }, [localQuery, allProps]);

  const { siteSettings, propertyTypes } = useAdmin();

  // Determine dynamic filters for the currently selected type
  const dynamicSubFilters = useMemo(() => {
    if (!typeFilter || typeFilter === 'All Types') return [];
    const dbTaxonomy = siteSettings.taxonomy?.[typeFilter]?.subFilters;
    const staticTaxonomy = FILTER_TAXONOMY[typeFilter]?.subFilters || [];
    return dbTaxonomy || staticTaxonomy;
  }, [typeFilter, siteSettings.taxonomy]);
  const dropdownOptions = useMemo(() => {
    const activeTypes = propertyTypes
      .filter(t => t.isActive !== false)
      .map(t => t.name);

    const opts = {
      ...DROPDOWN_OPTIONS,
      type: ['All Types', ...activeTypes],
      location: locations
    };

    // Add options for dynamic filters
    dynamicSubFilters.forEach(f => {
      if (f.type === 'dropdown') {
        opts[f.key] = ['Any ' + f.label, ...f.options];
      }
    });

    return opts;
  }, [dynamicSubFilters, locations, propertyTypes]);

  // Perform search locally to stay fast when params change
  const filteredResults = useMemo(() => {
    return filterProperties(allProps, query, filters, locations);
  }, [allProps, query, filters, locations]);

  const setFilterParam = (key, value) => {
    setOpenDropdown(null);
    const newParams = new URLSearchParams(searchParams);
    const defaults = { 
      sort: 'Newest First', 
      type: 'All Types', 
      location: 'All Locations', 
      price: 'Any Price' 
    };

    // Handle dynamic defaults (e.g. Any Furnishing)
    const isDynamic = !CORE_FILTER_KEYS.includes(key);
    const isDefaultValue = value === defaults[key] || (isDynamic && (value === 'Any' || value.includes('Any')));

    if (isDefaultValue) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }

    // If type is changed, clear dynamic filters as they are type-specific
    if (key === 'type') {
      searchParams.forEach((_, k) => {
        if (!CORE_FILTER_KEYS.includes(k) && k !== 'q') {
          newParams.delete(k);
        }
      });
    }

    setSearchParams(newParams, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!localQuery.trim()) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', localQuery.trim());
    setSearchParams(newParams, { replace: true });
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      setLocalQuery(suggestion);
      setSuggestion('');
    }
  };

  return (
    <div className={styles.pageWrap}>
      <SEO 
        title={`Search Results for "${query}"`} 
        description={`Browse ${filteredResults.length} properties matching your search criteria.`} 
      />

      <header className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerContent}>
            <button 
               onClick={() => navigate(-1)}
               className={styles.backBtn}
            >
              &larr; Back
            </button>
            <h1 className={styles.pageTitle}>
              Search Results
              <span className={styles.resultCount}>({filteredResults.length} results)</span>
            </h1>
            {/* Inline search bar with autocomplete */}
            <form onSubmit={handleSearchSubmit} className={styles.inlineSearchForm}>
              <div className={styles.inlineSearchWrap}>
                <span className={styles.inlineGhost}>
                  {localQuery}
                  {suggestion && suggestion.toLowerCase().startsWith(localQuery.toLowerCase()) && (
                    <span className={styles.ghostHint}>{suggestion.slice(localQuery.length)}</span>
                  )}
                </span>
                <input
                  ref={searchInputRef}
                  className={styles.inlineSearchInput}
                  value={localQuery}
                  onChange={e => setLocalQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Refine your search..."
                  autoComplete="off"
                  spellCheck="false"
                />
                <button type="submit" className={styles.inlineSearchBtn} disabled={!localQuery.trim()}>Search</button>
              </div>
            </form>
            {query && <p className="subtitle" style={{ margin: 0 }}>Showing matches for &ldquo;{query}&rdquo;</p>}
          </div>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <div className={styles.filterBar} ref={filterRef}>
        <div className="container">
          <div className={styles.filtersContainer}>
            {/* Core Filters */}
            {CORE_FILTER_KEYS.map(key => {
              if (key === 'type' && isTypeDisabled) return null;
              if (key === 'location' && isLocationDisabled) return null;
              
              const isActive = key === 'sort' ? filters[key] !== 'Newest First' : filters[key] !== 'All Types' && filters[key] !== 'All Locations' && filters[key] !== 'Any Price';
              return (
                <div key={key} className={styles.filterGroup}>
                  <button
                    type="button"
                    className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
                    onClick={() => setOpenDropdown(prev => prev === key ? null : key)}
                  >
                    {filters[key]} <ChevronDown size={14} />
                  </button>
                  
                  <AnimatePresence>
                    {openDropdown === key && (
                      <motion.div
                        className={styles.dropdownBox}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {dropdownOptions[key]?.map(opt => (
                          <div
                            key={opt}
                            className={`${styles.dropdownOption} ${filters[key] === opt ? styles.dropdownOptionSelected : ''}`}
                            onClick={() => setFilterParam(key, opt)}
                          >
                            {opt}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Dynamic Attributes Filters */}
            {dynamicSubFilters.map(f => {
              const currentVal = filters[f.key];
              const isActive = currentVal && currentVal !== 'Any' && !currentVal.includes('Any');
              
              return (
                <div key={f.key} className={styles.filterGroup}>
                  <button
                    type="button"
                    className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
                    onClick={() => setOpenDropdown(prev => prev === f.key ? null : f.key)}
                  >
                    {isActive ? currentVal : f.label} <ChevronDown size={14} />
                  </button>
                  
                  <AnimatePresence>
                    {openDropdown === f.key && (
                      <motion.div
                        className={styles.dropdownBox}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {dropdownOptions[f.key]?.map(opt => (
                          <div
                            key={opt}
                            className={`${styles.dropdownOption} ${currentVal === opt ? styles.dropdownOptionSelected : ''}`}
                            onClick={() => setFilterParam(f.key, opt)}
                          >
                            {opt}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Results Content */}
      <section className={styles.resultsSection}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading results...</div>
          ) : filteredResults.length > 0 ? (
            <div className={styles.resultsGrid}>
              <AnimatePresence>
                {filteredResults.map((prop, idx) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: idx * 0.08,
                      ease: "easeOut" 
                    }}
                    layout
                  >
                    <PropertyCard property={prop} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <SearchIcon size={48} className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>No results found</h2>
              <p className={styles.emptyStateSub}>
                We couldn't find any properties matching "{query}". Try adjusting your filters or searching for a place name, property name, or type.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
