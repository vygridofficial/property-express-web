import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, File, CheckCircle2, RotateCw,
  Download, Eye, Save, AlertCircle, ArrowRight, HelpCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateAgreementPDF } from '../../utils/generateAgreementPDF';

const AVAILABLE_FIELDS = [
  { id: 'sellerName',       label: 'Full legal name' },
  { id: 'sellerEmail',      label: 'Seller email' },
  { id: 'sellerPhone',      label: 'Seller phone' },
  { id: 'propertyTitle',    label: 'Property title' },
  { id: 'propertyType',     label: 'Property type' },
  { id: 'address',          label: 'Property address' },
  { id: 'location',         label: 'Property location' },
  { id: 'area',             label: 'Property area' },
  { id: 'price',            label: 'Listed sale price' },
  { id: 'id',               label: 'Govt. ID number' },
  { id: 'current_date',     label: 'Approval date (auto)' },
  { id: 'seller_signature', label: 'Seller signature (image)' },
  { id: 'admin_signature',  label: 'Admin signature (image)' },
];

const PREVIEW_SAMPLE = {
  sellerName:    'Rajesh Kumar',
  sellerEmail:   'rajesh@example.com',
  sellerPhone:   '+91 98765 43210',
  propertyTitle: 'Luxury Villa, Kochi',
  propertyType:  'Villa',
  address:       '12/A, Canal Road, Alappuzha, Kerala 688001',
  location:      'Alappuzha, Kerala',
  area:          '3200',
  price:         '4200000',
  id:            'XXXXXX8821',
  current_date:  '15 April 2026',
};

