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
  { id: 'formNo',           label: 'Form number' },
  { id: 'slNo',             label: 'Serial number' },
  { id: 'sellerName',       label: 'Full legal name' },
  { id: 'sellerEmail',      label: 'Seller email' },
  { id: 'sellerPhone',      label: 'Seller phone' },
  { id: 'propertyTitle',    label: 'Property title' },
  { id: 'propertyType',     label: 'Property type' },
  { id: 'propertyCategory', label: 'Property category' },
  { id: 'listingType',      label: 'Listing type' },
  { id: 'address',          label: 'Property address' },
  { id: 'propertyAddress',  label: 'Saved property address' },
  { id: 'location',         label: 'Property location' },
  { id: 'area',             label: 'Property area' },
  { id: 'price',            label: 'Listed sale price' },
  { id: 'description',      label: 'Property description' },
  { id: 'agreementDuration', label: 'Agreement duration' },
  { id: 'tokenAdvance',     label: 'Token advance' },
  { id: 'validUntil',       label: 'Valid until date' },
  { id: 'adminName',        label: 'Authorized signatory' },
  { id: 'adminDesignation', label: 'Authorized designation' },
  { id: 'id',               label: 'Govt. ID number' },
  { id: 'current_date',     label: 'Approval date (auto)' },
  { id: 'seller_signature', label: 'Seller signature (image)' },
  { id: 'admin_signature',  label: 'Admin signature (image)' },
];

const MOU_FIELDS = [
  { id: 'formNo', label: 'Form No' },
  { id: 'slNo', label: 'Sl No' },
  { id: 'date', label: 'Date' },
  { id: 'sellerName', label: 'Property owner name' },
  { id: 'sellerPhone', label: 'Phone number' },
  { id: 'sellerEmail', label: 'Email' },
  { id: 'idProof', label: 'ID proof' },
  { id: 'address', label: 'Owner/property address' },
  { id: 'propertyType', label: 'Property type checkbox' },
  { id: 'location', label: 'Property location' },
  { id: 'area', label: 'Total area' },
  { id: 'listingType', label: 'Sale or rent checkbox' },
  { id: 'propertyDetails', label: 'Property details' },
  { id: 'ownerExpectedNetAmount', label: 'Owner expected net amount' },
  { id: 'agreementDuration', label: 'Agreement duration' },
  { id: 'tokenAdvance', label: 'Token advance' },
  { id: 'validUntil', label: 'Valid until' },
  { id: 'authorizedSignatory', label: 'Authorized signatory' },
  { id: 'designation', label: 'Designation' },
];

