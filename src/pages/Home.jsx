import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Building, Store, Map, Award, Handshake, Headphones, Star } from 'lucide-react';
import { getFeaturedProperties } from '../services/propertyService';
import { getAllReviews, addReview } from '../services/reviewService';
import PropertyCard from '../components/ui/PropertyCard';
import GtaMarker from '../components/ui/GtaMarker';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import styles from './Home.module.css';

const CountUp = ({ end, decimals = 0, suffix = "" }) => {
  const ref = React.useRef(null);
  // ... (existing CountUp code)
  return <span ref={ref}>{(0).toFixed(decimals)}{suffix}</span>;
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 30.267153, lng: -97.912566 });
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setMapCenter({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setIsDetecting(false);
      // reverse properties array to simulate finding new nearby properties
      setFeatured(prev => [...prev].reverse());
    }, (error) => {
      console.error("Error getting location", error);
      alert("Unable to retrieve your location. Please check browser permissions.");
      setIsDetecting(false);
    });
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, name: '', role: '', text: '' });
  const [reviewErrors, setReviewErrors] = useState({ rating: false, name: false, text: false });

  const handleSubmitReview = async () => {
    const errors = {
      rating: reviewForm.rating === 0,
      name: !reviewForm.name.trim(),
      text: !reviewForm.text.trim(),
    };
    setReviewErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await addReview({
        name: reviewForm.name.trim(),
        role: reviewForm.role.trim() || 'Client',
        text: reviewForm.text.trim(),
        rating: reviewForm.rating,
        status: 'Pending'
      });
      setReviewForm({ rating: 0, name: '', role: '', text: '' });
      setHoveredStar(0);
      setReviewSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    getFeaturedProperties().then(setFeatured);
    getAllReviews().then(data => {
      setReviews(data.filter(r => r.status?.toLowerCase() === 'approved'));
    });
  }, []);

  const displayTestimonials = reviews.length > 0 ? reviews : [
    {
      id: 1,
      name: "Sandeep Singh",
      role: "Property Owner",
      text: "Property Express made finding my dream apartment incredibly simple. Their team was professional, and the property exceeded my expectations.",
      rating: 5
    }
  ];

  const duplicatedTestimonials = [...displayTestimonials, ...displayTestimonials];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroTitle}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Find Your Perfect Property
          </motion.h1>
          <motion.p
            className={styles.heroSubtitle}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover premium real estate, curated exclusively by our expert team. Experience seamless living in the home of your dreams.
          </motion.p>
          <motion.div
            className={styles.heroCtas}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/properties" className={`btn ${styles.btnPrimary}`}>Search Properties</Link>
            <Link to="/contact" className={`btn ${styles.btnSecondary}`}>Sell with Us</Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <motion.div
            className="section-header flex-between"
            style={{ textAlign: 'left', marginBottom: '3rem' }}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <div>
              <h2>Featured Properties</h2>
              <p className="subtitle">Hand-picked premium listings available right now.</p>
            </div>
            <Link to="/properties" className="btn btn-outline">View All Listings</Link>
          </motion.div>

          <div className={`grid ${styles.featuredGrid}`}>
            {featured.map((prop, index) => (
              <motion.div
                key={prop.id}
                variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
                transition={{ delay: index * 0.1 }}
              >
                <PropertyCard property={prop} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <motion.div
            className={styles.bentoGrid}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <div className={styles.bentoCol}>
              <motion.div
                className={`${styles.statCard} ${styles.bgPurple}`}
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h2 className={styles.statNumber}>
                  <CountUp end={1.2} decimals={1} suffix="K+" />
                </h2>
                <div className={styles.statFooter}>
                  <p>Properties Sold</p>
                </div>
              </motion.div>
              <motion.div
                className={`${styles.statCard} ${styles.bgBlack}`}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              >
                <h2 className={styles.statNumber}>
                  <CountUp end={4.9} decimals={1} suffix="/5" />
                </h2>
                <div className={styles.statFooter}>
                  <p>Client Satisfaction</p>
                </div>
              </motion.div>
            </div>

            <div className={`${styles.bentoCol} ${styles.bentoOffset1}`}>
              <motion.div
                className={`${styles.statCard} ${styles.bgTeal}`}
                initial={{ y: -100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              >
                <h2 className={styles.statNumber}>
                  <CountUp end={100} decimals={0} suffix="%" />
                </h2>
                <div className={styles.statFooter}>
                  <p>Verified Listings</p>
                </div>
              </motion.div>
            </div>

            <div className={`${styles.bentoCol} ${styles.bentoOffset2}`}>
              <motion.div
                className={`${styles.statCard} ${styles.bgGreen}`}
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              >
                <h2 className={styles.statNumber}>
                  <CountUp end={50} decimals={0} suffix="+" />
                </h2>
                <div className={styles.statFooter}>
                  <p>Expert Consultants</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <motion.div
            className="section-header" style={{ textAlign: 'center' }}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <h2>Why Choose Property Express?</h2>
            <p className="subtitle" style={{ margin: '0 auto' }}>We stand out through our commitment to transparency, quality, and support.</p>
          </motion.div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', marginTop: '3rem' }}>
            {[
              { icon: Award, title: 'Verified Properties', desc: 'Every listing on our platform undergoes strict verification for your peace of mind.' },
              { icon: Handshake, title: 'Trusted Listings', desc: "We don't allow external agents. All properties are exclusively managed by our dedicated team." },
              { icon: Headphones, title: 'Expert Support', desc: 'Our real estate experts guide you through every step of the buying or renting process.' }
            ].map((feat, i) => (
              <motion.div
                key={i} className={styles.featureItemMain}
                variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={styles.iconBox}><feat.icon size={32} /></div>
                <h3>{feat.title}</h3>
                <p style={{ color: 'var(--color-text-light)', marginTop: '1rem' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-header" style={{ textAlign: 'center' }}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <h2>What Our Clients Say</h2>
            <p className="subtitle" style={{ margin: '0 auto' }}>Read stories from clients who found their perfect match with us.</p>
          </motion.div>

          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {duplicatedTestimonials.map((t, idx) => (
                <div key={idx} className={styles.testimonialCard}>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <Star key={v} size={16} fill={v <= (t.rating || 5) ? 'currentColor' : 'none'} style={{ opacity: v <= (t.rating || 5) ? 1 : 0.25 }} />
                    ))}
                  </div>
                  <p style={{ marginBottom: '1.5rem', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div className={styles.testimonialHeader}>
                    {t.img ? (
                      <img src={t.img} alt={t.name} className={styles.testimonialImg} />
                    ) : (
                      <div className={styles.testimonialImg} style={{ background: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                        {t.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0 }}>{t.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA to share review */}
          <motion.div
            style={{ textAlign: 'center', marginTop: '3rem' }}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.25rem' }}>Worked with us? We'd love to hear from you.</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <Star size={16} /> Share Your Experience
            </button>
          </motion.div>
        </div>
      </section>

      {/* Review Submission Modal */}
      {showReviewModal && createPortal(
        <div
          onClick={() => { setShowReviewModal(false); setReviewSubmitted(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.75)',
              borderRadius: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              fontFamily: 'Outfit, sans-serif',
              position: 'relative'
            }}
          >
            {/* Close */}
            <button
              onClick={() => { setShowReviewModal(false); setReviewSubmitted(false); }}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#555' }}
            >
              ×
            </button>

            {reviewSubmitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#18181a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Star size={28} fill="white" color="white" />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Thank You!</h3>
                <p style={{ color: '#555', fontWeight: 300, lineHeight: 1.6 }}>Your testimonial has been added. We truly appreciate you sharing your experience with Property Express.</p>
                <button
                  onClick={() => { setShowReviewModal(false); setReviewSubmitted(false); }}
                  style={{ marginTop: '1.5rem', background: '#18181a', color: 'white', border: 'none', borderRadius: 12, padding: '0.875rem 2rem', fontWeight: 700, fontFamily: 'Outfit', cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <>
                {/* ← Back button — always visible at top */}
                <button
                  onClick={() => { setShowReviewModal(false); setReviewSubmitted(false); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '40px', padding: '0.45rem 1rem',
                    fontSize: '0.82rem', fontWeight: 600, color: '#444',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    marginBottom: '1.25rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#444'; }}
                >
                  ← Back
                </button>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>Share Your Experience</h3>
                <p style={{ color: '#555', fontWeight: 300, marginBottom: '2rem', fontSize: '0.9rem' }}>Tell others about your journey with Property Express.</p>

                {/* Star Rating */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '0.75rem' }}>
                    Your Rating <span style={{ color: '#ed1b24' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.15s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Star
                          size={32}
                          fill={(hoveredStar || reviewForm.rating) >= star ? '#18181a' : 'none'}
                          color={(hoveredStar || reviewForm.rating) >= star ? '#18181a' : '#ccc'}
                          style={{ transition: 'all 0.15s' }}
                        />
                      </button>
                    ))}
                  </div>
                  {reviewErrors.rating && <span style={{ color: '#ed1b24', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>Please select a rating.</span>}
                </div>

                {/* Name */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '0.5rem' }}>
                    Your Name <span style={{ color: '#ed1b24' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ravi Kumar"
                    value={reviewForm.name}
                    onChange={e => { setReviewForm(f => ({ ...f, name: e.target.value })); setReviewErrors(ev => ({ ...ev, name: false })); }}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12, fontFamily: 'Outfit', fontSize: '0.95rem',
                      border: reviewErrors.name ? '1.5px solid #ed1b24' : '1.5px solid rgba(0,0,0,0.12)',
                      background: 'rgba(255,255,255,0.6)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Role */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '0.5rem' }}>
                    Your Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First-time Buyer, Investor..."
                    value={reviewForm.role}
                    onChange={e => setReviewForm(f => ({ ...f, role: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12, fontFamily: 'Outfit', fontSize: '0.95rem',
                      border: '1.5px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.6)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Testimonial */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '0.5rem' }}>
                    Your Testimonial <span style={{ color: '#ed1b24' }}>*</span>
                  </label>
                  <textarea
                    placeholder="Tell us about your experience with Property Express..."
                    rows={4}
                    value={reviewForm.text}
                    onChange={e => { setReviewForm(f => ({ ...f, text: e.target.value })); setReviewErrors(ev => ({ ...ev, text: false })); }}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12, fontFamily: 'Outfit', fontSize: '0.95rem',
                      border: reviewErrors.text ? '1.5px solid #ed1b24' : '1.5px solid rgba(0,0,0,0.12)',
                      background: 'rgba(255,255,255,0.6)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', minHeight: 110
                    }}
                  />
                  {reviewErrors.text && <span style={{ color: '#ed1b24', fontSize: '0.78rem', display: 'block', marginTop: '0.25rem' }}>Please write your testimonial.</span>}
                </div>

                <button
                  onClick={handleSubmitReview}
                  style={{
                    width: '100%', padding: '1rem', background: '#18181a', color: 'white', border: 'none',
                    borderRadius: 14, fontWeight: 700, fontFamily: 'Outfit', fontSize: '1rem', cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.18)', transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.24)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.18)'; }}
                >
                  Submit Testimonial
                </button>
              </>
            )}
          </motion.div>
        </div>,
        document.body
      )}


      {/* GTA Map Section */}
      <section className={`cta-section ${styles.interactiveMapSection}`}>
        <div className={styles.mapBackdrop}>
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d200000!2d${mapCenter.lng}!3d${mapCenter.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus`}
            width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" title="Map"></iframe>
        </div>
        <div className={styles.mapTintOverlay}></div>

        <div className={styles.mapMarkers}>
          <div className={styles.currentLocationMarker}>
            <div className={`${styles.locRipple} ${styles.locRipple1}`}></div>
            <div className={`${styles.locRipple} ${styles.locRipple2}`}></div>
            <div className={`${styles.locRipple} ${styles.locRipple3}`}></div>
            <div className={styles.locCore}>
              <div className={styles.locDotInner}></div>
            </div>
          </div>

          {/* Re-using first featured property for map pins */}
          {featured.length > 0 && (
            <>
              {/* Mobile: max 4 pins, evenly spread, no overlap */}
              {isMobile ? (
                <>
                  <GtaMarker property={featured[0]} style={{ top: '12%', left: '4%' }} delay={0.15} mobileCompact />
                  <GtaMarker property={featured[1]} style={{ top: '12%', right: '4%' }} delay={0.25} mobileCompact />
                  <GtaMarker property={featured[2]} style={{ top: '55%', left: '4%' }} delay={0.35} mobileCompact />
                  <GtaMarker property={featured[0]} style={{ top: '55%', right: '4%' }} delay={0.45} mobileCompact />
                </>
              ) : (
                <>
                  <GtaMarker property={featured[0]} style={{ top: '5%', left: '3%' }} delay={0.15} />
                  <GtaMarker property={featured[1]} style={{ top: '32%', left: '18%' }} delay={0.25} />
                  <GtaMarker property={featured[2]} style={{ top: '60%', left: '5%' }} delay={0.55} />
                  <GtaMarker property={featured[0]} style={{ top: '85%', left: '22%' }} delay={0.65} />
                  <GtaMarker property={featured[1]} style={{ top: '6%', left: '75%' }} delay={0.75} />
                  <GtaMarker property={featured[2]} style={{ top: '25%', left: '55%' }} delay={0.35} />
                  <GtaMarker property={featured[0]} style={{ top: '44%', left: '82%' }} delay={0.45} />
                  <GtaMarker property={featured[1]} style={{ top: '75%', left: '52%' }} delay={0.60} />
                  <GtaMarker property={featured[2]} style={{ top: '80%', left: '80%' }} delay={0.70} />
                </>
              )}
            </>
          )}
        </div>

        <div className={`container ${styles.mapCtaContent}`}>
          <h2 className={styles.mapCtaTitle}>Explore Nearby Homes</h2>
          <p className={styles.mapCtaSubtitle}>Browse available homes near you and explore<br />listings in your favorite areas.</p>
          <div className={styles.mapCtaBtnWrap}>
            <div className={styles.ctaRadar1}></div>
            <div className={styles.ctaRadar2}></div>
            <Link to="/properties" className={styles.btnMapCta}>Get started</Link>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            <button
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="btn"
              style={{ background: 'white', color: '#18181a', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.875rem 2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <Map size={18} /> {isDetecting ? 'Detecting Location...' : 'Detect My Location'}
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