export default function AgreementTemplateTab() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate]   = useState(null);
  const [mappings, setMappings]   = useState({});
  const [placeholders, setPlaceholders] = useState([]);
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [dragging, setDragging]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateTex, setTemplateTex] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchTemplateData(); }, []);

  const fetchTemplateData = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'admin_settings', 'agreement_template'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTemplate(data);
        setMappings(data.mappings || {});
        setPlaceholders(data.placeholders || []);
        if (data.templateTex) setTemplateTex(data.templateTex);
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (selectedFile) => {
    setError('');
    if (!selectedFile) return;
    if (selectedFile.size > 2 * 1024 * 1024) { setError('File exceeds 2 MB limit.'); return; }
    if (!selectedFile.name.endsWith('.tex') && !selectedFile.name.endsWith('.txt')) { 
      setError('Please upload a .tex or .txt LaTeX template.'); 
      return; 
    }
    
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        setTemplateTex(text);
        
        const regex = /(?:\\\{|\{){2}\s*([^{}]+?)\s*(?:\\\}|\}){2}/g;
        const matches = new Set();
        let match;
        while ((match = regex.exec(text)) !== null) {
           const tag = match[1].replace(/\\/g, '').trim();
           matches.add(tag);
        }
        
        const found = Array.from(matches);
        setPlaceholders(found);
        setFile(selectedFile);

        const auto = { ...mappings };
        found.forEach(tag => {
          if (!auto[tag]) {
            const hit = AVAILABLE_FIELDS.find(f => f.id === tag);
            if (hit) auto[tag] = hit.id;
          }
        });
        setMappings(auto);
      } catch (err) { 
        setError('Failed to parse LaTeX template.'); 
      } finally { 
        setUploading(false); 
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleSave = async () => {
    if (!templateTex) {
      setError('❌ No template content found. Please upload a .tex file.');
      return;
    }
    setUploading(true); setError(''); setSuccess('');
    try {
      const data = { 
        templateTex, 
        fileName: file?.name || template?.fileName || 'agreement.tex', 
        updatedAt: serverTimestamp(), 
        placeholders, 
        mappings, 
        status: 'active' 
      };

      await setDoc(doc(db, 'admin_settings', 'agreement_template'), data);
      setTemplate({ ...data, updatedAt: new Date() });
      setFile(null);
      setIsEditing(false);
      setSuccess('✅ LaTeX template activated successfully');
    } catch (err) {
      setError(`❌ Failed to save: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateMapping = (ph, fieldId) =>
    setMappings(prev => ({ ...prev, [ph]: fieldId }));

  const handleDownloadPreview = async () => {
    setIsPreviewing(true);
    try {
      await generateAgreementPDF(PREVIEW_SAMPLE, null, true);
      setIsPreviewing(false);
    } catch (err) {
      setIsPreviewing(false);
      alert('Preview generation failed.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <RotateCw className="animate-spin" size={32} color="#ed1b24" />
    </div>
  );

  const panel = {
    background: 'var(--admin-glass-bg)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--admin-glass-border)',
    borderRadius: 16,
  };

  const sectionLabel = {
    fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--admin-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.75rem'
  };

  const unmappedCount = placeholders.filter(p => !mappings[p]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
         Upload a .tex file to generate vector-perfect PDFs.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT — Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(!template || isEditing) ? (
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
              style={{
                ...panel, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                border: `2px dashed ${dragging ? '#ed1b24' : 'var(--admin-glass-border)'}`,
              }}
            >
              <input type="file" ref={fileInputRef} hidden accept=".tex,.txt" onChange={(e) => processFile(e.target.files[0])} />
              <Upload size={40} color="var(--admin-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--admin-text-main)' }}>
                {file ? file.name : 'Upload LaTeX Template (.tex)'}
              </p>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Direct Vector Export · No Clipping</p>
            </div>
          ) : (
            <div style={{ ...panel, padding: '1.25rem' }}>
              <div style={sectionLabel}>Current LaTeX Template</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ width: 40, height: 40, background: 'rgba(237,27,36,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <File size={20} color="#ed1b24" />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{template.fileName}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{placeholders.length} placeholders detected</div>
                 </div>
                 <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Replace</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Mappings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={sectionLabel}>Placeholder Mappings</div>
          {placeholders.length === 0 ? (
            <div style={{ ...panel, padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
              Upload a .tex file to configure mappings.
            </div>
          ) : (
            <div style={{ 
              ...panel, 
              padding: '1.25rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
               {placeholders.map(ph => (
                 <div key={ph} style={{ 
                   display: 'flex', 
                   flexDirection: isMobile ? 'column' : 'row',
                   alignItems: isMobile ? 'stretch' : 'center', 
                   gap: '1rem', 
                   padding: '0.5rem', 
                   borderRadius: '12px',
                   transition: 'background 0.2s',
                   background: 'rgba(0,0,0,0.02)'
                 }}
                 onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                 >
                    <div style={{ 
                      flex: 1, 
                      background: 'rgba(237,27,36,0.08)', 
                      padding: '0.6rem 1rem', 
                      borderRadius: '10px', 
                      fontSize: '0.75rem', 
                      fontFamily: 'monospace', 
                      color: '#ed1b24',
                      fontWeight: 700,
                      border: '1px solid rgba(237,27,36,0.15)',
                      textAlign: 'center'
                    }}>
                       {`{{${ph}}}`}
                    </div>
                    {!isMobile && <ArrowRight size={14} color="var(--admin-text-muted)" style={{ opacity: 0.5 }} />}
                    <select
                      value={mappings[ph] || ''}
                      onChange={(e) => updateMapping(ph, e.target.value)}
                      style={{ 
                        flex: 1.5, 
                        padding: '0.6rem 1rem', 
                        borderRadius: '10px', 
                        background: 'white', 
                        border: '1px solid #e2e8f0', 
                        color: '#1e293b', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">— select field —</option>
                      {AVAILABLE_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={handleSave} disabled={uploading} style={{ padding: '0.8rem 2rem', background: '#ed1b24', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
          {uploading ? 'Activating...' : 'Save & Activate LaTeX Template'}
        </button>
        <button onClick={handleDownloadPreview} disabled={!templateTex} style={{ padding: '0.8rem 2rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
           <Eye size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: '#ed1b24' }} /> Preview LaTeX Output
        </button>
      </div>

      {success && <div style={{ color: '#10b981', fontWeight: 700 }}>{success}</div>}
      {error && <div style={{ color: '#ef4444', fontWeight: 700 }}>{error}</div>}
      
      {unmappedCount > 0 && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '-0.5rem 0 0' }}>
          Resolve <strong>{unmappedCount}</strong> unmapped field{unmappedCount > 1 ? 's' : ''} before saving.
        </p>
      )}
    </div>
  );
}
