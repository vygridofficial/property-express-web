import React from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, Users, CheckCircle } from 'lucide-react';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import SEO from '../components/common/SEO';
import styles from './About.module.css';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      <SEO
        title="About Us"
        description="Learn about Property Express, the region's leading exclusive real estate agency, and our mission to redefine luxury living."
        url="/about"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Property Express",
          "image": "https://propertyexpress-mu.vercel.app/logo.png",
          "description": "Redefining luxury real estate with trust and transparency.",
          "url": "https://propertyexpress-mu.vercel.app/about",
          "address": "Trivandrum, Kerala, India"
        }}
      />
      <section className={styles.pageHeader}>
        <div className={`container ${styles.headerContent}`}>
          <h1>About Property Express</h1>
          <p className="subtitle">Redefining luxury real estate with trust and transparency.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.div
            className={styles.storySection}
            variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
          >
            <h2>Our Story</h2>
            <p className={styles.storyText}>
              Founded in 2020, Property Express started with a simple mission: to eliminate the friction from buying and renting premium properties. Fast forward to today, and we have become the region's leading exclusive real estate agency.
            </p>
            <p className={styles.storyText}>
              We believe that finding a home should be an inspiring journey, not a stressful task. That's why we don't rely on external agents—every property listed is verified and managed by our in-house experts.
            </p>
          </motion.div>
        </div>
      </section>


      <section className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2>Our Core Values</h2>
            <p className="subtitle" style={{ margin: '0 auto' }}>The principles that guide everything we do.</p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: '3rem' }}>
            {[
              { icon: Target, title: 'Mission-Driven' },
              { icon: Users, title: 'Client-First' },
              { icon: CheckCircle, title: 'Transparent' }
            ].map((val, i) => (
              <motion.div
                key={i} className={styles.valueCard}
                variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
                transition={{ delay: i * 0.1 }}
              >
                <val.icon size={48} className={styles.valueIcon} />
                <h3>{val.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
