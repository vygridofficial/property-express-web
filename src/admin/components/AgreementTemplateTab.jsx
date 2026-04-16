import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, File, CheckCircle2, RotateCw,
  Download, Eye, Save, AlertCircle, ArrowRight, HelpCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import mammoth from 'mammoth';
import { generateAgreementPDF } from '../../utils/generateAgreementPDF';
import { mergeHtmlTemplate } from '../../utils/templateProcessor';
import AgreementPreviewModal from './AgreementPreviewModal';

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
  price:         '₹42,00,000',
  id:            'XXXXXX8821',
  current_date:  '15 April 2026',
};

export default function AgreementTemplateTab() {
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
  const [templateHtml, setTemplateHtml] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const fileInputRef = useRef();

  useEffect(() => { fetchTemplateData(); }, []);

  const fetchTemplateData = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'admin_settings', 'agreement_template'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTemplate(data);

        // ✅ Updated: If templateHtml exists, consider it valid even if fileBase64/fileUrl are missing
        if (data.templateHtml || data.fileBase64 || data.fileUrl) {
          setMappings(data.mappings || {});
          setPlaceholders(data.placeholders || []);
          if (data.templateHtml) setTemplateHtml(data.templateHtml);
          // If we have HTML but it was forcing edit, let's allow it to be viewed
          setIsEditing(false);
        } else {
          // File data is missing — force edit mode so user must re-upload
          console.warn('[AgreementTab] Template has no file data — forcing edit mode.');
          setMappings({});
          setPlaceholders([]);
          setIsEditing(true);
        }
      }
    } catch (err) {
      console.error('Error fetching template:', err);
    } finally {
      setLoading(false);
    }
  };

  const scanPlaceholders = async (arrayBuffer) => {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const regex  = /\{\{([^{}]+)\}\}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(result.value)) !== null) matches.add(match[1].trim());
    return Array.from(matches);
  };

  const processFile = async (selectedFile) => {
    setError('');
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) { setError('File exceeds 10 MB limit.'); return; }
    if (!selectedFile.name.endsWith('.docx'))   { setError('Only .docx files are supported.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        // Extract placeholders from raw text
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        const regex  = /\{\{([^{}]+)\}\}/g;
        const matches = new Set();
        let match;
        while ((match = regex.exec(textResult.value)) !== null) matches.add(match[1].trim());
        const found = Array.from(matches);
        setPlaceholders(found);
        setFile(selectedFile);
        // Also extract HTML for storage (much smaller than the binary file)
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        setTemplateHtml(htmlResult.value);
        const auto = { ...mappings };
        found.forEach(tag => {
          if (!auto[tag]) {
            const hit = AVAILABLE_FIELDS.find(f => f.id === tag);
            if (hit) auto[tag] = hit.id;
          }
        });
        setMappings(auto);
      } catch { setError('Failed to scan the document for placeholders.'); }
      finally   { setUploading(false); }
    };
    reader.onerror = () => { setError('Could not read the file.'); setUploading(false); };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!file && !templateHtml && !template?.fileBase64 && !template?.fileUrl) {
      setError('❌ Please upload a .docx file before saving.');
      return;
    }
    setUploading(true); setError(''); setSuccess('');
    try {
      // Use extracted HTML — much smaller than binary DOCX, well within Firestore 1MB limit
      const htmlToSave = templateHtml || template?.templateHtml || null;
      const fileName   = file?.name || template?.fileName;

      if (!htmlToSave) {
        throw new Error('Template HTML is empty. Please re-upload the .docx file.');
      }

      console.log('[AgreementTab] Saving templateHtml to Firestore, size:', htmlToSave.length, 'bytes');

      const data = { 
        templateHtml: htmlToSave, 
        fileName, 
        updatedAt: serverTimestamp(), 
        placeholders, 
        mappings, 
        status: 'active' 
      };

      await setDoc(doc(db, 'admin_settings', 'agreement_template'), data);
      console.log('[AgreementTab] ✅ Saved successfully!');
      
      setTemplate({ ...data, updatedAt: new Date() });
      setFile(null);
      setIsEditing(false);
      setSuccess('✅ Agreement saved successfully');
    } catch (err) {
      console.error('[AgreementTab] ❌ Save failed:', err);
      const msg = err?.message || 'Unknown error';
      if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('❌ Save blocked by browser extension. Disable your ad-blocker for this site and try again.');
      } else if (msg.toLowerCase().includes('longer than') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('size')) {
        setError('❌ File is too large. Please use a simpler/smaller .docx file.');
      } else {
        setError(`❌ Failed to save: ${msg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const updateMapping = (ph, fieldId) =>
    setMappings(prev => ({ ...prev, [ph]: fieldId }));

  const unmappedCount = placeholders.filter(p => !mappings[p]).length;

  const handleFullPreview = async () => {
    setIsPreviewing(true);
    try {
      const mockSubmission = {};
      Object.entries(mappings).forEach(([tag, fieldId]) => {
        mockSubmission[fieldId] = PREVIEW_SAMPLE[fieldId] || `[${tag}]`;
      });
      
      const signatures = {
        seller: { type: 'text', value: 'RAJESH KUMAR (SELLER)' },
        admin: { type: 'text', value: 'PROPERTY EXPRESS (ADMIN)' }
      };

      const html = await mergeHtmlTemplate(templateHtml || template?.templateHtml, mockSubmission, mappings, signatures);
      setPreviewHtml(html);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Preview failed:', err);
      alert('Failed to generate preview. Check console for details.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownloadPreview = async () => {
    setIsPreviewing(true);
    try {
      const mockSubmission = {};
      Object.entries(mappings).forEach(([tag, fieldId]) => {
        mockSubmission[fieldId] = PREVIEW_SAMPLE[fieldId] || `[${tag}]`;
      });
      const signatures = {
        seller: { type: 'text', value: 'RAJESH KUMAR (SELLER)' },
        admin: { type: 'text', value: 'PROPERTY EXPRESS (ADMIN)' }
      };
      await generateAgreementPDF(mockSubmission, signatures.admin, true);
    } finally {
      setIsPreviewing(false);
    }
  };

  const renderPreview = (text) =>
    text.split(/(\{\{[^{}]+\}\})/g).map((part, i) => {
      const m = part.match(/^\{\{([^{}]+)\}\}$/);
      if (!m) return <span key={i}>{part}</span>;
      const tag = m[1].trim();
      const val = PREVIEW_SAMPLE[mappings[tag]] || '';
      return val
        ? <span key={i} style={{ color: '#22c55e', fontWeight: 600 }}>{val}</span>
        : <span key={i} style={{ color: '#ef4444', fontStyle: 'italic' }}>missing — not yet mapped</span>;
    });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <RotateCw className="animate-spin" size={32} color="#ed1b24" />
    </div>
  );

  /* Shared panel style using CSS vars */
  const panel = {
    background: 'var(--admin-glass-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--admin-glass-border)',
    borderRadius: 16,
  };

  const sectionLabel = {
    fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--admin-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.75rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Warning banner if template has no actual content ── */}
      {template && !template.templateHtml && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', padding: '1rem 1.5rem', borderRadius: '14px', fontSize: '0.875rem', lineHeight: 1.6, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Template file missing — please re-upload</strong>
            Your agreement template settings were saved, but the actual <strong>.docx file</strong> structure was not stored correctly. Please upload your <strong>.docx</strong> file again below and click Save to fix this.
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT — Upload zone & Active Template */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {(!template || isEditing) ? (
            <>
              <div style={{ ...sectionLabel, display: 'flex', justifyContent: 'space-between' }}>
                <span>Upload Template</span>
                {template && (
                  <button onClick={() => { setIsEditing(false); setFile(null); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Cancel</button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  ...panel,
                  padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                  border: `2px dashed ${dragging ? '#ed1b24' : 'var(--admin-glass-border)'}`,
                  background: dragging ? 'rgba(237,27,36,0.05)' : 'var(--admin-glass-bg)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ed1b24'}
                onMouseLeave={e => e.currentTarget.style.borderColor = dragging ? '#ed1b24' : 'var(--admin-glass-border)'}
              >
                <input type="file" ref={fileInputRef} hidden accept=".docx" onChange={(e) => processFile(e.target.files[0])} />
                {uploading
                  ? <RotateCw size={40} color="#ed1b24" style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
                  : <Upload size={40} color={file ? '#ed1b24' : 'var(--admin-text-muted)'} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                }
                <p style={{ fontWeight: 700, margin: '0 0 0.25rem', fontSize: '1rem', color: 'var(--admin-text-main)' }}>
                  {file ? file.name : 'Click to upload or drag & drop'}
                </p>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {file ? 'Click to replace this file' : '.docx or .pdf · Max 10 MB'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ ...sectionLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Currently Active Template</span>
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                  Replace Document
                </button>
              </div>
              <div style={{ ...panel, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 38, height: 38, background: 'rgba(237,27,36,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <File size={18} color="#ed1b24" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--admin-text-main)', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {template.fileName || 'Agreement Template'}
                  </div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                    Uploaded {template.updatedAt?.toDate ? template.updatedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(template.updatedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {placeholders.length} placeholders detected
                  </div>
                </div>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  Active
                </span>
              </div>
            </>
          )}

          {/* Active template file selected state during edit mode */}
          {isEditing && file && (
            <div style={{ ...panel, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(237,27,36,0.3)', background: 'rgba(237,27,36,0.02)' }}>
                <div style={{ width: 38, height: 38, background: 'rgba(237,27,36,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <File size={18} color="#ed1b24" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--admin-text-main)', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                    {placeholders.length} placeholders detected - Ready to save
                  </div>
                </div>
            </div>
          )}
        </div>

        {/* RIGHT — Placeholder mapping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={sectionLabel}>Placeholder → Seller Field Mapping</div>

          {placeholders.length === 0 ? (
            <div style={{ ...panel, padding: '3rem 2rem', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--admin-glass-border)' }}>
              <HelpCircle size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} color="var(--admin-text-muted)" />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>Upload a template to see its placeholders here.</p>
            </div>
          ) : (
            <div style={{ ...panel, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 22px 1fr', gap: '0.5rem', padding: '0 0.25rem', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Template placeholder</div>
                <div />
                <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Seller portal field</div>
              </div>

              {placeholders.map(ph => {
                const isMapped = !!mappings[ph];
                return (
                  <div key={ph} style={{ display: 'grid', gridTemplateColumns: '1fr 22px 1fr', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Placeholder pill */}
                    <div style={{
                      background: 'rgba(165,180,252,0.12)',
                      border: '1px solid rgba(165,180,252,0.25)',
                      padding: '0.5rem 0.85rem', borderRadius: '8px',
                      color: '#a5b4fc', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {`{{${ph}}}`}
                    </div>

                    <ArrowRight size={13} color="var(--admin-text-muted)" style={{ justifySelf: 'center' }} />

                    {/* Field selector */}
                    <select
                      value={mappings[ph] || ''}
                      onChange={(e) => updateMapping(ph, e.target.value)}
                      style={{
                        padding: '0.52rem 0.85rem',
                        borderRadius: '8px',
                        border: isMapped
                          ? '1px solid var(--admin-glass-border)'
                          : '2px solid rgba(239,68,68,0.5)',
                        background: 'var(--admin-glass-bg)',
                        color:  isMapped ? 'var(--admin-text-main)' : '#ef4444',
                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                        width: '100%', outline: 'none', fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      <option value="">— unmapped —</option>
                      {AVAILABLE_FIELDS.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview section ── */}
      {placeholders.length > 0 && (
        <div style={{ ...panel, padding: '1.5rem' }}>
          <div style={{ ...sectionLabel, marginBottom: '1rem' }}>Preview — How Placeholders Resolve</div>
          <div style={{
            background: 'var(--admin-glass-bg)',
            border: '1px solid var(--admin-glass-border)',
            borderRadius: '12px', padding: '1.25rem 1.5rem',
            color: 'var(--admin-text-body)', fontSize: '0.9rem', lineHeight: 1.8
          }}>
            {renderPreview(
              `This Sale Agreement is entered into on {{current_date}} between {{sellerName}} ( {{sellerName}} ) and the buyer, concerning the property located at {{address}} ( {{address}} ). The agreed sale price is {{price}} ( {{price}} ). Government ID: {{id}} ( {{id}} ).`
            )}
          </div>
        </div>
      )}

      {/* ── Feedback banners ── */}
      {error   && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}>{success}</div>}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={uploading || unmappedCount > 0}
          style={{
            padding: '0.9rem 2rem',
            background: unmappedCount > 0 || uploading ? 'var(--admin-glass-bg)' : '#ed1b24',
            color:      unmappedCount > 0 || uploading ? 'var(--admin-text-muted)' : 'white',
            border:     unmappedCount > 0 || uploading ? '1px solid var(--admin-glass-border)' : 'none',
            borderRadius: '12px', fontWeight: 700, cursor: unmappedCount > 0 || uploading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
            boxShadow: unmappedCount > 0 || uploading ? 'none' : '0 4px 14px rgba(237,27,36,0.3)',
            fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s'
          }}
        >
          {uploading ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} />}
          Save &amp; activate template
        </button>

        {template?.fileUrl && (
          <a
            href={template.fileUrl} target="_blank" rel="noopener noreferrer"
            style={{
              padding: '0.9rem 2rem',
              background: 'var(--admin-glass-bg)',
              border: '1px solid var(--admin-glass-border)',
              color: 'var(--admin-text-main)',
              borderRadius: '12px', textDecoration: 'none', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <Download size={16} /> Download current template
          </a>
        )}

        <button
          onClick={handleFullPreview}
          disabled={isPreviewing || !templateHtml && !file}
          style={{
            padding: '0.9rem 2rem',
            background: 'var(--admin-glass-bg)',
            border: '1px solid var(--admin-glass-border)',
            color: 'var(--admin-text-main)',
            borderRadius: '12px', fontWeight: 700, cursor: (isPreviewing || !templateHtml && !file) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
            fontFamily: 'Outfit, sans-serif'
          }}
        >
          {isPreviewing ? <RotateCw size={16} className="animate-spin" /> : <Eye size={16} />}
          Preview full agreement
        </button>
      </div>

      {unmappedCount > 0 && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '-0.5rem 0 0' }}>
          Resolve <strong>{unmappedCount}</strong> unmapped field{unmappedCount > 1 ? 's' : ''} before saving.
        </p>
      )}

      {/* ── Agreement Preview Modal ── */}
      <AgreementPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        htmlContent={previewHtml}
        title={file?.name || template?.fileName}
        onDownload={handleDownloadPreview}
        isDownloading={isPreviewing && showPreviewModal}
      />
    </div>
  );
}
