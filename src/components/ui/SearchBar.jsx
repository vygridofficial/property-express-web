import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronDown, Check, CornerDownLeft, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterProperties, getTypeEmojiMap, isPropertyTypeKeyword, getCategoryFromKeyword } from '../../utils/searchLogic';
import styles from './SearchBar.module.css';
import { formatPrice } from '../../utils/formatPrice';

const DEFAULT_FILTERS = {
  sort: 'Newest First',
  type: 'All Types',
  location: 'All Locations',
  price: 'Any Price'
};

const DROPDOWN_OPTIONS = {
  sort: ['Newest First', 'Oldest First', 'Price Low to High', 'Price High to Low'],
  type: ['All Types', 'Apartment', 'Villa', 'Commercial', 'Plot', 'Penthouse'],
  price: ['Any Price', 'Under ₹50L', '₹50L to ₹1Cr', '₹1Cr to ₹3Cr', 'Above ₹3Cr']
};

export default function SearchBar({ properties = [] }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const locations = useMemo(() => {
    const locs = new Set(properties.map(p => p.location).filter(Boolean));
    return ['All Locations', ...Array.from(locs).sort()];
  }, [properties]);
  
  const dropdownOptions = {
    ...DROPDOWN_OPTIONS,
    location: locations
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery, filters]);

  const filteredResults = useMemo(() => {
    if (debouncedQuery.length < 3) return [];
    return filterProperties(properties, debouncedQuery, filters, locations);
  }, [properties, debouncedQuery, filters, locations]);

  const groupedResults = useMemo(() => {
    if (!filteredResults.length) return [];
    const groups = {};
    filteredResults.forEach(prop => {
      const type = prop.category || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(prop);
    });
    
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([type, props]) => ({
        type,
        items: props.slice(0, 3),
        totalCount: props.length,
        hasMore: props.length > 3,
        moreCount: props.length - 3
      }));
  }, [filteredResults]);

  const flatNavigableItems = useMemo(() => {
    const items = [];
    if (debouncedQuery.length > 0 && debouncedQuery.length < 3) {
      items.push({ type: 'quick_search', text: debouncedQuery });
      return items;
    }
    if (debouncedQuery.length >= 3 && filteredResults.length === 0 && isPropertyTypeKeyword(debouncedQuery)) {
       items.push({ type: 'type_filter_cta', category: getCategoryFromKeyword(debouncedQuery) });
    } else {
       groupedResults.forEach(group => {
         group.items.forEach(prop => items.push({ type: 'property', data: prop }));
       });
    }
    return items;
  }, [debouncedQuery, filteredResults, groupedResults]);

  const activeIndex = hoveredIndex >= 0 ? hoveredIndex : highlightedIndex;

  const suggestion = useMemo(() => {
    if (query.trim().length < 2) return '';
    const q = query.toLowerCase();

    // 1. Kerala districts first — most specific geographical match
    const KERALA_DISTRICTS = [
      'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
      'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
      'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
    ];
    const districtMatch = KERALA_DISTRICTS.find(d => d.toLowerCase().startsWith(q));
    if (districtMatch && districtMatch.toLowerCase() !== q) return districtMatch;

    // 2. Property location strings from dataset
    const locMatch = locations.find(l => l !== 'All Locations' && l.toLowerCase().startsWith(q));
    if (locMatch && locMatch.toLowerCase() !== q) return locMatch;

    // 3. Property types / categories
    const typeMatch = DROPDOWN_OPTIONS.type.find(t => t !== 'All Types' && t.toLowerCase().startsWith(q));
    if (typeMatch && typeMatch.toLowerCase() !== q) return typeMatch;

    // 4. Property titles
    const propMatch = properties.find(p => p.title && p.title.toLowerCase().startsWith(q));
    if (propMatch && propMatch.title.toLowerCase() !== q) return propMatch.title;

    // 5. Contains fallbacks (district → location → type)
    const distCont = KERALA_DISTRICTS.find(d => d.toLowerCase().includes(q) && d.toLowerCase() !== q);
    if (distCont) return distCont;

    const locCont = locations.find(l => l !== 'All Locations' && l.toLowerCase().includes(q) && l.toLowerCase() !== q);
    if (locCont) return locCont;

    const typeCont = DROPDOWN_OPTIONS.type.find(t => t !== 'All Types' && t.toLowerCase().includes(q) && t.toLowerCase() !== q);
    if (typeCont) return typeCont;

    return '';
  }, [query, properties, locations]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      setOpenDropdown(null);
      e.target.blur();
    } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
      // Accept autocomplete suggestion
      if (suggestion && suggestion.toLowerCase() !== query.toLowerCase()) {
        e.preventDefault();
        setQuery(suggestion);
        return;
      }
      
      if (e.key === 'ArrowRight') {
         // Continue with default behavior if no suggestion
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoveredIndex(-1);
      setHighlightedIndex(prev => Math.min(prev + 1, flatNavigableItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoveredIndex(-1);
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatNavigableItems.length) {
        const item = flatNavigableItems[activeIndex];
        if (item.type === 'property') {
          navigate(`/properties/${item.data.id}`, { state: { property: item.data } });
          setIsFocused(false);
        } else if (item.type === 'type_filter_cta') {
          handleSearchSubmit(item.category);
        } else if (item.type === 'quick_search') {
          handleSearchSubmit();
        }
      } else {
        handleSearchSubmit();
      }
    }
  };

  const handleSearchSubmit = (forceCategory = null) => {
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    
    // Convert click/enter category bypass to type param
    if (typeof forceCategory === 'string') {
      params.set('type', forceCategory);
    } else if (filters.type !== 'All Types') {
      params.set('type', filters.type);
    }
    
    if (filters.location !== 'All Locations') params.set('location', filters.location);
    if (filters.price !== 'Any Price') params.set('price', filters.price);
    if (filters.sort !== 'Newest First') params.set('sort', filters.sort);
    
    navigate(`/search?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    document.querySelector(`.${styles.input}`).focus();
  };

  const map = getTypeEmojiMap();

  return (
    <div className={styles.searchContainer} ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto', zIndex: isFocused ? 50 : 10 }}>
      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className={styles.searchWrapper}>
        <div className={styles.searchIcon}>
          <Search size={22} />
        </div>
        
        {!query && (
          <div className={styles.marqueePlaceholder}>
            <div className={styles.marqueeContent}>
              Search by location, property type, or name...
            </div>
          </div>
        )}

        {/* Ghost text overlay using span technique — zero overlap */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
          {suggestion && suggestion.toLowerCase().startsWith(query.toLowerCase()) && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                padding: '0.6rem 0',
                fontSize: '1rem',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
                lineHeight: 'inherit',
                pointerEvents: 'none',
                whiteSpace: 'pre',
                overflow: 'hidden',
                zIndex: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* Typed part: invisible but holds its width */}
              <span style={{ color: 'transparent' }}>{query}</span>
              {/* Ghost suffix: gray */}
              <span style={{ color: '#bbb' }}>{suggestion.slice(query.length)}</span>
            </div>
          )}

          <input
            id="main-search-input"
            type="text"
            className={styles.input}
            style={{ flex: 1, position: 'relative', zIndex: 1, width: '100%' }}
            placeholder="Search by location, property type, or name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isFocused) setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearSearch}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              marginRight: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        )}
        <button type="submit" className={styles.searchBtn} disabled={!query.trim()}>
          <Search size={18} className="mobile-only" />
          <span>Search</span>
        </button>
      </form>

      {/* Spotlight Panel */}
      <AnimatePresence>
        {isFocused && (debouncedQuery.length > 0 || Object.values(filters).some(v => !v.startsWith('All ') && v !== 'Any Price' && v !== 'Newest First')) && (
          <motion.div
            className={styles.panelBox}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', margin: '4px -14px 0', padding: '0 14px' }}>
              {/* Scenario 1: < 3 chars */}
              {debouncedQuery.length > 0 && debouncedQuery.length < 3 && (
                <div 
                  className={`${styles.quickActionRow} ${activeIndex === 0 ? styles.rowHighlighted : ''}`}
                  onClick={() => handleSearchSubmit()}
                  onMouseEnter={() => setHoveredIndex(0)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                >
                  <div className={styles.quickActionLeft}>
                    <div className={styles.grayCircle}><Search size={18} /></div>
                    <span style={{ color: '#333', fontSize: '0.95rem' }}>Continue typing to search...</span>
                  </div>
                  <div className={styles.enterBadge}><CornerDownLeft size={12} /></div>
                </div>
              )}

              {/* Scenario 2: > 3 chars, No properties found */}
              {debouncedQuery.length >= 3 && filteredResults.length === 0 && (
                <>
                  {isPropertyTypeKeyword(debouncedQuery) ? (() => {
                    const typeCategory = getCategoryFromKeyword(debouncedQuery);
                    const typeData = map[typeCategory] || { emoji: '🏢', color: '#f5f5f5' };
                    return (
                      <div 
                        className={`${styles.typeFilterRow} ${activeIndex === 0 ? styles.rowHighlighted : ''}`}
                        onClick={() => handleSearchSubmit(typeCategory)}
                        onMouseEnter={() => setHoveredIndex(0)}
                        onMouseLeave={() => setHoveredIndex(-1)}
                      >
                        <div className={styles.quickActionLeft}>
                          <div className={styles.typeIconSquare} style={{ backgroundColor: typeData.color }}>
                            {typeData.emoji}
                          </div>
                          <div>
                            <div className={styles.typeText}>{typeCategory}s</div>
                            <div className={styles.browseLink}>Browse all {typeCategory}s <ArrowRight size={14} /></div>
                          </div>
                        </div>
                        <div className={styles.enterBadge}><CornerDownLeft size={12} /></div>
                      </div>
                    )
                  })() : (
                    <div className={styles.emptyState}>
                      <Search size={32} className={styles.emptyStateIcon} />
                      <div className={styles.emptyStateTitle}>No results for "{debouncedQuery}"</div>
                      <div className={styles.emptyStateSub}>Try a place name, property name, or type.</div>
                    </div>
                  )}
                </>
              )}

              {/* Scenario 3: Properties found */}
              {debouncedQuery.length >= 3 && filteredResults.length > 0 && (
                <div style={{ paddingBottom: '16px' }}>
                  {groupedResults.map((group, groupIdx) => {
                    return (
                      <div key={group.type}>
                        <div className={styles.sectionHeader}>{group.type}S</div>
                        {group.items.map((prop, itemIdx) => {
                          const flatIndex = flatNavigableItems.findIndex(i => i.data?.id === prop.id);
                          const typeData = map[prop.category] || { emoji: '🏢', color: '#f5f5f5' };
                          const imageSrc = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : (prop.image || null);
                          return (
                            <motion.div
                              key={prop.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: itemIdx * 0.04 }}
                              className={`${styles.resultRow} ${activeIndex === flatIndex ? styles.rowHighlighted : ''}`}
                              onClick={() => { navigate(`/properties/${prop.id}`, { state: { property: prop } }); setIsFocused(false); }}
                              onMouseEnter={() => setHoveredIndex(flatIndex)}
                              onMouseLeave={() => setHoveredIndex(-1)}
                            >
                              <div className={styles.resultRowLeft}>
                                {imageSrc ? (
                                  <img src={imageSrc} alt="" className={styles.resultImg} />
                                ) : (
                                  <div className={styles.resultImgFallback} style={{ backgroundColor: typeData.color }}>{typeData.emoji}</div>
                                )}
                                <div className={styles.resultBody}>
                                  <div className={styles.resultTitle}>{prop.title}</div>
                                  <div className={styles.resultMeta}>{prop.category} &middot; {prop.location}</div>
                                  <div className={styles.resultPrice}>{formatPrice(prop.price)}</div>
                                </div>
                              </div>
                              {activeIndex === flatIndex && (
                                <div className={styles.enterBadge}><CornerDownLeft size={12} /></div>
                              )}
                            </motion.div>
                          );
                        })}
                        {group.hasMore && (
                          <div 
                            className={styles.moreLink}
                            onClick={() => handleSearchSubmit(group.type)}
                          >
                            + {group.moreCount} more
                          </div>
                        )}
                        {groupIdx < groupedResults.length - 1 && <div className={styles.groupDivider} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {debouncedQuery.length >= 3 && filteredResults.length > 0 && (
              <div 
                className={styles.seeAllFooter}
                onClick={() => handleSearchSubmit()}
              >
                See all {filteredResults.length} results for "{debouncedQuery}" <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
