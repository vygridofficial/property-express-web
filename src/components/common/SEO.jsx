import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAdmin } from '../../admin/context/AdminContext';

/**
 * Reusable SEO component for managing head tags
 */
const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schemaData,
  propertyId,
}) => {
  const { siteSettings } = useAdmin();

  // Fallbacks from site settings
  const siteName = siteSettings?.siteName || 'Property Express';
  const tagline = siteSettings?.tagline || 'Premium Real Estate';
  const defaultDescription = siteSettings?.metaDescription || 'Premium real estate agency for villas, apartments, and plots.';
  const defaultKeywords = siteSettings?.metaKeywords || 'real estate, property, villas, apartments, plots';
  const defaultImage = siteSettings?.ogImage || 'https://propertyexpress-mu.vercel.app/og-image.jpg'; // Placeholder for default OG image
  const twitterHandle = siteSettings?.twitterHandle || '@PropertyExpress';
  const baseUrl = 'https://propertyexpress-mu.vercel.app';

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | ${tagline}`;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image || defaultImage;
  const canonicalUrl = url ? `${baseUrl}${url}` : baseUrl;

  // Schema Markup (LD+JSON)
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": baseUrl,
    "description": defaultDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const currentSchema = schemaData || defaultSchema;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(currentSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
