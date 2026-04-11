import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { PropertiesProvider } from './context/PropertiesContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <PropertiesProvider>
          <App />
        </PropertiesProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