const DEFAULT_MOU_MAPPINGS = {
  formNo: 'id',
  slNo: 'id',
  date: 'current_date',
  sellerName: 'sellerName',
  sellerPhone: 'sellerPhone',
  sellerEmail: 'sellerEmail',
  idProof: 'id',
  address: 'propertyAddress',
  propertyType: 'propertyType',
  location: 'location',
  area: 'area',
  listingType: 'listingType',
  propertyDetails: 'propertyTitle',
  ownerExpectedNetAmount: 'price',
  agreementDuration: 'agreementDuration',
  tokenAdvance: 'tokenAdvance',
  validUntil: 'validUntil',
  authorizedSignatory: 'adminName',
  designation: 'adminDesignation',
};

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
  const [mouMappings, setMouMappings] = useState(DEFAULT_MOU_MAPPINGS);
  const [placeholders, setPlaceholders] = useState([]);
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [dragging, setDragging]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateTex, setTemplateTex] = useState('');
  const [templateType, setTemplateType] = useState('latex');
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
        setMouMappings({ ...DEFAULT_MOU_MAPPINGS, ...(data.mouMappings || {}) });
        setPlaceholders(data.placeholders || []);
        if (data.templateTex) setTemplateTex(data.templateTex);
        setTemplateType(data.templateType || (data.fileName?.toLowerCase().endsWith('.pdf') ? 'mouPdf' : 'latex'));
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
    if (selectedFile.size > 5 * 1024 * 1024) { setError('File exceeds 5 MB limit.'); return; }
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      setTemplateType('mouPdf');
      setTemplateTex('');
      setPlaceholders([]);
      setMouMappings({ ...DEFAULT_MOU_MAPPINGS });
      setFile(selectedFile);
      return;
    }

    if (!fileName.endsWith('.tex') && !fileName.endsWith('.txt')) { 
      setError('Please upload a .pdf MOU or a .tex/.txt LaTeX template.'); 
      return; 
    }
    
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        setTemplateType('latex');
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
        setError('Failed to parse template.'); 
      } finally { 
        setUploading(false); 
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleSave = async () => {
    if (templateType === 'latex' && !templateTex) {
      setError('No template content found. Please upload a .tex file.');
      return;
    }
    setUploading(true); setError(''); setSuccess('');
    try {
      const data = { 
        templateType,
        templateTex: templateType === 'latex' ? templateTex : '',
        fileName: file?.name || template?.fileName || (templateType === 'mouPdf' ? 'Property Express MOU.pdf' : 'agreement.tex'), 
        updatedAt: serverTimestamp(), 
        placeholders: templateType === 'latex' ? placeholders : [], 
        mappings: templateType === 'latex' ? mappings : {}, 
        mouMappings: templateType === 'mouPdf' ? mouMappings : {}, 
        status: 'active' 
      };

      await setDoc(doc(db, 'admin_settings', 'agreement_template'), data);
      setTemplate({ ...data, updatedAt: new Date() });
      setFile(null);
      setIsEditing(false);
      setSuccess(templateType === 'mouPdf' ? 'MOU PDF template activated successfully' : 'LaTeX template activated successfully');
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateMapping = (ph, fieldId) =>
    setMappings(prev => ({ ...prev, [ph]: fieldId }));

  const updateMouMapping = (fieldId, sourceField) =>
    setMouMappings(prev => ({ ...prev, [fieldId]: sourceField }));

  const handleDownloadPreview = async () => {
    setIsPreviewing(true);
    try {
      await generateAgreementPDF(PREVIEW_SAMPLE, null, true, null, { templateType, templateTex, mappings, mouMappings });
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
         Upload the Property Express MOU PDF to use the designed 4-page agreement, or upload a .tex file for text templates.
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
              <input type="file" ref={fileInputRef} hidden accept=".pdf,.tex,.txt" onChange={(e) => processFile(e.target.files[0])} />
              <Upload size={40} color="var(--admin-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--admin-text-main)' }}>
                {file ? file.name : 'Upload MOU PDF or LaTeX Template'}
              </p>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>PDF MOU · LaTeX · No Clipping</p>
            </div>
          ) : (
            <div style={{ ...panel, padding: '1.25rem' }}>
              <div style={sectionLabel}>Current Agreement Template</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ width: 40, height: 40, background: 'rgba(237,27,36,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <File size={20} color="#ed1b24" />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{template.fileName}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {templateType === 'mouPdf' ? 'Designed MOU PDF with app data overlays' : `${placeholders.length} placeholders detected`}
                    </div>
                 </div>
                 <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Replace</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Mappings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={sectionLabel}>Placeholder Mappings</div>
          {templateType === 'mouPdf' ? (
            <div style={{ 
              ...panel, 
              padding: '1.25rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {MOU_FIELDS.map(field => (
                <div key={field.id} style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center', 
                  gap: '1rem', 
                  padding: '0.5rem', 
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.02)'
                }}>
                  <div style={{ 
                    flex: 1, 
                    background: 'rgba(237,27,36,0.08)', 
                    padding: '0.6rem 1rem', 
                    borderRadius: '10px', 
                    fontSize: '0.75rem', 
                    color: '#ed1b24',
                    fontWeight: 700,
                    border: '1px solid rgba(237,27,36,0.15)',
                    textAlign: 'center'
                  }}>
                    {field.label}
                  </div>
                  {!isMobile && <ArrowRight size={14} color="var(--admin-text-muted)" style={{ opacity: 0.5 }} />}
                  <select
                    value={mouMappings[field.id] || ''}
                    onChange={(e) => updateMouMapping(field.id, e.target.value)}
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
                    <option value="">— leave blank —</option>
                    {AVAILABLE_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : placeholders.length === 0 ? (
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
          {uploading ? 'Activating...' : `Save & Activate ${templateType === 'mouPdf' ? 'MOU PDF' : 'LaTeX Template'}`}
        </button>
        <button onClick={handleDownloadPreview} disabled={templateType === 'latex' && !templateTex} style={{ padding: '0.8rem 2rem', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
           <Eye size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: '#ed1b24' }} /> Preview Agreement Output
        </button>
      </div>

      {success && <div style={{ color: '#10b981', fontWeight: 700 }}>{success}</div>}
      {error && <div style={{ color: '#ef4444', fontWeight: 700 }}>{error}</div>}
      
      {templateType === 'latex' && unmappedCount > 0 && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '-0.5rem 0 0' }}>
          Resolve <strong>{unmappedCount}</strong> unmapped field{unmappedCount > 1 ? 's' : ''} before saving.
        </p>
      )}
    </div>
  );
}
