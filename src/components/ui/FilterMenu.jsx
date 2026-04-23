import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, MapPin, Home, BedDouble, CheckCircle2, Layers } from 'lucide-react';
import styles from './FilterMenu.module.css';

export default function FilterMenu({
  filters,
  onChange,
  onClear,
  onApply,
  properties = [],
  isHorizontal = false,
  showApplyButton = false
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync internal state if props change (e.g. cleared externally)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    let newFilters = { ...localFilters };
    
    if (key === 'category') {
      if (newFilters[key] === value) {
        newFilters[key] = '';
      } else {
        newFilters[key] = value;
      }
      // Reset sub-filters when category changes/toggles
      newFilters.type = '';
      newFilters.bhk = '';
      newFilters.features = '';
    } else if (['features', 'type', 'bhk', 'status'].includes(key)) {
      const currentValues = newFilters[key] ? newFilters[key].split(',').filter(Boolean) : [];
      if (currentValues.includes(value)) {
        newFilters[key] = currentValues.filter(f => f !== value).join(',');
      } else {
        newFilters[key] = [...currentValues, value].join(',');
      }
    } else {
      // Toggle logic for single selection (location)
      newFilters[key] = newFilters[key] === value ? '' : value;
    }
    
    setLocalFilters(newFilters);
    // Auto-apply if it's the results page (showApplyButton is false)
    if (!showApplyButton) {
      onChange(newFilters);
    }
  };

  const handleClear = () => {
    const empty = { category: '', type: '', bhk: '', status: '', location: '', features: '' };
    setLocalFilters(empty);
    if (!showApplyButton) onChange(empty);
    if (onClear) onClear();
  };

  const handleApply = () => {
    if (onApply) onApply(localFilters);
    else onChange(localFilters);
  };

  // Categories (Fixed Taxonomy to prevent breaking other pages)
  const categories = useMemo(() => {
    return ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Plot'];
  }, []);

  // Hardcoded sub-types based on category to ensure they always show
  const dynamicTypes = useMemo(() => {
    switch (localFilters.category?.toLowerCase()) {
      case 'residential':
        return ['Villa', 'Apartment', 'Flat'];
      case 'commercial':
        return ['Office', 'Shop', 'Warehouse'];
      case 'industrial':
        return ['Factory', 'Land', 'Warehouse'];
      case 'agricultural':
        return ['Farm', 'Land'];
      case 'plot':
        return ['Residential Plot', 'Commercial Plot'];
      default:
        return [];
    }
  }, [localFilters.category]);

  // Extract unique locations from properties
  const uniqueLocations = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    const locs = properties.map(p => p.location?.trim()).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [properties]);

  // Extract dynamic features based on currently selected property type or category
  const dynamicFeatures = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    
    let relevantProperties = properties;
    if (localFilters.category) {
      relevantProperties = relevantProperties.filter(p => p.category?.toLowerCase() === localFilters.category.toLowerCase());
    }
    if (localFilters.type) {
      relevantProperties = relevantProperties.filter(p => p.propertyType?.toLowerCase() === localFilters.type.toLowerCase() || p.category?.toLowerCase() === localFilters.type.toLowerCase());
    }

    const allFeatures = relevantProperties.reduce((acc, prop) => {
      const propFeatures = [...(prop.amenities || []), ...(prop.features || [])];
      return [...acc, ...propFeatures];
    }, []);

    // Return unique, sorted features
    return [...new Set(allFeatures)].filter(Boolean).sort();
  }, [properties, localFilters.category, localFilters.type]);

  const activeFeatureArray = localFilters.features ? localFilters.features.split(',').filter(Boolean) : [];
  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  const showBHK = localFilters.category?.toLowerCase() === 'residential' || localFilters.category?.toLowerCase() === 'apartment' || localFilters.category?.toLowerCase() === 'villa' || !localFilters.category;

  return (
    <div className={`${styles.filterContainer} ${isHorizontal ? styles.horizontal : ''}`}>
      {/* 1. Primary Category Filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <Layers size={18} /> Property Category
          </h3>
        </div>
        <div className={styles.chipGroup} style={{ gap: '1rem', marginTop: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryChip} ${localFilters.category === cat ? styles.active : ''}`}
              onClick={() => handleChange('category', cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Show sub-filters ONLY if a category is selected OR if we want to show all by default? 
          User requested: "Only show the sub-filters AFTER a category is chosen" */}
      {localFilters.category && (
        <>
          {/* 2. Sub-category / Property Type */}
          {dynamicTypes.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.filterSection}>
              <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>
                  <Home size={18} /> Property Type
                </h3>
              </div>
              <div className={styles.chipGroup}>
                {dynamicTypes.map(type => (
                  <button
                    key={type}
                    className={`${styles.filterChip} ${localFilters.type?.includes(type) ? styles.active : ''}`}
                    onClick={() => handleChange('type', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3. BHK Filter (Conditional based on Category) */}
          {showBHK && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.filterSection}>
              <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>
                  <BedDouble size={18} /> Bedrooms
                </h3>
              </div>
              <div className={styles.chipGroup}>
                {['1BHK', '2BHK', '3BHK', '4BHK+'].map(bhk => (
                  <button
                    key={bhk}
                    className={`${styles.filterChip} ${localFilters.bhk?.includes(bhk) ? styles.active : ''}`}
                    onClick={() => handleChange('bhk', bhk)}
                  >
                    {bhk}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 4. Status Filter */}
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>
                <Filter size={18} /> Status
              </h3>
            </div>
            <div className={styles.chipGroup}>
              {['Sale', 'Rent'].map(status => (
                <button
                  key={status}
                  className={`${styles.filterChip} ${localFilters.status?.includes(status) ? styles.active : ''}`}
                  onClick={() => handleChange('status', status)}
                >
                  For {status}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 5. Location Filter */}
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>
                <MapPin size={18} /> Location
              </h3>
            </div>
            <select 
              className={styles.selectInput}
              value={localFilters.location}
              onChange={(e) => {
                const newFilters = { ...localFilters, location: e.target.value };
                setLocalFilters(newFilters);
                if (!showApplyButton) onChange(newFilters);
              }}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </motion.div>

          {/* 6. Dynamic Features Section */}
          {dynamicFeatures.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.filterSection} style={{ flex: isHorizontal ? '1 1 100%' : 'auto' }}>
              <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>
                  <CheckCircle2 size={18} /> 
                  {localFilters.type ? `${localFilters.type} Features` : `${localFilters.category} Features`}
                </h3>
              </div>
              <div className={styles.chipGroup}>
                {dynamicFeatures.map(feature => (
                  <button
                    key={feature}
                    className={`${styles.filterChip} ${activeFeatureArray.includes(feature) ? styles.active : ''}`}
                    onClick={() => handleChange('features', feature)}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      <div className={styles.actionsContainer}>
        {activeFilterCount > 0 && (
          <button className={styles.clearBtn} onClick={handleClear}>
            Clear All
          </button>
        )}
        {showApplyButton && (
          <motion.button 
            className={styles.applyBtn} 
            onClick={handleApply}
            whileTap={{ scale: 0.98 }}
          >
            Show Properties <Filter size={18} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
