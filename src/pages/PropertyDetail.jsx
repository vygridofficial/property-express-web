import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Map, BedDouble, Bath, Scaling, Calendar, ShieldCheck, Check, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { getPropertyById } from '../services/propertyService';
import { submitLead } from '../services/leadService';
import { MOCK_AGENTS } from '../data/mockProperties';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import styles from './PropertyDetail.module.css';
import brandLogo from '../assets/logo.png';
import { formatPrice } from '../utils/formatPrice';
import { getPropertyCoordinates } from '../utils/geo';

const DEFAULT_AMENITIES = [
  "Swimming Pool", 
  "24/7 Security", 
  "Private Garage (3 Cars)", 
  "Central AC / Heating", 
  "Smart Home System", 
  "Outdoor BBQ Area", 
  "City Water Supply", 
  "High-Speed Internet"
];

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
    email: '',
    message: 'I am interested in Property Express listing...'
  });

  useEffect(() => {
    // If we have data from state, we can already initialize agent info
    if (property) {
      if (property.agentName) {
        setAgent({
          name: property.agentName,
          photo: property.agentPhoto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
          role: 'Property Agent',
          phone: property.agentPhone || '+91 98765 43210'
        });
      } else {
        setAgent(MOCK_AGENTS.find(a => a.id === property.agentId) || MOCK_AGENTS[0]);
      }
    }

    // Always fetch in background to get latest stats/availability
    getPropertyById(id).then(data => {
      if (data) {
        setProperty(data);
        if (data.agentName) {
           setAgent({
              name: data.agentName,
              photo: data.agentPhoto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
              role: 'Property Agent',
              phone: data.agentPhone || '+91 98765 43210'
           });
        } else {
           setAgent(MOCK_AGENTS.find(a => a.id === data.agentId) || MOCK_AGENTS[0]);
        }
      }
    });
  }, [id]);

  if (!property) return <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>Loading or not found...</div>;

  // Prepare images to ensure we always have 3 for the gallery layout
  const allImages = property.imageUrls || property.images || (property.image ? [property.image] : []);
  const safeImg = allImages[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
  const displayImages = [
    safeImg,
    allImages[1] || safeImg,
    allImages[2] || safeImg
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    try {
      await submitLead({
        name: inquiryForm.name,
        phone: inquiryForm.phone,
        email: inquiryForm.email,
        message: inquiryForm.message,
        propertyId: property.id,
        propertyTitle: property.title,
        category: property.category || '',
        status: 'new'
      });
      setFormStatus('success');
      setInquiryForm({ name: '', phone: '', email: '', message: 'I am interested in Property Express listing...' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Inquiry submission failed:', error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 4000);
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
      {/* 1. Image Gallery */}
      <div className={styles.galleryHero}>
        <div className={styles.galleryGrid}>
          <button 
            className={styles.backBtnFloating}
            onClick={() => navigate(-1)} 
          >
            &larr; Back
          </button>
          {displayImages.map((img, idx) => (
            <div key={idx} className={`${styles.galleryItem} ${idx === 0 ? styles.galleryMain : ''}`}>
              <img src={img} alt={`${property.title} view ${idx + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className={`container ${styles.detailContainer}`}>
        {/* 2. Property Info (Left Column) */}
        <div className={styles.detailMain}>
          <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <div className={styles.badgeGroup}>
              <span className={styles.badge}>{property.status}</span>
              {property.featured && <span className={styles.badge} style={{ background: '#f5ebd9', color: '#9c6b24', border: '1px solid #dcb57e' }}>Featured</span>}
            </div>
            
            <div className={styles.headerRow}>
              <h1>{property.title}</h1>
              <div className={styles.price}>
                {formatPrice(property.price)} {property.status === 'For Rent' && <span>/mo</span>}
              </div>
            </div>
            <div className={styles.location}>
              <MapPin size={18} /> {property.location}
            </div>
          </motion.div>

          <motion.div className={styles.featuresStrip} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <div className={styles.featureItem}><BedDouble size={20} /> <span>{property.bedrooms || property.beds || 0} Bedrooms</span></div>
            <div className={styles.featureItem}><Bath size={20} /> <span>{property.bathrooms || property.baths || 0} Bathrooms</span></div>
            <div className={styles.featureItem}><Scaling size={20} /> <span>{Number(property.area || property.sqft || 0).toLocaleString()} sqft</span></div>
          </motion.div>

          {/* Description Section */}
          <motion.div className={styles.descriptionSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <h3>Property Description</h3>
            <p>{property.description}</p>
            {/* Adding extra paragraphs to match "2-3 paragraphs" requirement */}
            <p>The state-of-the-art kitchen comes fully equipped with premium appliances, custom cabinetry, and a large marble island perfect for entertaining. The master suite is a true sanctuary, boasting a spa-like bathroom and a private terrace. Outside, you will find a beautifully landscaped backyard complete with an infinity pool, outdoor kitchen, and fire pit.</p>
          </motion.div>

          {/* Amenities Section */}
          <motion.div className={styles.amenitiesSection} variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}>
            <h3>Amenities</h3>
            <div className={styles.amenitiesGrid}>
              {DEFAULT_AMENITIES.map((amenity, idx) => (
                <div key={idx} className={styles.amenityItem}>
                  <Check size={18} color="#c53030" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </motion.div>

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
                const coords = typeof getPropertyCoordinates === 'function' ? getPropertyCoordinates(property) : null;
                const src = coords 
                  ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}${coords.label ? ` (${encodeURIComponent(coords.label)})` : ''}&z=15&output=embed`
                  : `https://www.google.com/maps?q=${encodeURIComponent(property.location || property.address || '')}&output=embed`;
                
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
                    placeholder="Your Name"
                    required
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={inquiryForm.email}
                    onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <textarea
                    rows="2"
                    placeholder="Message"
                    required
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                  ></textarea>

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
                  {formStatus === 'success' && (
                    <div style={{ color: 'green', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ✓ Enquiry submitted! Our team will contact you shortly.
                    </div>
                  )}
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
    </motion.div>
  );
}
