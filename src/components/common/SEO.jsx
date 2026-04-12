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
  const siteName = siteSettings?.siteName || 'Property Express';
  const tagline = siteSettings?.tagline || 'Premium Real Estate';
  const baseUrl = 'https://propertyexpress-mu.vercel.app';

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | ${tagline}`;
  const canonicalUrl = url ? `${baseUrl}${url}` : baseUrl;
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={tagline} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData || {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "url": baseUrl
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
