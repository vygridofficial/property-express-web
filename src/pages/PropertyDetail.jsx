import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Map, BedDouble, Bath, Scaling, Calendar, ShieldCheck, Check, Phone, MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { getPropertyById } from '../services/propertyService';
import { formatDate } from '../utils/formatDate';
import { submitLead } from '../services/leadService';
import EnquirySuccessPopup from '../components/common/EnquirySuccessPopup';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import styles from './PropertyDetail.module.css';
import brandLogo from '../assets/logo.png';
import Lightbox from '../components/ui/Lightbox';
import { formatPrice } from '../utils/formatPrice';
import { getPropertyCoordinates } from '../utils/geo';
import SEO from '../components/common/SEO';
import { isValidEmail, isValidPhone } from '../utils/validation';
import PhoneInput from '../components/common/PhoneInput';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(location.state?.property || null);
  const [agent, setAgent] = useState(null);
  const [formStatus, setFormStatus] = useState('idle');
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    phoneCode: '+91',
    email: '',
    message: 'I am interested in Property Express listing...'
  });
  const [errors, setErrors] = useState({});
  const [currentMainIndex, setCurrentMainIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    // If we have data from state, we can already initialize agent info
    if (property) {
      if (property.sellerName || property.agentName) {
        setAgent({
          name: property.sellerName || property.agentName,
          photo: property.agentPhoto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
          role: property.sellerName ? 'Property Owner' : 'Property Agent',
          phone: property.sellerPhone || property.agentPhone || '+91 98765 43210'
        });
      }
    }

    // Always fetch in background to get latest stats/availability
    getPropertyById(id).then(data => {
      if (data) {
        setProperty(data);
        if (data.sellerName || data.agentName) {
          setAgent({
            name: data.sellerName || data.agentName,
            photo: data.agentPhoto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
            role: data.sellerName ? 'Property Owner' : 'Property Agent',
            phone: data.sellerPhone || data.agentPhone || '+91 98765 43210'
          });
        }
      }
    });
  }, [id, property]);

  if (!property) return <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>Loading or not found...</div>;

  // Prepare images to ensure we always have 3 for the gallery layout
  const allImages = property.imageUrls || property.images || (property.image ? [property.image] : []);
  const safeImg = allImages[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
  const displayImages = [
    safeImg,
    allImages[1] || safeImg,
    allImages[2] || safeImg
  ];

  // Auto-slide logic for main image
  const cycleIndices = useMemo(() => {
    if (allImages.length <= 3) return [0];
    // Main slot cycles through 0 and any images from index 3 onwards (skipping 1 & 2)
    return [0, ...allImages.map((_, i) => i).filter(i => i > 2)];
  }, [allImages]);

  useEffect(() => {
    if (cycleIndices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMainIndex(prev => (prev + 1) % cycleIndices.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [cycleIndices]);

  const activeMainImage = allImages[cycleIndices[currentMainIndex]] || safeImg;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentMainIndex(prev => (prev - 1 + cycleIndices.length) % cycleIndices.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentMainIndex(prev => (prev + 1) % cycleIndices.length);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const validate = () => {
    let newErrors = {};
    if (!inquiryForm.name.trim()) newErrors.name = 'Full name is required';
    if (!inquiryForm.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(inquiryForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!inquiryForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(inquiryForm.phone, inquiryForm.phoneCode)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!inquiryForm.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setFormStatus('submitting');
    try {
      await submitLead({
        name: inquiryForm.name,
        phone: inquiryForm.phoneCode + inquiryForm.phone,
        phoneCountryCode: inquiryForm.phoneCode,
        email: inquiryForm.email,
        message: inquiryForm.message,
        propertyId: property.id,
        propertyTitle: property.title,
        category: property.category || '',
        status: 'new'
      });
      setFormStatus('success');
      setInquiryForm({ name: '', phone: '', phoneCode: '+91', email: '', message: 'I am interested in Property Express listing...' });
      setErrors({});
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Inquiry submission failed:', error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 4000);
    }
  };

  // Touch handlers for mobile swiping
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      setCurrentMainIndex(prev => (prev + 1) % allImages.length);
    } else if (distance < -minSwipeDistance) {
      setCurrentMainIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      {property && (
        <SEO 
          title={property.title}
          description={`${property.category} in ${property.location}. ${property.bedrooms ? `${property.bedrooms} Bed, ` : ''}${property.bathrooms ? `${property.bathrooms} Bath, ` : ''}${property.area ? `${property.area} sqft. ` : ''}${property.description?.substring(0, 100)}...`}
          image={property.imageUrls?.[0] || property.images?.[0] || property.image}
          url={`/properties/${property.id}`}
          type="article"
          schemaData={{
            "@context": "https://schema.org/",
            "@type": "RealEstateListing",
            "name": property.title,
            "description": property.description,
            "url": `https://propertyexpress-mu.vercel.app/properties/${property.id}`,
            "image": [property.imageUrls?.[0] || property.images?.[0] || property.image],
            "address": {
              "@type": "PostalAddress",
              "addressLocality": property.location,
              "addressRegion": property.district || "",
              "addressCountry": "IN"
            }
          }}
        />
      )}
      {/* 1. Image Gallery (Ecommerce Style) */}
      <div className={styles.galleryHero}>
        <div className={styles.galleryGrid}>
          {/* Main Slider Area */}
          <div className={styles.galleryMain}>
            <button
              className={styles.backBtnFloating}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div 
              className={styles.mainImageWrap}
              onClick={() => openLightbox(currentMainIndex)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{ cursor: 'zoom-in', height: '100%', position: 'relative' }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentMainIndex}
                  src={allImages[currentMainIndex] || safeImg}
                  alt={`${property.title} - Image ${currentMainIndex + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </AnimatePresence>

              {allImages.length > 1 && (
                <>
                  <button 
                    className={`${styles.navArrow} ${styles.navArrowLeft} ${styles.desktopOnly}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMainIndex(prev => (prev - 1 + allImages.length) % allImages.length);
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    className={`${styles.navArrow} ${styles.navArrowRight} ${styles.desktopOnly}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMainIndex(prev => (prev + 1) % allImages.length);
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnails Strip */}
          {allImages.length > 1 && (
            <div className={styles.thumbnailStrip}>
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbnail} ${currentMainIndex === idx ? styles.thumbnailActive : ''}`}
                  onClick={() => setCurrentMainIndex(idx)}
                >
                  <img src={img} alt={`${property.title} thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <Lightbox 
        images={allImages}
        index={lightboxIndex}
        isOpen={showLightbox}
        onClose={closeLightbox}
        onPrev={prevLightboxImage}
        onNext={nextLightboxImage}
      />

      <div className={`container ${styles.detailContainer}`}>
        {/* 2. Property Info (Left Column) */}
        <div className={styles.detailMain}>
          <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <div className={styles.badgeGroup} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              {/* For Rent / For Sale Badge */}
              <span
                className={styles.badge}
                style={{
                  background: (property.listingType === 'Rent' || property.status === 'For Rent') ? 'var(--color-primary)' : '#ed1b24',
                  color: 'white',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  padding: '0.5rem 1.25rem'
                }}
              >
                {(property.listingType === 'Rent' || property.status === 'For Rent') ? 'For Rent' : 'For Sale'}
              </span>

              {property.status && property.status !== 'Active' && property.status !== 'For Rent' && property.status !== 'For Sale' && (
                <span className={styles.badge} style={{ background: '#eee', color: '#333' }}>{property.status}</span>
              )}
              
              {property.isFeatured && (
                <span className={styles.badge} style={{ background: '#fdf2f2', color: '#ed1b24', border: '1px solid #fecaca' }}>
                  Featured
                </span>
              )}
              {property.instagramLink && (
                <a href={property.instagramLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', color: 'white', padding: '0.35rem 1rem', borderRadius: 999, fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', lineHeight: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </a>
              )}
              {property.facebookLink && (
                <a href={property.facebookLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1877F2', color: 'white', padding: '0.35rem 1rem', borderRadius: 999, fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', lineHeight: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              )}
              {property.youtubeLink && (
                <a href={property.youtubeLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF0000', color: 'white', padding: '0.35rem 1rem', borderRadius: 999, fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', lineHeight: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                  YouTube
                </a>
              )}
            </div>

            <div className={styles.headerRow}>
              <h1>{property.title}</h1>
              <div className={styles.price}>
                {formatPrice(property.price)} {property.status === 'For Rent' && <span>/mo</span>}
              </div>
            </div>
            <div className={styles.location}>
              <MapPin size={18} /> {property.location}{property.district ? `, ${property.district}` : ''}
            </div>
            {formatDate(property.createdAt) && (
              <div className={styles.listingAddedDate}>
                <Calendar size={16} /> Added on: {formatDate(property.createdAt)}
              </div>
            )}
          </motion.div>

          <motion.div className={styles.featuresStrip} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            {(property.bedrooms || property.beds) > 0 && (
              <div className={styles.featureItem}><BedDouble size={20} /> <span>{property.bedrooms || property.beds} Bedrooms</span></div>
            )}
            {(property.bathrooms || property.baths) > 0 && (
              <div className={styles.featureItem}><Bath size={20} /> <span>{property.bathrooms || property.baths} Bathrooms</span></div>
            )}
            {(property.area || property.sqft) > 0 && (
              <div className={styles.featureItem}><Scaling size={20} /> <span>{Number(property.area || property.sqft || 0).toLocaleString()} sqft</span></div>
            )}
          </motion.div>

          {/* Description Section */}
          <motion.div className={styles.descriptionSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <h3>Property Description</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{property.description}</p>
          </motion.div>

          {/* Amenities Section */}
          {(property.amenities || property.features) && (property.amenities?.length > 0 || property.features?.length > 0) && (
            <motion.div className={styles.amenitiesSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
              <h3>Amenities</h3>
              <div className={styles.amenitiesGrid}>
                {([...(property.amenities || []), ...(property.features || [])]).reduce((acc, current) => {
                  if (!acc.includes(current)) acc.push(current);
                  return acc;
                }, []).map((amenity, idx) => (
                  <div key={idx} className={styles.amenityItem}>
                    <Check size={18} color="#c53030" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dynamic Attributes Section */}
          {property.dynamicFilters && Object.entries(property.dynamicFilters).filter(([_, v]) => v && v.toString().trim() !== '').length > 0 && (
            <motion.div className={styles.attributesSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Info size={22} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>Additional Details</h3>
              </div>
              <div className={styles.attributesGrid}>
                {Object.entries(property.dynamicFilters)
                  .filter(([_, value]) => value && value.toString().trim() !== '')
                  .map(([key, value], idx) => (
                    <div key={idx} className={styles.attributeItem}>
                      <span className={styles.attributeLabel}>{key}</span>
                      <span className={styles.attributeValue}>{value}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Location Map Section */}
          <motion.div className={styles.mapSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Location Map</h3>
              {property.mapsUrl && (
                <a
                  href={property.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#1a1a1a', color: 'white', textDecoration: 'none', padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Map size={18} /> Open in Google Maps
                </a>
              )}
            </div>
            <div className={styles.mapWrapper}>
              {(() => {
                let src = '';
                const coords = typeof getPropertyCoordinates === 'function' ? getPropertyCoordinates(property) : null;
                
                if (property.mapsUrl && (property.mapsUrl.includes('<iframe') || property.mapsUrl.includes('google.com/maps/embed'))) {
                  // If it's already an embed code or embed link, use extraction or direct link
                  if (property.mapsUrl.includes('<iframe')) {
                    const match = property.mapsUrl.match(/src="([^"]+)"/);
                    src = match ? match[1] : '';
                  } else {
                    src = property.mapsUrl;
                  }
                } else if (coords) {
                  // If we have coordinates or just a label (extracted from mapsUrl or district)
                  const query = coords.lat 
                    ? `${coords.lat},${coords.lng}${coords.label ? ` (${encodeURIComponent(coords.label)})` : ''}`
                    : encodeURIComponent(coords.label);
                  src = `https://www.google.com/maps?q=${query}&z=15&output=embed`;
                } else {
                  // Fallback to address search if all else fails
                  src = `https://www.google.com/maps?q=${encodeURIComponent(property.location || property.address || '')}&output=embed`;
                }

                return (
                  <iframe
                    title="Property Location"
                    src={src}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                );
              })()}
            </div>
          </motion.div>


        </div>

        {/* 3. Sidebar */}
        <motion.div className={styles.detailSidebar} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
          <div className={styles.sidebarSticky}>
            <div className={styles.agentCard}>
              <div className={styles.agentInfo}>
                <div className={styles.agentPhotoWrap}>
                  <img src={brandLogo} alt="Property Express logo" className={styles.brandAgentLogo} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Property Express Team</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Your Personal Consultants</p>
                </div>
              </div>

              <div className={styles.contactFormWrap}>
                <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '400' }}>Interested in this property?</h4>
                <form className={styles.contactForm} onSubmit={handleFormSubmit}>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={inquiryForm.name}
                      onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                      className={errors.name ? 'field-error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                    <PhoneInput
                      value={inquiryForm.phone}
                      countryCode={inquiryForm.phoneCode}
                      onChange={(phone, code) => setInquiryForm(f => ({ ...f, phone, phoneCode: code }))}
                      placeholder="Your Phone Number"
                      error={errors.phone}
                      theme="light"
                      wrapperStyle={{ marginBottom: errors.phone ? '0' : '0.75rem' }}
                    />
                    {errors.phone && <span className="error-message" style={{ display: 'block', marginBottom: '0.75rem' }}>{errors.phone}</span>}
                    <input
                      type="email"
                      required
                      placeholder="Your Email Address"
                      value={inquiryForm.email}
                      onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
                      className={errors.email ? 'field-error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                    <textarea
                      rows="2"
                      required
                      placeholder="Your message or any specific requirements..."
                      value={inquiryForm.message}
                      onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                      className={errors.message ? 'field-error' : ''}
                    ></textarea>
                    {errors.message && <span className="error-message">{errors.message}</span>}

                  <div className={styles.actionButtons}>
                    <button
                      type="submit"
                      className="btn"
                      disabled={formStatus === 'submitting'}
                      style={{ background: '#4a4a4a', color: 'white', border: 'none', padding: '0.85rem', opacity: formStatus === 'submitting' ? 0.7 : 1 }}
                    >
                      {formStatus === 'submitting' ? 'Sending...' : 'Request Info'}
                    </button>
                    {agent && (
                      <a href={`tel:${agent.phone.replace(/\D/g, '')}`} className="btn btn-outline" style={{ background: 'white' }}>
                        <Phone size={18} /> Call Now
                      </a>
                    )}
                    {agent && (
                      <a
                        href={`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`I am interested in ${property.title}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.btnWhatsapp}
                      >
                        <MessageCircle size={18} /> WhatsApp
                      </a>
                    )}
                  </div>
                  {formStatus === 'error' && (
                    <div style={{ color: '#ed1b24', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Something went wrong. Please try again.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <EnquirySuccessPopup 
        isOpen={formStatus === 'success'} 
        onClose={() => setFormStatus('idle')}
      />
    </motion.div>
  );
}
