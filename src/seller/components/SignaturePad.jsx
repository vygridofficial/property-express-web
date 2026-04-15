import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, CheckCircle2, Type, Eraser, Upload, AlertTriangle } from 'lucide-react';
import styles from './SignaturePad.module.css';

export default function SignaturePad({ onSave }) {
  const sigCanvas = useRef(null);
  const [method, setMethod] = useState('draw'); // draw, type, upload
  const [typedName, setTypedName] = useState('');
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const clear = () => {
    sigCanvas.current?.clear();
    setSignatureUrl(null);
  };

  const save = () => {
    if (method === 'draw' && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) return;
      const data = sigCanvas.current.getCanvas().toDataURL('image/png');
      setSignatureUrl(data);
      onSave(data);
    } else if (method === 'type' && typedName.trim()) {
      onSave({ type: 'text', value: typedName });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.methodTabs}>
        <button
          className={`${styles.methodBtn} ${method === 'draw' ? styles.active : ''}`}
          onClick={() => { setMethod('draw'); setUploadError(''); }}
        >
          <Eraser size={18} /> Draw
        </button>
        <button
          className={`${styles.methodBtn} ${method === 'type' ? styles.active : ''}`}
          onClick={() => { setMethod('type'); setUploadError(''); }}
        >
          <Type size={18} /> Type
        </button>
        <button
          className={`${styles.methodBtn} ${method === 'upload' ? styles.active : ''}`}
          onClick={() => { setMethod('upload'); setUploadError(''); }}
        >
          <Upload size={18} /> Upload
        </button>
      </div>

      <div className={styles.canvasArea}>
        {method === 'draw' && (
          <>
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#18181a"
              canvasProps={{ className: styles.sigCanvas }}
            />
            <button className={styles.clearBtn} onClick={clear}>
              <Trash2 size={16} /> Clear
            </button>
          </>
        )}

        {method === 'type' && (
          <div className={styles.typeBlock}>
            <input
              type="text"
              placeholder="Type your full name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className={styles.nameInput}
            />
            <div className={styles.previewText} style={{ fontFamily: "'Dancing Script', cursive" }}>
              {typedName || 'Your Signature Preview'}
            </div>
          </div>
        )}

        {method === 'upload' && (
          <div className={styles.uploadBlock}>
            {uploadError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
                padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#92400e', fontSize: '0.85rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Upload Error:</strong> {uploadError}
                  <div style={{ marginTop: 4, opacity: 0.8 }}>
                    Try using the <strong>Draw</strong> tab instead — it works without any network connection.
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadError('');
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                  setUploadError('Please upload a valid image file (PNG, JPG, etc.).');
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setUploadError('Image is too large. Please use an image under 5 MB.');
                  return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                  try {
                    onSave(reader.result);
                    setUploadError('');
                  } catch {
                    setUploadError('Failed to process the image. Please try the Draw method instead.');
                  }
                };
                reader.onerror = () => {
                  setUploadError(
                    'Could not read the image file. This may be caused by a browser extension. ' +
                    'Please try the Draw or Type method instead.'
                  );
                };
                reader.readAsDataURL(file);
              }}
            />
            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
              Upload a clear image of your handwritten signature.
            </p>
          </div>
        )}
      </div>

      <button
        className={styles.primaryBtn}
        onClick={save}
        disabled={method === 'type' && !typedName}
      >
        <CheckCircle2 size={16} /> Confirm Signature
      </button>
    </div>
  );
}
