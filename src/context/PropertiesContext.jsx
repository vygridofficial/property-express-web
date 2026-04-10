import React, { createContext, useState, useEffect } from 'react';
import { getAllProperties } from '../services/propertyService';

export const PropertiesContext = createContext();

export const PropertiesProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllProperties(filters);
        setProperties(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [filters]);

  return (
    <PropertiesContext.Provider value={{ properties, loading, error, filters, setFilters }}>
      {children}
    </PropertiesContext.Provider>
  );
};
