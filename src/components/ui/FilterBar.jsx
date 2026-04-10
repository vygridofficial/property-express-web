import React, { useContext, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PropertiesContext } from '../../context/PropertiesContext';
import { FILTER_TAXONOMY } from '../../data/filterTaxonomy';
import styles from './FilterBar.module.css';

export default function FilterBar() {
  const { filters, setFilters } = useContext(PropertiesContext);
  
  const [localFilters, setLocalFilters] = useState({
    location: filters.location || '',
    type: filters.type || '',
    priceMax: filters.priceMax || '',
    ...filters
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      const resetFilters = { location: localFilters.location, type: value, priceMax: localFilters.priceMax };
      setLocalFilters(resetFilters);
    } else {
      setLocalFilters({ ...localFilters, [name]: value });
    }
  };

  const handleSearch = () => {
    setFilters(localFilters);
  };

  const selectedCategory = FILTER_TAXONOMY[localFilters.type];

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterForm}>
        <div className={styles.filterGroup}>
          <label>Location</label>
          <select name="location" value={localFilters.location} onChange={handleChange}>
            <option value="">All Locations</option>
            <option value="New York, NY">New York, NY</option>
            <option value="Los Angeles, CA">Los Angeles, CA</option>
            <option value="Miami, FL">Miami, FL</option>
            <option value="Austin, TX">Austin, TX</option>
            <option value="Beverly Hills, CA">Beverly Hills, CA</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Property Type</label>
          <select name="type" value={localFilters.type} onChange={handleChange}>
            <option value="">All Types</option>
            {Object.keys(FILTER_TAXONOMY).map(key => (
              <option key={key} value={key}>{FILTER_TAXONOMY[key].label}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Max Price</label>
          <select name="priceMax" value={localFilters.priceMax} onChange={handleChange}>
            <option value="">No Max</option>
            <option value="5000000">Up to ₹50 Lakhs</option>
            <option value="10000000">Up to ₹1 Crore</option>
            <option value="20000000">Up to ₹2 Crores</option>
            <option value="50000000">Up to ₹5 Crores</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <button type="button" className={`btn btn-primary ${styles.searchBtn}`} onClick={handleSearch}>
            <Search size={18} style={{ marginRight: '0.5rem' }} /> Search
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedCategory && selectedCategory.subFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '1.5rem' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.subFilterRow}>
              {selectedCategory.subFilters.map(subFilter => (
                <div key={subFilter.key} className={styles.filterGroup}>
                  <label>{subFilter.label}</label>
                  <select name={subFilter.key} value={localFilters[subFilter.key] || ''} onChange={handleChange}>
                    <option value="">Any {subFilter.label}</option>
                    {subFilter.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
