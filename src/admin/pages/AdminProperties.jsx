import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, UploadCloud, User, PauseCircle, PlayCircle } from 'lucide-react';
import PhoneInput from '../../components/common/PhoneInput';
import { FlatIcon, PlotIcon, WarehouseIcon, VillaIcon } from '../components/icons/PropertyIcons';
import { useAdmin } from '../context/AdminContext';
import { addProperty, updateProperty, deleteProperty } from '../../services/propertyService';
import styles from '../styles/admin.module.css';
import { KERALA_DISTRICTS } from '../../data/districts';
import FilterManagementModal from '../components/FilterManagementModal';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { FILTER_TAXONOMY } from '../../data/filterTaxonomy';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminProperties() {
  const { siteSettings, properties, setProperties, propertyTypes, addPropertyType, loading: contextLoading } = useAdmin();
  const PRESET_AMENITIES = siteSettings.amenities || [];
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [idSearchTerm, setIdSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [locFilter, setLocFilter] = useState('All');
  const [distFilter, setDistFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bug Fix: Reset scroll on navigation (prevents ghost white space)
  useEffect(() => {
    const content = document.querySelector(`.${styles.mainContent}`);
    if (content) content.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  // Loading Guard: Prevent blank screens or laggy partial renders
  const isDataLoading = contextLoading || (properties.length === 0 && !contextLoading && loading);

  // Image Upload State
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const agentPhotoRef = useRef(null);

  // Expanded Form State
  const initialForm = {
    title: '', category: '', status: 'Active', isFeatured: false, listingType: 'Sell',
    condition: 'Default',
    price: '', area: '', areaUnit: 'sqft', cent: '', bedrooms: '', bathrooms: '',
    address: '', district: '', mapsUrl: '',
    agentName: 'Property Express',
    agentPhoneCode: '+91',
    agentPhoto: null,
    description: '', propertyHighlights: '', locationHighlights: '', amenities: [], dynamicFilters: {},
    addedOn: new Date().toISOString().slice(0, 10),
    instagramLink: '',
    facebookLink: '',
    youtubeLink: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showToast, setShowToast] = useState('');
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [previewImages, setPreviewImages] = useState([]); // Added to fix ReferenceError
  const [dynKey, setDynKey] = useState('');
  const [dynVal, setDynVal] = useState('');

  const addDynamicFilter = () => {
    if (dynKey.trim() && dynVal.trim()) {
      setFormData(prev => ({ ...prev, dynamicFilters: { ...(prev.dynamicFilters || {}), [dynKey.trim()]: dynVal.trim() } }));
      setDynKey('');
      setDynVal('');
    }
  };
  const removeDynamicFilter = (k) => {
    setFormData(prev => {
      const cnf = { ...(prev.dynamicFilters || {}) };
      delete cnf[k];
      return { ...prev, dynamicFilters: cnf };
    });
  };

  // Additional states for Custom Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCategory, setNewCatCategory] = useState('');
  const [newCatFilters, setNewCatFilters] = useState('');
  const [newCatImage, setNewCatImage] = useState(null);
  const [isCreatingType, setIsCreatingType] = useState(false);

  useEffect(() => {
    if (editingId && selectedProperty) {
      // Issue 13: pre-fill price using the stored numericPrice so the field never resets.
      // numericPrice is a raw number (e.g. 5000000). The save handler converts it back
      // to a formatted string (₹50L / ₹5Cr) and stores both.
      const priceForField = selectedProperty.numericPrice > 0
        ? selectedProperty.numericPrice
        : '';

      setFormData({
        title: selectedProperty.title || '',
        listingType: selectedProperty.listingType || 'Sell',
        category: selectedProperty.category || 'Apartment',
        status: selectedProperty.status || 'Active',
        isFeatured: selectedProperty.isFeatured || false,
        condition: selectedProperty.condition || (selectedProperty.isUsedProperty ? 'Used' : 'Default'),
        price: priceForField,
        area: selectedProperty.area || '',
        areaUnit: selectedProperty.areaUnit || 'sqft',
        cent: selectedProperty.cent || '',
        bedrooms: selectedProperty.bedrooms || '',
        bathrooms: selectedProperty.bathrooms || '',
        address: selectedProperty.address || selectedProperty.location || '',
        district: selectedProperty.district || '',
        mapsUrl: selectedProperty.mapsUrl || '',
        agentName: selectedProperty.agentName || '',
        agentPhone: (() => {
          if (!selectedProperty.agentPhone) return '';
          let phone = selectedProperty.agentPhone;
          const code = selectedProperty.agentPhoneCode || '+91';

          // Remove duplicated country codes (e.g. +91+9145146)
          while (phone.startsWith(code)) {
            phone = phone.slice(code.length).trim();
          }

          // If it still starts with a '+', it's likely a corrupted code
          if (phone.startsWith('+')) {
            phone = phone.replace(/^\+\d+\s*/, '');
          }

          return phone;
        })(),
        agentPhoneCode: selectedProperty.agentPhoneCode || '+91',
        agentPhoto: selectedProperty.agentPhoto || null,
        description: selectedProperty.description || '',
        propertyHighlights: selectedProperty.propertyHighlights || '',
        locationHighlights: selectedProperty.locationHighlights || '',
        amenities: selectedProperty.amenities || [],
        dynamicFilters: selectedProperty.dynamicFilters || {},
        addedOn: selectedProperty.addedOn || new Date().toISOString().slice(0, 10),
        propertyId: selectedProperty.propertyId || '',
        instagramLink: selectedProperty.instagramLink || '',
        facebookLink: selectedProperty.facebookLink || '',
        youtubeLink: selectedProperty.youtubeLink || '',
      });
      // Pre-fill existing images (Cloudinary URLs or base64 previews), prioritizing 'images' which is used by Seller submissions
      const legacyImageArray = selectedProperty.images || selectedProperty.imageUrls;
      setImages(legacyImageArray || (selectedProperty.image ? [selectedProperty.image] : []));
    }
  }, [editingId, selectedProperty]);

  const pathSegments = location.pathname.split('/');
  const activeCategory = decodeURIComponent(pathSegments[pathSegments.length - 1]);

  const pageHeader = useMemo(() => {
    const low = activeCategory.toLowerCase();
    let icon = <WarehouseIcon size={32} />;
    if (low === 'apartments' || low === 'flats') icon = <FlatIcon size={32} />;
    else if (low === 'villas') icon = <VillaIcon size={32} />;
    else if (low === 'commercial' || low === 'warehouses') icon = <WarehouseIcon size={32} />;
    else if (low === 'plots') icon = <PlotIcon size={32} />;

    let title = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    if (activeCategory === 'properties') title = 'All Properties';
    else if (activeCategory === 'Uncategorized') title = 'Uncategorized';

    return { icon, title };
  }, [activeCategory]);

  const uniqueLocations = useMemo(() => {
    const locs = properties.map(p => p.address || p.location).filter(Boolean);
    return [...new Set(locs)];
  }, [properties]);

  const togglePropertyStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateProperty(id, { status: newStatus });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      setShowToast(`Property marked as ${newStatus}`);
      setTimeout(() => setShowToast(''), 2500);
    } catch (error) {
      console.error('Failed to update status:', error);
      setShowToast('Failed to update status');
    }
  };

  const handleDeleteProperty = (property) => {
    setPropertyToDelete(property);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteProperty(propertyToDelete.id);
      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      setShowToast('Property deleted successfully');
      setTimeout(() => setShowToast(''), 3000);
    } catch (error) {
      console.error('Failed to delete:', error);
      setShowToast('Failed to delete property');
      setTimeout(() => setShowToast(''), 3000);
    }
    setPropertyToDelete(null);
  };

  // Ensure every property has a sequential ID starting with PE
  // This handles existing properties that don't have an ID in the database yet.
  const propertiesWithIds = useMemo(() => {
    // 1. Sort all properties by their original creation date (oldest first)
    // This ensures IDs are assigned in the order properties were originally listed.
    const sorted = [...properties].sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    // 2. Track assigned numbers to avoid duplicates
    let lastNum = 0;
    const assignedIds = new Map();

    // First pass: identify existing PE IDs
    sorted.forEach(p => {
      if (p.propertyId && p.propertyId.startsWith('PE')) {
        const num = parseInt(p.propertyId.replace('PE', ''));
        if (!isNaN(num)) {
          assignedIds.set(p.id, p.propertyId);
          if (num > lastNum) lastNum = num;
        }
      }
    });

    // Second pass: assign PE IDs to properties that don't have one
    return sorted.map(p => {
      if (assignedIds.has(p.id)) {
        return { ...p, propertyId: assignedIds.get(p.id) };
      }
      lastNum++;
      const newId = `PE${lastNum.toString().padStart(3, '0')}`;
      return { ...p, propertyId: newId };
    });
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const path = location.pathname;
    const isBaseRoute = path.endsWith('/admin/properties') || path.endsWith('/admin/properties/');

    const catMap = {
      apartments: ['apartment'],          // Apartment-type properties only
      flats: ['flat'],               // Flat-type properties only (separate)
      villas: ['villa'],
      warehouses: ['warehouse', 'commercial'],
      plots: ['plot']
    };

    return propertiesWithIds.filter(p => {
      let matchRouteCat = true;
      if (!isBaseRoute) {
        const activeLower = activeCategory.toLowerCase();
        const targetCats = catMap[activeLower];
        if (targetCats) {
          matchRouteCat = p.category && targetCats.includes(p.category.toLowerCase());
        } else {
          matchRouteCat = p.category && p.category.toLowerCase() === activeLower;
        }
      }

      const term = searchTerm.toLowerCase();
      const idTerm = idSearchTerm.toLowerCase();
      const loc = (p.address || p.location || '').toLowerCase();
      const pId = (p.propertyId || '').toLowerCase();

      const matchSearch = p.title.toLowerCase().includes(term) || loc.includes(term);
      const matchIdSearch = !idTerm || pId.includes(idTerm);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchLoc = locFilter === 'All' || loc === locFilter.toLowerCase();
      const matchCat = catFilter === 'All' || (p.category || '').toLowerCase() === catFilter.toLowerCase();
      const matchDist = distFilter === 'All' || (p.district || '').toLowerCase() === distFilter.toLowerCase();

      let matchPrice = true;
      if (priceFilter === 'Under ₹50L') matchPrice = (p.numericPrice || 0) < 5000000;
      if (priceFilter === '₹50L–₹1Cr') matchPrice = (p.numericPrice || 0) >= 5000000 && (p.numericPrice || 0) <= 10000000;
      if (priceFilter === '₹1Cr–₹5Cr') matchPrice = (p.numericPrice || 0) > 10000000 && (p.numericPrice || 0) <= 50000000;
      if (priceFilter === 'Above ₹5Cr') matchPrice = (p.numericPrice || 0) > 50000000;

      return matchRouteCat && matchSearch && matchIdSearch && matchStatus && matchLoc && matchDist && matchCat && matchPrice;
    }).sort((a, b) => {
      if (sortOrder === 'Price: Low to High') return a.numericPrice - b.numericPrice;
      if (sortOrder === 'Price: High to Low') return b.numericPrice - a.numericPrice;
      if (sortOrder === 'Property ID (Asc)') {
        return (a.propertyId || '').localeCompare(b.propertyId || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortOrder === 'Property ID (Desc)') {
        return (b.propertyId || '').localeCompare(a.propertyId || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });
  }, [propertiesWithIds, activeCategory, searchTerm, idSearchTerm, statusFilter, locFilter, catFilter, priceFilter, distFilter, sortOrder]);

  const clearFilters = () => {
    setSearchTerm(''); setIdSearchTerm(''); setStatusFilter('All'); setPriceFilter('All'); setLocFilter('All'); setDistFilter('All'); setCatFilter('All'); setSortOrder('Newest First');
  };

  useEffect(() => {
    clearFilters();
  }, [activeCategory]);

  const hasActiveFilters = searchTerm || idSearchTerm || statusFilter !== 'All' || priceFilter !== 'All' || locFilter !== 'All' || distFilter !== 'All' || catFilter !== 'All' || sortOrder !== 'Newest First';

  const handleAgentPhoto = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({ ...prev, agentPhoto: ev.target.result }));
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (images.length >= 8) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => {
          if (prev.length >= 8) return prev;
          return [...prev, ev.target.result];
        });
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));
  const moveImage = (index, dir) => {
    if (index + dir < 0 || index + dir >= images.length) return;
    setImages(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index + dir];
      arr[index + dir] = temp;
      return arr;
    });
  };

  // --- Form Logic ---
  const handleFormChange = (prop, val) => {
    setFormData(prev => ({ ...prev, [prop]: val }));
    setFormErrors(prev => prev.filter(err => err !== prop));
  };

  const toggleAmenity = (name) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name)
        ? prev.amenities.filter(a => a !== name)
        : [...prev.amenities, name]
    }));
  };

  const handleCustomAmenity = (e) => {
    if (e.key === 'Enter' && customAmenity.trim()) {
      e.preventDefault();
      toggleAmenity(customAmenity.trim());
      setCustomAmenity('');
    }
  };

  const handleSaveProperty = async () => {
    const required = ['title', 'category', 'status', 'price', 'area', 'address', 'district', 'mapsUrl', 'description'];
    const newErrors = [];
    required.forEach(req => { if (!formData[req]) newErrors.push(req); });

    // Enforce minimum 2 images
    if (images.length < 2) newErrors.push('images');

    if (newErrors.length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setLoading(true);
    setShowToast('Uploading images...');
    try {
      // Upload multiple images to Cloudinary (only new ones starting with data:)
      const uploadedImageUrls = await Promise.all(
        images.map(img => img.startsWith('data:') ? uploadToCloudinary(img) : img)
      );

      // Upload agent photo if new
      let uploadedAgentPhotoUrl = formData.agentPhoto;
      if (formData.agentPhoto && formData.agentPhoto.startsWith('data:')) {
        uploadedAgentPhotoUrl = await uploadToCloudinary(formData.agentPhoto);
      }

      const numericPriceValue = parseInt(formData.price?.toString().replace(/[^0-9]/g, '')) || 0;
      // Store the raw number — formatPrice() handles display formatting (K / L / Cr) at render time
      const formattedPriceValue = numericPriceValue;

      const DEFAULT_UNSPLASH = {
        Flat: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        Apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        Villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        Commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        Plot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      };
      const fallbackImage = DEFAULT_UNSPLASH[formData.category] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';

      // Resolve propertyId — never write undefined to Firestore
      let propertyId;
      if (editingId) {
        // 1. Use what was pre-filled into the form (from selectedProperty)
        // 2. Fall back to the computed propertyId from propertiesWithIds (in-memory)
        // 3. Fall back to the raw selectedProperty.propertyId
        // 4. Final fallback: empty string (Firestore rejects undefined)
        const computedProp = propertiesWithIds.find(p => p.id === editingId);
        propertyId = formData.propertyId
          || computedProp?.propertyId
          || selectedProperty?.propertyId
          || '';
      } else {
        const peIds = properties
          .map(p => p.propertyId)
          .filter(id => id && typeof id === 'string' && id.startsWith('PE'))
          .map(id => parseInt(id.replace('PE', '')))
          .filter(num => !isNaN(num));

        const nextNum = peIds.length > 0 ? Math.max(...peIds) + 1 : 1;
        propertyId = `PE${nextNum.toString().padStart(3, '0')}`;
      }

      const finalData = {
        title: formData.title,
        listingType: formData.listingType || 'Sell',
        category: formData.category,
        status: formData.status,
        isFeatured: formData.isFeatured,
        condition: formData.condition || 'Default',
        price: formattedPriceValue,
        numericPrice: numericPriceValue,
        // Preserve the existing propertyId when editing; only generate a new one for new listings
        propertyId: propertyId,
        area: formData.area,
        cent: formData.cent,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        location: formData.address,
        address: formData.address,
        district: formData.district,
        mapsUrl: formData.mapsUrl,
        agentName: formData.agentName,
        agentPhone: (formData.agentPhoneCode || '+91') + (formData.agentPhone || ''),
        agentPhoneCode: formData.agentPhoneCode || '+91',
        agentPhoto: uploadedAgentPhotoUrl,
        description: formData.description,
        propertyHighlights: formData.propertyHighlights || '',
        locationHighlights: formData.locationHighlights || '',
        amenities: formData.amenities,
        dynamicFilters: formData.dynamicFilters || {},
        addedOn: formData.addedOn || new Date().toISOString().slice(0, 10),
        instagramLink: formData.instagramLink || '',
        facebookLink: formData.facebookLink || '',
        youtubeLink: formData.youtubeLink || '',
        updatedAt: new Date(),
        image: uploadedImageUrls[0] || (editingId ? selectedProperty.image || (selectedProperty.images && selectedProperty.images[0]) : fallbackImage),
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : (editingId ? (selectedProperty.images || selectedProperty.imageUrls) : [fallbackImage]),
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (editingId ? (selectedProperty.images || selectedProperty.imageUrls) : [fallbackImage]),
      };

      if (editingId) {
        await updateProperty(editingId, finalData);
        setShowToast('Property updated successfully!');
        setTimeout(() => setShowToast(''), 3000);
      } else {
        await addProperty({ ...finalData, createdAt: new Date() });
        setShowToast('Property saved successfully!');
        setTimeout(() => setShowToast(''), 3000);
      }
      setEditingId(null);
      setFormData({
        title: '',
        listingType: 'Sell',
        category: '',
        status: 'Active',
        isFeatured: false,
        isUsedProperty: false,
        price: '',
        area: '',
        cent: '',
        bedrooms: 2,
        bathrooms: 2,
        address: '',
        district: '',
        mapsUrl: '',
        agentName: 'Property Express',
        agentPhone: '97787 45146',
        agentPhoneCode: '+91',
        agentPhoto: '',
        description: '',
        amenities: ['Parking', 'Security', 'Gated Community'],
        dynamicFilters: {},
        addedOn: new Date().toISOString().slice(0, 10),
        instagramLink: '',
        facebookLink: '',
        youtubeLink: ''
      });
      setImages([]);
      setIsDrawerOpen(false);
      setFormErrors([]);
    } catch (error) {
      console.error("Save Error:", error);
      setShowToast('Error: ' + error.message);
    } finally {
      setLoading(false);
      setIsDrawerOpen(false); // Close drawer in finally or success
    }
  };

  // Temporary Backfill Function
  const handleBackfillAgents = async () => {
    if (!window.confirm('Are you sure you want to update agent details for ALL existing properties? This cannot be undone.')) return;
    setLoading(true);
    setShowToast('Updating all properties...');
    try {
      const count = await backfillPropertiesAgentDetails('Property Express', '+91 97787 45146');
      setShowToast(`Success! Updated ${count} properties.`);
      // Refresh properties in context
      window.location.reload();
    } catch (error) {
      console.error('Backfill failed:', error);
      setShowToast('Backfill failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const SectionHeading = ({ children }) => (
    <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--admin-stroke)', paddingBottom: '0.5rem', marginBottom: '1.25rem', marginTop: '2rem' }}>
      {children}
    </h3>
  );

  const Label = ({ children, required }) => (
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
      {children} {required && <span style={{ color: '#ed1b24' }}>*</span>}
    </label>
  );

  const getInputStyle = (field) => ({
    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.4)',
    border: formErrors.includes(field) ? '1px solid #ed1b24' : '1px solid var(--admin-glass-border)',
    borderRadius: 12, outline: 'none', color: 'var(--admin-text-main)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontFamily: 'Outfit'
  });

  // Hiding bed/bath for Plot/Warehouse
  const isRoomApplicable = !['Plot', 'Warehouse', 'Commercial'].includes(formData.category);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Outfit' }}>

        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {pageHeader.icon}
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>{pageHeader.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            {activeCategory === 'properties' && (
              <button
                className="btn"
                style={{ flex: isMobile ? 1 : 'none', background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-stroke)', padding: '0.6rem 0.8rem', fontWeight: 600, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
                onClick={() => setIsCatModalOpen(true)}
              >
                + Type
              </button>
            )}
            {activeCategory !== 'properties' && (
              <button
                className="btn"
                style={{ flex: isMobile ? 1 : 'none', background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-stroke)', padding: '0.6rem 0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
                onClick={() => setIsFiltersModalOpen(true)}
              >
                <Edit2 size={14} /> Filters
              </button>
            )}
            <button
              className="btn"
              style={{ flex: isMobile ? 1.5 : 'none', background: '#ed1b24', color: 'white', border: 'none', padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
              onClick={() => {
                setIsDrawerOpen(true);
                setEditingId(null);
                setImages([]);

                let prefilledCat = '';
                if (activeCategory !== 'properties') {
                  const low = activeCategory.toLowerCase();
                  if (low === 'apartments') prefilledCat = 'Apartment';
                  else if (low === 'flats') prefilledCat = 'Flat';
                  else if (low === 'villas') prefilledCat = 'Villa';
                  else if (['commercial', 'warehouses'].includes(low)) prefilledCat = 'Commercial';
                  else if (low === 'plots') prefilledCat = 'Plot';
                  else if (low === 'uncategorized') prefilledCat = 'Uncategorized';
                  else {
                    const custom = propertyTypes.find(c => c.name.toLowerCase() === low);
                    prefilledCat = custom ? custom.name : activeCategory;
                  }
                }

                setFormData({ ...initialForm, category: prefilledCat });
                setFormErrors([]);
              }}
            >
              <Plus size={16} /> Add Property
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`${styles.glassCard} ${styles.adminReviewGrid}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              <input
                type="text" placeholder="Search by title or location..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: 40, borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--admin-text-main)' }}
              />
              {searchTerm && <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
            </div>
            <div style={{ position: 'relative', flex: '0 0 180px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              <input
                type="text" placeholder="Property ID (PE001)"
                value={idSearchTerm} onChange={(e) => setIdSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.2rem', height: 40, borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--admin-text-main)', fontSize: '0.85rem' }}
              />
              {idSearchTerm && <X size={14} onClick={() => setIdSearchTerm('')} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
            {activeCategory === 'properties' && (
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
                <option value="All">All Categories</option>
                {propertyTypes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
              <option value="All">Price: All</option>
              <option value="Under ₹50L">Under ₹50L</option>
              <option value="₹50L–₹1Cr">₹50L–₹1Cr</option>
              <option value="₹1Cr–₹5Cr">₹1Cr–₹5Cr</option>
              <option value="Above ₹5Cr">Above ₹5Cr</option>
            </select>
            <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
              <option value="All">Location: All</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc.toLowerCase()}>{loc}</option>)}
            </select>
            <select value={distFilter} onChange={e => setDistFilter(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
              <option value="All">District: All</option>
              {KERALA_DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: 40, padding: '0 0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
              <option value="Newest First">Newest First</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Property ID (Asc)">Property ID (Asc)</option>
              <option value="Property ID (Desc)">Property ID (Desc)</option>
            </select>
          </div>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
            {hasActiveFilters && <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#ed1b24', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Clear All Filters</button>}
            <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: 300 }}>{filteredProperties.length} results found</span>
          </div>
        </div>

        {/* Main Table / Mobile Cards */}
        <div className={styles.glassCard} style={{ minHeight: 400, padding: isMobile ? '0.75rem' : '1.5rem' }}>
          {isDataLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...Array(5)].map((_, idx) => (
                <div key={idx} style={{ height: 80, borderRadius: 16, background: 'rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 1.5s infinite' }} />
                </div>
              ))}
              <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--admin-text-muted)' }}>
              <Search size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '0.25rem' }}>
                {distFilter !== 'All'
                  ? `No properties found in ${distFilter}`
                  : catFilter !== 'All'
                    ? `No ${catFilter} units found`
                    : 'No matching properties'
                }
              </p>
              <p style={{ fontSize: '0.85rem' }}>Try adjusting your filters or search terms.</p>
            </div>
          ) : isMobile ? (
            /* Mobile Card View (Pill Cards) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredProperties.map((prop) => {
                const isExpanded = expandedRowId === prop.id;
                return (
                  <motion.div
                    key={prop.id}
                    layout
                    onClick={() => setExpandedRowId(isExpanded ? null : prop.id)}
                    style={{
                      background: 'var(--admin-glass-bg)',
                      border: '1px solid var(--admin-glass-border)',
                      borderRadius: isExpanded ? 24 : 40,
                      padding: isExpanded ? '1.25rem' : '0.75rem 1.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.title}</h4>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 4, background: 'rgba(0,0,0,0.05)', color: 'var(--admin-text-muted)' }}>{prop.propertyId || '---'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>{prop.category}</p>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--admin-text-muted)' }} />
                          <p style={{ margin: 0, fontSize: '0.75rem', color: (prop.listingType === 'Rent' || prop.status === 'For Rent') ? '#007bff' : '#ed1b24', fontWeight: 700, textTransform: 'uppercase' }}>{prop.listingType || 'Sell'}</p>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: '0.5rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                        <Plus size={18} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ marginTop: '1.25rem', borderTop: '1px solid var(--admin-stroke)', paddingTop: '1.25rem' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>District</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' }}>{prop.district || 'Not specified'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Location</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' }}>{prop.address || prop.location}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Price</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ed1b24' }}>{formatPrice(prop.numericPrice || prop.price)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Status</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePropertyStatus(prop.id, prop.status); }}
                                style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: prop.status === 'Active' ? 'rgba(46,204,113,0.1)' : 'rgba(85,85,85,0.1)', color: prop.status === 'Active' ? '#2ecc71' : '#555555', border: 'none', cursor: 'pointer' }}>
                                {prop.status}
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn"
                              style={{ flex: 1, background: '#18181a', color: 'white', border: 'none', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProperty(prop);
                                setEditingId(prop.id);
                                setIsDrawerOpen(true);
                                setFormErrors([]);
                              }}
                            >
                              <Edit2 size={16} /> Edit
                            </button>
                            <button
                              className="btn"
                              style={{ flex: 1, background: prop.status === 'Active' ? 'rgba(0,0,0,0.05)' : 'rgba(46,204,113,0.1)', color: prop.status === 'Active' ? '#555' : '#2ecc71', border: 'none', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                              onClick={(e) => { e.stopPropagation(); togglePropertyStatus(prop.id, prop.status); }}
                            >
                              {prop.status === 'Active' ? 'Hide' : 'Show'}
                            </button>
                            <button
                              className="btn"
                              style={{ flex: 1, background: 'rgba(237,27,36,0.1)', color: '#ed1b24', border: 'none', borderRadius: 12, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteProperty(prop); }}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Desktop Table View */
            <div style={{ overflowX: 'auto' }}>
              <motion.table initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-stroke)' }}>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem', minWidth: '80px' }}>ID</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Title</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Type</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Category</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Location</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Price</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((prop, i) => (
                    <motion.tr key={prop.id} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ borderBottom: '1px solid var(--admin-stroke)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--admin-text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{prop.propertyId}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{prop.title}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: (prop.listingType === 'Rent' || prop.status === 'For Rent') ? '#007bff' : '#ed1b24', fontSize: '0.75rem' }}>{prop.listingType || 'Sell'}</td>
                      <td style={{ padding: '1rem', fontWeight: 300 }}>{prop.category}</td>
                      <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)' }}>{prop.address || prop.location}</td>
                      <td style={{ padding: '1rem', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(prop.numericPrice || prop.price)}</td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => togglePropertyStatus(prop.id, prop.status)}
                          style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: prop.status === 'Active' ? 'rgba(46,204,113,0.1)' : 'rgba(85,85,85,0.1)', color: prop.status === 'Active' ? '#2ecc71' : '#555555', border: 'none', cursor: 'pointer', outline: 'none' }}>
                          {prop.status}
                        </button>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className={styles.iconBtn} onClick={() => {
                            setSelectedProperty(prop);
                            setEditingId(prop.id);
                            setIsDrawerOpen(true);
                            setFormErrors([]);
                          }} title="Edit"><Edit2 size={16} /></button>
                          
                          <button
                            onClick={() => togglePropertyStatus(prop.id, prop.status)}
                            style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: prop.status === 'Active' ? '#888' : '#2ecc71', cursor: 'pointer' }}
                          >
                            {prop.status === 'Active' ? 'Hide' : 'Show'}
                          </button>

                          <button
                            className={styles.iconBtn}
                            style={{ color: '#ed1b24' }}
                            onClick={() => handleDeleteProperty(prop)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .no-spinners::-webkit-inner-spin-button, 
        .no-spinners::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinners { -moz-appearance: textfield; }
      `}} />

        {/* Slide-in Form Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
              onClick={() => setIsDrawerOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 580, height: '100%', background: 'var(--admin-glass-bg)',
                  backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                  borderLeft: '1px solid var(--admin-glass-border)',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Drawer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '1.25rem 1.5rem' : '2rem 2.5rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
                    {editingId ? 'Edit Property' : 'Add New Property'}
                  </h2>
                  <button onClick={() => setIsDrawerOpen(false)} className={styles.iconBtn} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.5rem', minWidth: 36, minHeight: 36 }}><X size={18} /></button>
                </div>

                {/* Scrollable Form Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 1.5rem 2rem' : '0 2.5rem 2.5rem' }}>

                  {formErrors.length > 0 && <p style={{ color: '#ed1b24', fontSize: '0.8rem', marginTop: '1rem', fontWeight: 600 }}>Please fill out all required fields.</p>}

                  {/* Section 1 */}
                  <SectionHeading>Section 1 — Basic Information</SectionHeading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <Label required>Property Title</Label>
                      <input type="text" placeholder="Enter property title..." value={formData.title} onChange={e => handleFormChange('title', e.target.value)} style={getInputStyle('title')} />
                    </div>
                    <div>
                      <Label required>District</Label>
                      <select value={formData.district} onChange={e => handleFormChange('district', e.target.value)} style={getInputStyle('district')}>
                        <option value="">Select District</option>
                        {KERALA_DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <Label required>Listing Type</Label>
                        <select value={formData.listingType} onChange={e => handleFormChange('listingType', e.target.value)} style={getInputStyle('listingType')}>
                          <option value="Sell">Sell</option>
                          <option value="Rent">Rent</option>
                        </select>
                      </div>
                      <div>
                        <Label required>Category</Label>
                        <select
                          value={formData.category}
                          onChange={e => handleFormChange('category', e.target.value)}
                          style={{
                            ...getInputStyle('category'),
                            background: (editingId === null && activeCategory !== 'properties') ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.4)',
                            cursor: (editingId === null && activeCategory !== 'properties') ? 'not-allowed' : 'pointer'
                          }}
                          disabled={editingId === null && activeCategory !== 'properties'}
                        >
                          <option value="">Select Category</option>
                          {propertyTypes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label required>Status</Label>
                        <select value={formData.status} onChange={e => handleFormChange('status', e.target.value)} style={getInputStyle('status')}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                          <input type="checkbox" checked={formData.isFeatured} onChange={e => handleFormChange('isFeatured', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                          <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: formData.isFeatured ? '#18181a' : 'rgba(0,0,0,0.1)', borderRadius: 24, transition: '0.3s' }}>
                            <span style={{ position: 'absolute', height: 18, width: 18, left: 3, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.3s', transform: formData.isFeatured ? 'translateX(20px)' : 'translateX(0)' }}></span>
                          </span>
                        </label>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Is Featured?</span>
                      </div>

                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Property Condition</label>
                        <select
                          value={formData.condition}
                          onChange={e => handleFormChange('condition', e.target.value)}
                          style={{
                            width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.4)',
                            border: formErrors.includes('condition') ? '1px solid #ed1b24' : '1px solid var(--admin-glass-border)',
                            borderRadius: 12, outline: 'none', color: 'var(--admin-text-main)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontFamily: 'Outfit'
                          }}
                        >
                          <option value="Default">Default (No tag)</option>
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Added On Date */}
                  <div style={{ marginTop: '1rem' }}>
                    <Label required>Added On Date</Label>
                    <input
                      type="date"
                      value={formData.addedOn}
                      onChange={e => handleFormChange('addedOn', e.target.value)}
                      style={getInputStyle('addedOn')}
                    />
                  </div>

                  {/* Section 2 */}
                  <SectionHeading>Section 2 — Pricing & Size</SectionHeading>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <Label required>Price (₹)</Label>
                      <input type="number" placeholder="Enter price in ₹..." className="no-spinners" value={formData.price} onChange={e => handleFormChange('price', e.target.value)} style={getInputStyle('price')} />
                    </div>
                    <div>
                      <Label required>Area (sqft)</Label>
                      <input type="number" placeholder="Enter area in sqft..." className="no-spinners" value={formData.area} onChange={e => handleFormChange('area', e.target.value)} style={getInputStyle('area')} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <Label>Cent (Optional)</Label>
                      <input type="number" placeholder="Enter cent..." className="no-spinners" value={formData.cent} onChange={e => handleFormChange('cent', e.target.value)} style={getInputStyle('cent')} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isRoomApplicable && (
                      <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <Label>Bedrooms</Label>
                            <input type="number" placeholder="No. of bedrooms" className="no-spinners" value={formData.bedrooms} onChange={e => handleFormChange('bedrooms', e.target.value)} style={getInputStyle('bedrooms')} />
                          </div>
                          <div>
                            <Label>Bathrooms</Label>
                            <input type="number" placeholder="No. of bathrooms" className="no-spinners" value={formData.bathrooms} onChange={e => handleFormChange('bathrooms', e.target.value)} style={getInputStyle('bathrooms')} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Section 3 */}
                  <SectionHeading>Section 3 — Location</SectionHeading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <Label required>Full Address</Label>
                      <input type="text" placeholder="Enter full address..." value={formData.address} onChange={e => handleFormChange('address', e.target.value)} style={getInputStyle('address')} />
                    </div>
                    <div>
                      <Label required>Google Maps Embed URL</Label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem', marginTop: '-0.25rem' }}>A Google Maps link is compulsory to enable our high-precision radial clustering filters.</p>
                      <input type="text" placeholder="Paste standard or embed Google Maps URL..." value={formData.mapsUrl} onChange={e => handleFormChange('mapsUrl', e.target.value)} style={getInputStyle('mapsUrl')} />
                    </div>
                  </div>

                  {/* Section 4 */}
                  <SectionHeading>Section 4 — Agent Details</SectionHeading>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', border: '1px dashed var(--admin-stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }} onClick={() => agentPhotoRef.current?.click()}>
                      {formData.agentPhoto ? (
                        <img src={formData.agentPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Agent" />
                      ) : (
                        <User size={32} color="var(--admin-text-muted)" />
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }} ref={agentPhotoRef} onChange={handleAgentPhoto} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      <div>
                        <Label>Agent Name</Label>
                        <input type="text" placeholder="Assigned agent name..." value={formData.agentName} onChange={e => handleFormChange('agentName', e.target.value)} style={getInputStyle('agentName')} />
                      </div>
                      <div>
                        <Label>Agent Phone</Label>
                        <PhoneInput
                          value={formData.agentPhone}
                          countryCode={formData.agentPhoneCode || '+91'}
                          onChange={(phone, code) => handleFormChange('agentPhone', phone) || setFormData(prev => ({ ...prev, agentPhoneCode: code }))}
                          placeholder="Agent contact number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <SectionHeading>Section 5 — Descriptions</SectionHeading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <Label required>Introduction</Label>
                      <textarea placeholder="Write a brief introduction..." rows={3} value={formData.description} onChange={e => handleFormChange('description', e.target.value)} style={{ ...getInputStyle('description'), minHeight: 80, resize: 'vertical' }} />
                    </div>
                    <div>
                      <Label>Property Highlights</Label>
                      <textarea placeholder="List key property highlights..." rows={4} value={formData.propertyHighlights} onChange={e => handleFormChange('propertyHighlights', e.target.value)} style={{ ...getInputStyle('propertyHighlights'), minHeight: 100, resize: 'vertical' }} />
                    </div>
                    <div>
                      <Label>Location Highlights</Label>
                      <textarea placeholder="List key location highlights..." rows={4} value={formData.locationHighlights} onChange={e => handleFormChange('locationHighlights', e.target.value)} style={{ ...getInputStyle('locationHighlights'), minHeight: 100, resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* Social Media Links (Optional) */}
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Label>Social Media Links <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>(all optional — buttons shown only if filled)</span></Label>
                    <input
                      type="url"
                      placeholder="Instagram Reel / Post URL — https://www.instagram.com/reel/..."
                      value={formData.instagramLink}
                      onChange={e => handleFormChange('instagramLink', e.target.value)}
                      style={{ ...getInputStyle('instagramLink'), borderLeft: '3px solid #E1306C' }}
                    />
                    <input
                      type="url"
                      placeholder="Facebook Post / Reel URL — https://www.facebook.com/..."
                      value={formData.facebookLink}
                      onChange={e => handleFormChange('facebookLink', e.target.value)}
                      style={{ ...getInputStyle('facebookLink'), borderLeft: '3px solid #1877F2' }}
                    />
                    <input
                      type="url"
                      placeholder="YouTube Video URL — https://www.youtube.com/watch?v=..."
                      value={formData.youtubeLink}
                      onChange={e => handleFormChange('youtubeLink', e.target.value)}
                      style={{ ...getInputStyle('youtubeLink'), borderLeft: '3px solid #FF0000' }}
                    />
                  </div>

                  {/* Section 6 */}
                  <SectionHeading>Section 6 — Amenities</SectionHeading>
                  <div>
                    <Label>Amenities</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {PRESET_AMENITIES.map(amenity => {
                        const isActive = formData.amenities.includes(amenity);
                        return (
                          <button key={amenity} onClick={() => toggleAmenity(amenity)} style={{ padding: '0.4rem 0.8rem', borderRadius: 20, background: isActive ? '#18181a' : 'rgba(255,255,255,0.4)', color: isActive ? 'white' : 'var(--admin-text-main)', border: isActive ? '1px solid transparent' : '1px solid var(--admin-stroke)', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}>
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom additions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      {formData.amenities.filter(a => !PRESET_AMENITIES.includes(a)).map(amenity => (
                        <span key={amenity} style={{ padding: '0.4rem 0.8rem', borderRadius: 20, background: '#18181a', color: 'white', border: '1px solid transparent', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {amenity} <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleAmenity(amenity)} />
                        </span>
                      ))}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" placeholder="Type custom amenity..." value={customAmenity} onChange={e => setCustomAmenity(e.target.value)} onKeyDown={handleCustomAmenity} style={{ ...getInputStyle('customAmenity'), padding: '0.4rem 1rem', width: 220, borderRadius: 20 }} />
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.preventDefault();
                            if (customAmenity.trim()) {
                              toggleAmenity(customAmenity.trim());
                              setCustomAmenity('');
                            }
                          }}
                          style={{ background: '#18181a', color: 'white', border: 'none', borderRadius: 20, padding: '0 1.2rem', height: '100%', minHeight: 38, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section 6.5 - Dynamic Filters */}
                  <SectionHeading>Section 6.5 — Dynamic Attributes (Optional)</SectionHeading>
                  <div>
                    <Label>Category-Specific Attributes</Label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '1.25rem' }}>
                      These attributes are defined for the <strong>{formData.category || 'selected'}</strong> category.
                    </p>

                    {(() => {
                      const dbTaxonomy = siteSettings.taxonomy?.[formData.category]?.subFilters;
                      const staticTaxonomy = FILTER_TAXONOMY[formData.category]?.subFilters || [];
                      const categoryFilters = dbTaxonomy || staticTaxonomy;

                      if (!categoryFilters || categoryFilters.length === 0) {
                        return <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', marginBottom: '2rem' }}>No specific attributes defined for this category.</p>;
                      }

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                          {categoryFilters.map(filter => (
                            <div key={filter.key}>
                              <Label>{filter.label}</Label>
                              {filter.type === 'dropdown' ? (
                                <select
                                  value={formData.dynamicFilters?.[filter.key] || ''}
                                  onChange={e => handleFormChange('dynamicFilters', { ...formData.dynamicFilters, [filter.key]: e.target.value })}
                                  style={getInputStyle(filter.key)}
                                >
                                  <option value="">Select {filter.label}...</option>
                                  {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={`Enter ${filter.label.toLowerCase()}...`}
                                  value={formData.dynamicFilters?.[filter.key] || ''}
                                  onChange={e => handleFormChange('dynamicFilters', { ...formData.dynamicFilters, [filter.key]: e.target.value })}
                                  style={getInputStyle(filter.key)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <Label>Other Manual Attributes</Label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>Add extra characteristics not covered by the category defaults.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                      <input type="text" placeholder="e.g. Construction Year" value={dynKey} onChange={e => setDynKey(e.target.value)} style={getInputStyle('dynKey')} />
                      <input type="text" placeholder="e.g. 2024" value={dynVal} onChange={e => setDynVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDynamicFilter(); } }} style={getInputStyle('dynVal')} />
                      <button className="btn" onClick={(e) => { e.preventDefault(); addDynamicFilter(); }} style={{ height: 43, background: '#18181a', color: 'white', borderRadius: 12, padding: '0 1.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.entries(formData.dynamicFilters || {}).map(([k, v]) => {
                        // Check if this key is part of category filters to avoid duplicate showing (optional, but cleaner)
                        const dbTaxonomy = siteSettings.taxonomy?.[formData.category]?.subFilters;
                        const staticTaxonomy = FILTER_TAXONOMY[formData.category]?.subFilters || [];
                        const isCategoryFilter = (dbTaxonomy || staticTaxonomy).some(f => f.key === k);

                        if (isCategoryFilter) return null;

                        return (
                          <span key={k} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: 'rgba(0,0,0,0.05)', border: '1px solid var(--admin-stroke)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                            <strong style={{ color: 'var(--admin-text-muted)' }}>{k}:</strong> {v}
                            <X size={14} style={{ cursor: 'pointer', color: '#ed1b24', marginLeft: '0.25rem' }} onClick={() => removeDynamicFilter(k)} />
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 7 */}
                  <SectionHeading>Section 7 — Property Images</SectionHeading>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Label required>Upload Images</Label>
                      <span style={{ fontSize: '0.8rem', color: images.length >= 8 ? '#ed1b24' : 'var(--admin-text-muted)' }}>{images.length}/8 — min 2 required</span>
                    </div>

                    <div onClick={() => images.length < 8 && fileInputRef.current?.click()} style={{ border: formErrors.includes('images') ? '2px dashed #ed1b24' : '2px dashed var(--admin-stroke)', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', cursor: images.length < 8 ? 'pointer' : 'not-allowed', opacity: images.length < 8 ? 1 : 0.5 }}>
                      <UploadCloud size={32} color="var(--admin-text-muted)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-body)', fontWeight: 300 }}>Drag images here or click to browse</p>
                      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                    {formErrors.includes('images') && <span style={{ color: '#ed1b24', fontSize: '12px', marginTop: '0.25rem', display: 'block' }}>Please upload at least 2 images (minimum required).</span>}

                    {images.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '1rem 0', marginTop: '0.5rem' }}>
                        {images.map((src, i) => (
                          <div key={i} style={{ position: 'relative', flexShrink: 0, width: 100, height: 100, borderRadius: 12, overflow: 'hidden' }}>
                            <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: '#ed1b24', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>COVER</span>}
                            <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                            <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                              {i > 0 && <button onClick={() => moveImage(i, -1)} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>&lt;</button>}
                              {i < images.length - 1 && <button onClick={() => moveImage(i, 1)} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>&gt;</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', gap: '1rem', position: 'sticky', bottom: 0 }}>
                  <button className="btn" onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-stroke)', padding: '1rem 2rem', fontWeight: 600 }}>Cancel</button>
                  <button className="btn" onClick={handleSaveProperty} style={{ background: '#ed1b24', color: 'white', border: 'none', padding: '1rem', fontWeight: 700, flex: 1, boxShadow: '0 8px 30px rgba(237,27,36,0.3)' }}>
                    {editingId ? 'Save Changes' : 'Save Property'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed', bottom: '5rem', right: '2rem', zIndex: 200,
              background: 'var(--admin-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--admin-glass-border)', padding: '1rem 1.5rem',
              borderRadius: 16, display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontWeight: 600, color: 'var(--admin-text-main)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ background: '#2ecc71', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Custom Category Creation Modal */}
      <AnimatePresence>
        {isCatModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setIsCatModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={styles.glassCard}
              style={{ width: '100%', maxWidth: 450, padding: '2.5rem' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>New Property Type</h2>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Define a new property category. Price and Location filters will be added automatically.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <Label required>Type Name</Label>
                  <input
                    type="text" placeholder="e.g. Penthouse, Studio..."
                    value={newCatName} onChange={e => setNewCatName(e.target.value)}
                    style={getInputStyle()}
                  />
                </div>
                <div>
                  <Label required>Category</Label>
                  <select
                    value={newCatCategory} onChange={e => setNewCatCategory(e.target.value)}
                    style={getInputStyle()}
                  >
                    <option value="" disabled>— Select a Category —</option>
                    <option value="residential">Residential Properties</option>
                    <option value="commercial">Commercial Properties</option>
                    <option value="industrial">Industrial Properties</option>
                  </select>
                </div>
                <div>
                  <Label>Additional Filters (Optional)</Label>
                  <input
                    type="text" placeholder="e.g. Furnishing, Floor No (comma separated)"
                    value={newCatFilters} onChange={e => setNewCatFilters(e.target.value)}
                    style={getInputStyle()}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>Separate multiple custom parameters with commas.</p>
                </div>

                <div>
                  <Label required>Category Background Image</Label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = ev => setNewCatImage(ev.target.result);
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    style={{ ...getInputStyle(), padding: '0.5rem' }}
                  />
                  {newCatImage && (
                    <div style={{ marginTop: '0.75rem', width: 120, height: 75, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-stroke)' }}>
                      <img src={newCatImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn" onClick={() => { setIsCatModalOpen(false); setNewCatImage(null); }} style={{ flex: 1, background: 'rgba(0,0,0,0.05)', border: 'none', padding: '1rem', fontWeight: 600 }} disabled={isCreatingType}>Cancel</button>
                  <button
                    className="btn"
                    style={{ flex: 1, background: '#ed1b24', color: 'white', border: 'none', padding: '1rem', fontWeight: 700, opacity: (!newCatName.trim() || !newCatCategory || !newCatImage || isCreatingType) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: (!newCatName.trim() || !newCatCategory || !newCatImage || isCreatingType) ? 'not-allowed' : 'pointer' }}
                    disabled={!newCatName.trim() || !newCatCategory || !newCatImage || isCreatingType}
                    onClick={async () => {
                      if (!newCatName.trim() || !newCatCategory || !newCatImage) return;
                      setIsCreatingType(true);
                      try {
                        const finalImageUrl = await uploadToCloudinary(newCatImage);
                        const filtersArray = newCatFilters.split(',').map(f => f.trim()).filter(Boolean);

                        await addPropertyType(newCatName, finalImageUrl, filtersArray, { category: newCatCategory });

                        setIsCatModalOpen(false);
                        setNewCatName('');
                        setNewCatFilters('');
                        setNewCatImage(null);
                        setShowToast('Property Type Created!');
                        setTimeout(() => setShowToast(''), 2500);
                      } catch (err) {
                        console.error('Error creating type:', err);
                        alert('Failed to upload image or create type.');
                      } finally {
                        setIsCreatingType(false);
                      }
                    }}
                  >
                    {isCreatingType ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Creating...
                      </>
                    ) : 'Create Type'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {propertyToDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}
            onClick={() => setPropertyToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 400, padding: '2rem', textAlign: 'center', background: '#ffffff', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.1)' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(237,27,36,0.1)', color: '#ed1b24', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: '#18181b' }}>Delete Property?</h2>
              <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{propertyToDelete.title}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setPropertyToDelete(null)} style={{ flex: 1, padding: '0.875rem', background: '#f4f4f5', color: '#18181b', border: 'none', fontWeight: 600, borderRadius: 12 }}>Cancel</button>
                <button className="btn" onClick={confirmDeleteProperty} style={{ flex: 1, padding: '0.875rem', background: '#ed1b24', color: 'white', border: 'none', fontWeight: 700, borderRadius: 12 }}>Confirm Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <FilterManagementModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        categoryName={resolveCategoryFromSlug(activeCategory, propertyTypes)}
      />
    </>
  );
}

// Helper to resolve internal category ID from URL slug
function resolveCategoryFromSlug(slug, propertyTypes) {
  const low = slug.toLowerCase();

  // Base categories resolution — Flats and Apartments are SEPARATE types
  if (low === 'apartments') return 'Apartment';
  if (low === 'flats') return 'Flat';
  if (low === 'villas') return 'Villa';
  if (low === 'plots') return 'Plot';
  if (low === 'commercial' || low === 'warehouses') return 'Commercial';

  // Try dynamic resolution
  if (propertyTypes) {
    const custom = propertyTypes.find(c => c.name.toLowerCase() === low);
    if (custom) return custom.name;
  }

  // Fallback to literal slug capitalization
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
