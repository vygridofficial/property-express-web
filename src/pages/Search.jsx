import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ChevronDown, ArrowLeft } from 'lucide-react';
import { getAllProperties } from '../services/propertyService';
import { filterProperties, parsePhraseQuery } from '../utils/searchLogic';
import PropertyCard from '../components/ui/PropertyCard';
import SEO from '../components/common/SEO';
import styles from './Search.module.css';

const DROPDOWN_OPTIONS = {
  sort: ['Newest First', 'Oldest First', 'Price Low to High', 'Price High to Low'],
  type: ['All Types', 'Apartment', 'Villa', 'Commercial', 'Plot', 'Penthouse'],
  price: ['Any Price', 'Under ₹50L', '₹50L to ₹1Cr', '₹1Cr to ₹3Cr', 'Above ₹3Cr']
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allProps, setAllProps] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  const locations = useMemo(() => {
    const locs = new Set(allProps.map(p => p.location).filter(Boolean));
    return ['All Locations', ...Array.from(locs).sort()];
  }, [allProps]);

  const parsedQuery = useMemo(() => parsePhraseQuery(query, locations), [query, locations]);
  const isTypeDisabled = !!parsedQuery.type;
  const isLocationDisabled = !!parsedQuery.locationSearch;

  useEffect(() => {
    // Fetch newly fresh properties on load
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

  const dropdownOptions = {
    ...DROPDOWN_OPTIONS,
    location: locations
  };

  // Perform search locally to stay fast when params change
  const filteredResults = useMemo(() => {
    return filterProperties(allProps, query, filters, locations);
  }, [allProps, query, filters, locations]);

  const setFilterParam = (key, value) => {
    setOpenDropdown(null);
    const newParams = new URLSearchParams(searchParams);
    
    // Using default check to keep URL clean, but explicitly setting if needed
    if (value === 'All Types' || value === 'All Locations' || value === 'Any Price' || value === 'Newest First') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    
    setSearchParams(newParams);
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
               onClick={() => {
                   navigate('/');
                   setTimeout(() => {
                     const searchInput = document.getElementById('main-search-input');
                     if (searchInput) {
                       searchInput.focus();
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                     }
                   }, 100);
               }}
               className={styles.backBtn}
            >
              &larr; Back
            </button>
            <h1 className={styles.pageTitle}>
              Search Results
              <span className={styles.resultCount}>({filteredResults.length} results)</span>
            </h1>
            {query && <p className="subtitle" style={{ margin: 0 }}>Showing matches for "{query}"</p>}
          </div>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <div className={styles.filterBar} ref={filterRef}>
        <div className="container">
          <div className={styles.filtersContainer}>
            {['sort', 'type', 'location', 'price'].map(key => {
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
                        {dropdownOptions[key].map(opt => (
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
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
