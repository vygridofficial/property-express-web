import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, MapPin, Home, Layers } from 'lucide-react';
import { useAdmin } from '../../admin/context/AdminContext';
import { KERALA_DISTRICTS } from '../../data/districts';
import styles from './FilterMenu.module.css';

// Custom Select Component for Modern Look
const CustomSelect = ({ label, value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.customSelectWrapper} ref={ref}>
      <div className={styles.customSelectHeader} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerContent}>
          <span className={styles.inputLabel}>{label}</span>
          <div className={styles.valueRow}>
            {Icon && <Icon size={16} className={styles.valueIcon} />}
            <span className={value ? styles.selectedValue : styles.placeholderValue}>
              {value || placeholder}
            </span>
          </div>
        </div>
        <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.optionsDropdown}
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div
              className={`${styles.optionItem} ${!value ? styles.selectedOption : ''}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map(opt => (
              <div
                key={opt}
                className={`${styles.optionItem} ${value === opt ? styles.selectedOption : ''}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FilterMenu({
  filters,
  onChange,
  onClear,
  onApply,
  properties = [],
  isHorizontal = false,
  showApplyButton = false
}) {
  const { propertyTypes: adminPropertyTypes } = useAdmin();

  const [localFilters, setLocalFilters] = useState({
    status: filters.status || 'sale',
    category: filters.category || '',
    type: filters.type || '',
    district: filters.district || '',
    condition: filters.condition || ''
  });

  // Sync internal state if props change
  useEffect(() => {
    setLocalFilters({
      status: filters.status || 'sale',
      category: filters.category || '',
      type: filters.type || '',
      district: filters.district || '',
      condition: filters.condition || ''
    });
  }, [filters]);

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    if (key === 'category') {
      newFilters.type = ''; // Reset type when category changes
    }
    setLocalFilters(newFilters);
    if (!showApplyButton) {
      onChange(newFilters);
    }
  };

  const handleClear = () => {
    const empty = { status: 'sale', category: '', type: '', district: '', condition: '' };
    setLocalFilters(empty);
    if (!showApplyButton) onChange(empty);
    if (onClear) onClear();
  };

  const handleApply = () => {
    if (onApply) onApply(localFilters);
    else onChange(localFilters);
  };

  const categories = useMemo(() => {
    return ['Residential Properties', 'Commercial Properties', 'Industrial Properties'].sort();
  }, []);

  const uniqueTypes = useMemo(() => {
    if (localFilters.category) {
      const filterCat = localFilters.category.toLowerCase();
      let targetCat = '';
      if (filterCat === 'residential properties') targetCat = 'residential';
      else if (filterCat === 'commercial properties') targetCat = 'commercial';
      else if (filterCat === 'industrial properties') targetCat = 'industrial';
      else targetCat = filterCat;

      const categoryTypes = adminPropertyTypes?.filter(pt => pt.category?.toLowerCase() === targetCat) || [];
      if (categoryTypes.length > 0) {
        return categoryTypes.map(pt => pt.name).sort();
      }
    }

    // If no category is selected, return all property types
    if (adminPropertyTypes && adminPropertyTypes.length > 0) {
      return adminPropertyTypes.map(pt => pt.name).sort();
    }

    return ['Apartment', 'Villa', 'Plot'];
  }, [adminPropertyTypes, localFilters.category]);

  const activeFilterCount = Object.values(localFilters).filter(val => val && val !== 'sale').length;

  return (
    <div className={`${styles.filterCard} ${isHorizontal ? styles.horizontalVariant : ''}`}>

      {/* 1. Modern Segmented Control with sliding background */}
      <div className={styles.segmentedControl}>
        {['sale', 'rent'].map((status) => (
          <button
            key={status}
            className={`${styles.segmentBtn} ${localFilters.status === status ? styles.active : ''}`}
            onClick={() => handleChange('status', status)}
          >
            {localFilters.status === status && (
              <motion.div
                layoutId="activeSegment"
                className={styles.activeSegmentBg}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className={styles.segmentText}>
              {status === 'sale' ? 'Buy' : 'Rent'}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.inputsGrid}>
        {/* 2. Category */}
        <CustomSelect
          label="Category"
          value={localFilters.category}
          onChange={(v) => handleChange('category', v)}
          options={categories}
          placeholder="All Categories"
          icon={Layers}
        />

        {/* 3. Property Type */}
        <CustomSelect
          label="Property Type"
          value={localFilters.type}
          onChange={(v) => handleChange('type', v)}
          options={uniqueTypes}
          placeholder="All Types"
          icon={Home}
        />

        {/* 4. District */}
        <CustomSelect
          label="District"
          value={localFilters.district}
          onChange={(v) => handleChange('district', v)}
          options={KERALA_DISTRICTS}
          placeholder="All Districts"
          icon={MapPin}
        />

        {/* 5. Condition */}
        <CustomSelect
          label="Condition"
          value={localFilters.condition}
          onChange={(v) => handleChange('condition', v)}
          options={['New Property', 'Used Property']}
          placeholder="Any Condition"
          icon={Layers}
        />
      </div>

      <div className={styles.actionsContainer}>
        {showApplyButton && (
          <motion.button
            className={styles.searchBtn}
            onClick={handleApply}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search size={18} /> Search
          </motion.button>
        )}

        {(!showApplyButton || activeFilterCount > 0) && (
          <button className={styles.clearBtn} onClick={handleClear}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
