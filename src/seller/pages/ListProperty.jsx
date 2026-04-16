import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileSignature,
  Phone,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

const DEFAULT_AMENITIES = [
  'Swimming Pool', '24/7 Security', 'Private Garage', 
  'Central AC / Heating', 'Smart Home System', 'Outdoor BBQ Area',
  'City Water Supply', 'High-Speed Internet', 'Gym', 'Elevator',
  'CCTV', 'Power Backup'
];
import { KERALA_DISTRICTS } from '../../data/districts';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSeller } from '../context/SellerContext';
import { createPropertySubmission } from '../../services/submissionService';
import SignaturePad from '../components/SignaturePad';
import dashStyles from '../styles/Dashboard.module.css';
import Skeleton from 'react-loading-skeleton';
import { isValidPhone } from '../../utils/validation';

const BASE_PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial'];

function isBlockedByClientError(err) {
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  return (
    msg.includes('err_blocked_by_client') ||
    msg.includes('blocked_by_client') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror')
  );
}

export default function ListProperty() {
  const navigate = useNavigate();
  const { user, refreshAgreements } = useSeller();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isBlockedErr, setIsBlockedErr] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState(BASE_PROPERTY_TYPES);
  const [dynamicAmenities, setDynamicAmenities] = useState(DEFAULT_AMENITIES);

  // Fetch admin-configured custom categories from Firestore
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.customCategories) && data.customCategories.length > 0) {
            const custom = data.customCategories.map(c => c.name || c).filter(Boolean);
            // Merge base + custom, deduplicate (case-insensitive)
            const merged = [...BASE_PROPERTY_TYPES];
            custom.forEach(t => {
              if (!merged.some(b => b.toLowerCase() === t.toLowerCase())) {
                merged.push(t);
              }
            });
            setPropertyTypes(merged);
          }
          if (Array.isArray(data.amenities) && data.amenities.length > 0) {
            setDynamicAmenities(data.amenities);
          }
        }
      } catch {
        // Non-critical — silently fall back to base types
      }
    };
    fetchTypes();
  }, []);

  // Step 1 Data
  const [details, setDetails] = useState({
    propertyTitle: '',
    sellerName: '',
    propertyType: 'Apartment',
    configuration: '1BHK',
    area: '',
    price: '',
    location: '',
    district: '',
    address: '',
    phone: '',
    description: '',
    amenities: [], // Array for chip-based selection
    bedrooms: '',
    bathrooms: ''
  });
  const [customAmenity, setCustomAmenity] = useState('');
  const [images, setImages] = useState([]);

  // Step 2 Data
  const [terms, setTerms] = useState({
    accuracy: false,
    exclusivity: false,
    commission: false
  });

  // Step 3 Data
  const [signature, setSignature] = useState(null);

  const toggleAmenity = (name) => {
    setDetails(prev => {
      const current = Array.isArray(prev.amenities) ? prev.amenities : [];
      if (current.includes(name)) {
        return { ...prev, amenities: current.filter(a => a !== name) };
      } else {
        return { ...prev, amenities: [...current, name] };
      }
    });
  };

  const handleCustomAmenity = (e) => {
    if (e.key === 'Enter' && customAmenity.trim()) {
      e.preventDefault();
      toggleAmenity(customAmenity.trim());
      setCustomAmenity('');
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length > 5) {
        setError('Maximum 5 images allowed.');
        return;
      }
      setImages(filesArray);
      setError('');
    }
  };

  const submitListing = async () => {
    if (!signature) {
      setError('Digital signature is required to proceed.');
      return;
    }
    setError('');
    setIsBlockedErr(false);
    setIsSubmitting(true);

    try {
      const submissionData = {
        ...details,
        sellerName: details.sellerName || user?.displayName || 'Unknown Seller',
        sellerEmail: user?.email || '',
        sellerPhone: details.phone || user?.phoneNumber || '',
        amenities: Array.isArray(details.amenities) ? details.amenities : [],
        termsAccepted: terms
      };

      await createPropertySubmission(submissionData, images, signature);
      await refreshAgreements();
      setStep(4);
    } catch (err) {
      console.error(err);
      if (isBlockedByClientError(err)) {
        setIsBlockedErr(true);
        setError(
          'Your browser extension (e.g. an ad-blocker) is blocking the connection to our servers. ' +
          'Please disable your ad-blocker for this site and try again, or open the portal in a private/incognito window.'
        );
      } else {
        setError('Failed to submit property. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = details.propertyTitle && 
                       details.price && 
                       details.location && 
                       details.district && 
                       (!details.phone || isValidPhone(details.phone));
  const isStep2Valid = terms.accuracy && terms.exclusivity && terms.commission;

  // Glassmorphic input style (inline for elements that can't use CSS modules easily)
  const inp = {
    width: '100%',
    padding: '0.9rem 1.1rem',
    borderRadius: 14,
    border: '1.5px solid rgba(200,210,230,0.7)',
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  };

  const onFocus = e => {
    e.target.style.borderColor = '#ed1b24';
    e.target.style.boxShadow = '0 0 0 3px rgba(237,27,36,0.1)';
    e.target.style.background = 'rgba(255,255,255,0.75)';
  };
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(200,210,230,0.7)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255,255,255,0.55)';
  };

  const formCard = {
    background: 'rgba(255,255,255,0.42)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: '2.5rem',
    boxShadow: '0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.65)',
  };

  const label = {
    display: 'block',
    marginBottom: '0.45rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: 'var(--text-body)',
    letterSpacing: '0.01em'
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={dashStyles.dashboardWrapper}>
      <header className={dashStyles.header}>
        <h1>List Property</h1>
      </header>
      {loading ? (
        <div style={formCard}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n}>
                <Skeleton width="40%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton height={48} borderRadius={14} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={formCard}>

          {/* ── Error Banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isBlockedErr ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${isBlockedErr ? '#fcd34d' : '#fca5a5'}`,
                color: isBlockedErr ? '#92400e' : '#b91c1c',
                padding: '1rem 1.25rem',
                borderRadius: 14,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {isBlockedErr ? 'Connection Blocked by Browser Extension' : 'Submission Error'}
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{error}</div>
              </div>
              {isBlockedErr && (
                <button
                  onClick={submitListing}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0 }}
                >
                  <RefreshCw size={14} /> Retry
                </button>
              )}
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Details ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>

                  <div>
                    <label style={label}>Property Title *</label>
                    <input
                      type="text" value={details.propertyTitle}
                      onChange={e => setDetails({...details, propertyTitle: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>Owner / Seller Name</label>
                    <input
                      type="text" value={details.sellerName}
                      placeholder={user?.displayName || 'Leave empty to use Google name'}
                      onChange={e => setDetails({...details, sellerName: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>Property Type</label>
                    <select
                      value={details.propertyType}
                      onChange={e => setDetails({...details, propertyType: e.target.value})}
                      style={{ ...inp, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '16px', paddingRight: '2.5rem' }}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={label}>Expected Price (₹) *</label>
                    <input
                      type="number" value={details.price}
                      onChange={e => setDetails({...details, price: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>Total Area (sq.ft)</label>
                    <input
                      type="number" value={details.area}
                      onChange={e => setDetails({...details, area: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>Bedrooms</label>
                    <input
                      type="number" value={details.bedrooms}
                      placeholder="e.g. 3"
                      onChange={e => setDetails({...details, bedrooms: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>Bathrooms</label>
                    <input
                      type="number" value={details.bathrooms}
                      placeholder="e.g. 2"
                      onChange={e => setDetails({...details, bathrooms: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={label}>Amenities / Features</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      {dynamicAmenities.map(amenity => {
                        const isActive = Array.isArray(details.amenities) && details.amenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: 20,
                              background: isActive ? '#ed1b24' : 'rgba(255,255,255,0.6)',
                              color: isActive ? 'white' : 'var(--text-main)',
                              border: isActive ? '1px solid transparent' : '1px solid rgba(200,210,230,0.7)',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              boxShadow: isActive ? '0 2px 8px rgba(237,27,36,0.3)' : 'none'
                            }}
                          >
                            {amenity}
                          </button>
                        );
                      })}
                      {Array.isArray(details.amenities) && details.amenities.filter(a => !dynamicAmenities.includes(a)).map(amenity => (
                        <span
                          key={amenity}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 20,
                            background: '#ed1b24',
                            color: 'white',
                            border: '1px solid transparent',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(237,27,36,0.3)'
                          }}
                        >
                          {amenity} <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleAmenity(amenity)} />
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Type custom amenity & press Enter..."
                        value={customAmenity}
                        onChange={e => setCustomAmenity(e.target.value)}
                        onKeyDown={handleCustomAmenity}
                        style={{ ...inp, width: '220px', padding: '0.4rem 1rem', borderRadius: 20, marginBottom: 0 }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={label}>Location Area *</label>
                    <input
                      type="text" value={details.location}
                      placeholder="e.g. Aluva, Kochi"
                      onChange={e => setDetails({...details, location: e.target.value})}
                      style={inp} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={label}>District *</label>
                    <select
                      value={details.district}
                      onChange={e => setDetails({...details, district: e.target.value})}
                      style={{ ...inp, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '16px', paddingRight: '2.5rem' }}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="">Select District</option>
                      {KERALA_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={label}>Configuration</label>
                    <select
                      value={details.configuration}
                      onChange={e => setDetails({...details, configuration: e.target.value})}
                      style={{ ...inp, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '16px', paddingRight: '2.5rem' }}
                      onFocus={onFocus} onBlur={onBlur}
                    >
                      <option value="1BHK">1 BHK</option>
                      <option value="2BHK">2 BHK</option>
                      <option value="3BHK">3 BHK</option>
                      <option value="4BHK+">4 BHK+</option>
                      <option value="N/A">Not Applicable</option>
                    </select>
                  </div>

                  <div>
                    <label style={label}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: details.phone && !isValidPhone(details.phone) ? '#ed1b24' : '#94a3b8' }} />
                      <input
                        type="tel" value={details.phone}
                        onChange={e => setDetails({...details, phone: e.target.value})}
                        style={{ ...inp, paddingLeft: '2.6rem', borderColor: details.phone && !isValidPhone(details.phone) ? '#ed1b24' : 'rgba(200,210,230,0.7)' }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>
                    {details.phone && !isValidPhone(details.phone) && (
                      <span className="error-message" style={{ fontSize: '0.7rem' }}>Please enter a valid phone number</span>
                    )}
                  </div>

                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <label style={label}>Full Address</label>
                  <input
                    type="text" value={details.address}
                    onChange={e => setDetails({...details, address: e.target.value})}
                    style={inp} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <label style={label}>Detailed Description</label>
                  <textarea
                    rows={4} value={details.description}
                    onChange={e => setDetails({...details, description: e.target.value})}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                <div style={{ marginTop: '1.25rem', background: 'rgba(248,250,252,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: 16, border: '1.5px dashed rgba(203,213,225,0.8)' }}>
                  <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ImageIcon size={18} /> Property Photos (Max 5)
                  </label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ marginTop: '0.5rem' }} />
                  {images.length > 0 && (
                    <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
                      ✓ {images.length} file{images.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  style={{
                    width: '100%', padding: '1.1rem', marginTop: '2rem',
                    background: isStep1Valid ? 'linear-gradient(135deg, #ed1b24, #c41219)' : '#cbd5e1',
                    color: 'white', borderRadius: 16, fontSize: '1rem', fontWeight: 700, border: 'none',
                    cursor: isStep1Valid ? 'pointer' : 'not-allowed',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                    boxShadow: isStep1Valid ? '0 8px 20px rgba(237,27,36,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Proceed to Terms <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Terms ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ background: 'rgba(248,250,252,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '2rem', borderRadius: 18, marginBottom: '2rem', border: '1px solid rgba(226,232,240,0.8)' }}>
                  <h3 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Seller Agreement Terms</h3>

                  {/* Term 1 */}
                  <div id="accuracy" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', scrollMarginTop: '1rem' }}>
                    <input type="checkbox" id="t1" checked={terms.accuracy} onChange={e => setTerms({...terms, accuracy: e.target.checked})} style={{ width: 20, height: 20, marginTop: 4, accentColor: '#ed1b24', flexShrink: 0 }} />
                    <label htmlFor="t1" style={{ color: 'var(--text-body)', lineHeight: 1.6 }}>
                      <a href="#accuracy" style={{ color: '#ed1b24', textDecoration: 'none', fontWeight: 700 }} onClick={e => e.preventDefault()}>Accuracy of Information</a>
                      <span>: I declare that all info, metrics, and photos provided for <em>{details.propertyTitle || 'this property'}</em> are fully accurate and truthful.</span>
                    </label>
                  </div>

                  {/* Term 2 */}
                  <div id="exclusivity" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', scrollMarginTop: '1rem' }}>
                    <input type="checkbox" id="t2" checked={terms.exclusivity} onChange={e => setTerms({...terms, exclusivity: e.target.checked})} style={{ width: 20, height: 20, marginTop: 4, accentColor: '#ed1b24', flexShrink: 0 }} />
                    <label htmlFor="t2" style={{ color: 'var(--text-body)', lineHeight: 1.6 }}>
                      <a href="#exclusivity" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700 }} onClick={e => e.preventDefault()}>Platform Exclusivity</a>
                      <span>: I agree to list this property on Property Express exclusively for a minimum period of 30 days pending admin approval.</span>
                    </label>
                  </div>

                  {/* Term 3 */}
                  <div id="commission" style={{ display: 'flex', gap: '1rem', scrollMarginTop: '1rem' }}>
                    <input type="checkbox" id="t3" checked={terms.commission} onChange={e => setTerms({...terms, commission: e.target.checked})} style={{ width: 20, height: 20, marginTop: 4, accentColor: '#ed1b24', flexShrink: 0 }} />
                    <label htmlFor="t3" style={{ color: 'var(--text-body)', lineHeight: 1.6 }}>
                      <a href="#commission" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }} onClick={e => e.preventDefault()}>Commission Agreement</a>
                      <span>: I agree to the standard platform commission rate as discussed, payable only upon successful closing.</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isStep2Valid}
                  style={{
                    width: '100%', padding: '1.1rem',
                    background: isStep2Valid ? 'linear-gradient(135deg, #ed1b24, #c41219)' : '#cbd5e1',
                    color: 'white', borderRadius: 16, fontSize: '1rem', fontWeight: 700, border: 'none',
                    cursor: isStep2Valid ? 'pointer' : 'not-allowed',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                    boxShadow: isStep2Valid ? '0 8px 20px rgba(237,27,36,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Sign Document <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: Signature ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-body)', textAlign: 'center' }}>
                  Please provide your digital signature below to legally bind your submission and terms.
                </p>

                <SignaturePad onSave={(data) => setSignature(data)} />

                {signature && (
                  <div style={{ marginTop: '2rem', textAlign: 'center', background: '#ecfdf5', padding: '1rem', borderRadius: 12, color: '#10b981', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                    <CheckCircle2 style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                    Signature Captured Successfully
                  </div>
                )}

                <button
                  onClick={submitListing}
                  disabled={isSubmitting || !signature}
                  style={{
                    width: '100%', padding: '1.1rem', marginTop: '2rem',
                    background: (!isSubmitting && signature) ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
                    color: 'white', borderRadius: 16, fontSize: '1rem', fontWeight: 700, border: 'none',
                    cursor: (!isSubmitting && signature) ? 'pointer' : 'not-allowed',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
                    boxShadow: (!isSubmitting && signature) ? '0 8px 24px rgba(16,185,129,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting
                    ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Submitting securely...</>
                    : <><FileSignature size={20} /> Finalize &amp; Submit Listing</>
                  }
                </button>
              </motion.div>
            )}

            {/* ── STEP 4: Success ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: 80, height: 80, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Submission Received!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.6 }}>
                  Your property details and signed agreement have been securely transmitted to the administration team.
                </p>

                <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: 16, border: '1px dashed var(--stroke)', marginBottom: '2.5rem', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 1rem', color: 'var(--text-main)', fontSize: '1rem' }}>What happens next?</h4>
                  <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: 0 }}>
                    <li>Admin team reviews your property details.</li>
                    <li>The Admin counter-signs the agreement.</li>
                    <li>You receive a final PDF copy for your records.</li>
                    <li>The property goes live on the platform.</li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/agreements')}
                  style={{ background: 'linear-gradient(135deg, #ed1b24, #c41219)', color: 'white', padding: '1rem 2rem', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 20px rgba(237,27,36,0.25)' }}
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
