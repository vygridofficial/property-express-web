import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { getAllProperties } from '../services/propertyService';
import PropertyCard from '../components/ui/PropertyCard';
import FilterMenu from '../components/ui/FilterMenu';
import SEO from '../components/common/SEO';
import styles from './Results.module.css';

const useQuery = () => new URLSearchParams(useLocation().search);

export default function Results() {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    category: query.get('category') || '',
    type: query.get('type') || '',
    bhk: query.get('bhk') || '',
    status: query.get('status') || '',
    district: query.get('district') || '',
    features: query.get('features') || ''
  });

  useEffect(() => {
    // Update filters if URL changes
    setFilters({
      category: query.get('category') || '',
      type: query.get('type') || '',
      bhk: query.get('bhk') || '',
      status: query.get('status') || '',
      district: query.get('district') || '',
      features: query.get('features') || ''
    });
  }, [location.search]);

  useEffect(() => {
    // Fetch properties
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await getAllProperties();
        setProperties(data);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    navigate(`/results?${params.toString()}`, { replace: true });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { category: '', type: '', bhk: '', status: '', district: '', features: '' };
    setFilters(emptyFilters);
    updateURLParams(emptyFilters);
  };

  const categoryToTypesMap = {
    'residential': ['villa', 'apartment', 'flat', 'residential'],
    'residential properties': ['villa', 'apartment', 'flat', 'residential'],
    'commercial': ['commercial', 'office', 'shop', 'warehouse'],
    'commercial properties': ['commercial', 'office', 'shop', 'warehouse'],
    'industrial': ['industrial', 'factory', 'land', 'warehouse'],
    'industrial properties': ['industrial', 'factory', 'land', 'warehouse'],
    'agricultural': ['agricultural', 'farm', 'land'],
    'plot': ['plot', 'land', 'residential plot', 'commercial plot']
  };

  // Apply active filters
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      let match = true;
      const propCategory = prop.category?.toLowerCase() || '';
      const propType = prop.propertyType?.toLowerCase() || '';

      if (filters.category) {
        const selectedCategories = filters.category.split(',').map(c => c.toLowerCase());
        
        let catMatch = false;
        for (const cat of selectedCategories) {
           const mappedAllowed = categoryToTypesMap[cat] || [cat];
           if (mappedAllowed.includes(propCategory) || mappedAllowed.includes(propType)) {
             catMatch = true;
           }
        }
        if (!catMatch) match = false;
      }

      if (filters.type) {
        const selectedTypes = filters.type.split(',').map(t => t.toLowerCase());
        if (!selectedTypes.includes(propType) && !selectedTypes.includes(propCategory)) {
          match = false;
        }
      }
      
      if (filters.bhk) {
        const selectedBhkValues = filters.bhk.split(',').map(bhk => {
           if (bhk === '4BHK+') return 4;
           return parseInt(bhk.replace(/\D/g, ''), 10);
        });
        const propBeds = prop.bedrooms || prop.beds || 0;
        
        let bhkMatch = false;
        for (const val of selectedBhkValues) {
           if (val === 4 && propBeds >= 4) bhkMatch = true;
           else if (val === propBeds) bhkMatch = true;
        }
        if (!bhkMatch) match = false;
      }

      if (filters.status) {
        const selectedStatuses = filters.status.split(',').map(s => s.toLowerCase());
        const propStatusStr = prop.status?.toLowerCase() || '';
        const propPurposeStr = prop.purpose?.toLowerCase() || prop.listingType?.toLowerCase() || ''; 
        
        let statusMatch = false;
        for (const selectedStatus of selectedStatuses) {
           if (selectedStatus === 'rent' && (propStatusStr.includes('rent') || propPurposeStr.includes('rent'))) statusMatch = true;
           if (selectedStatus === 'sale' && (propStatusStr.includes('sale') || propPurposeStr.includes('sale') || propStatusStr === 'active')) statusMatch = true;
        }
        if (!statusMatch) match = false;
      }

      if (filters.district && prop.district?.toLowerCase() !== filters.district.toLowerCase()) match = false;

      // Check features
      if (filters.features) {
        const requiredFeatures = filters.features.split(',').filter(Boolean);
        const propFeatures = [...(prop.amenities || []), ...(prop.features || [])].map(f => f.toLowerCase());
        
        // Ensure property has ALL required features
        const hasAllFeatures = requiredFeatures.every(reqFeature => 
          propFeatures.includes(reqFeature.toLowerCase())
        );
        if (!hasAllFeatures) match = false;
      }

      return match;
    });
  }, [properties, filters]);

  // Antigravity animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={styles.resultsPage}>
      <SEO title="Property Results | Property Express" description="Filter and find your ideal property." />
      
      {/* Top Header Section */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div className={styles.headerTitle}>
              <h1 className={styles.title}>Explore Properties</h1>
              <p className={styles.subtitle}>
                {filteredProperties.length} {filteredProperties.length === 1 ? 'result' : 'results'} found
                {activeFilterCount > 0 && ` matching your criteria`}
              </p>
            </div>
            <button 
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal size={20} />
              Filters {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className={`container ${styles.mainLayout}`}>
        {/* Desktop Sidebar Filters */}
        <aside className={`${styles.sidebar} ${showMobileFilters ? styles.showMobile : ''}`}>
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarHeaderMobile}>
              <h3>Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>

            <FilterMenu 
              filters={filters} 
              properties={properties} 
              onChange={handleFilterChange} 
              onClear={clearFilters}
              showApplyButton={false}
              isHorizontal={true}
            />

            {/* Apply filters button for mobile */}
            <div className={styles.mobileApplyWrap}>
              <button className={styles.applyBtn} onClick={() => setShowMobileFilters(false)}>
                Show {filteredProperties.length} Results
              </button>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className={styles.resultsContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Finding perfect properties...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <motion.div 
              className={styles.grid}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {filteredProperties.map(property => (
                  <motion.div key={property.id} variants={itemVariants} layoutId={`prop-${property.id}`}>
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><SearchIcon size={48} /></div>
              <h2>No Properties Found</h2>
              <p>We couldn't find any properties matching your exact criteria.</p>
              <button className={styles.clearBtnPrimary} onClick={clearFilters}>
                Clear Filters & Try Again
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Backdrop */}
      {showMobileFilters && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.mobileBackdrop}
          onClick={() => setShowMobileFilters(false)}
        />
      )}
    </div>
  );
}
