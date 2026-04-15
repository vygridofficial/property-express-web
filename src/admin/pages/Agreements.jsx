import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  X,
  User,
  Phone,
  Building,
  ArrowRight,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { createAgreement } from '../../services/agreementService';
import { sendAgreementLink } from '../../services/notificationService';
import styles from '../styles/admin.module.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Agreements() {
  const { properties } = useAdmin();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    sellerName: '',
    sellerPhone: '',
    customLegalText: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'seller_agreements'), (snapshot) => {
      setAgreements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    const selectedProp = properties.find(p => p.id === formData.propertyId);
    const agreementData = {
      ...formData,
      propertyTitle: selectedProp?.title || 'Unknown Property',
      propertyCategory: selectedProp?.category || 'Residential',
      propertyAddress: selectedProp?.address || 'N/A'
    };

    try {
      const { id, token } = await createAgreement(agreementData);
      await sendAgreementLink(formData.sellerPhone, selectedProp.title, token);
      setIsModalOpen(false);
      setFormData({ propertyId: '', sellerName: '', sellerPhone: '', customLegalText: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = agreements.filter(a => 
    a.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Seller Agreements</h1>
          <p>Create and manage legal documents for property sellers.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Create Agreement
        </button>
      </header>

      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search by seller or property..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Seller</th>
              <th>Property</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(agreement => (
              <tr key={agreement.id}>
                <td>
                  <div className={styles.userInfo}>
                    <User size={16} />
                    <div>
                      <strong>{agreement.sellerName}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#666' }}>{agreement.sellerPhone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <Building size={16} />
                    <span>{agreement.propertyTitle}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${agreement.status === 'signed' ? styles.statusActive : styles.statusPending}`}>
                    {agreement.status || 'pending'}
                  </span>
                </td>
                <td>{agreement.createdAt?.toDate().toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    {agreement.status === 'signed' ? (
                      <button className={styles.iconBtn} title="View Details"><ExternalLink size={18} /></button>
                    ) : (
                      <button className={styles.iconBtn} title="Resend Notification"><Send size={18} /></button>
                    )}
                    <button className={styles.iconBtn} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.modal}
              style={{ maxWidth: '600px' }}
            >
              <div className={styles.modalHeader}>
                <h2>New Seller Agreement</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Select Property</label>
                  <select 
                    value={formData.propertyId} 
                    onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                  >
                    <option value="">-- Choose a Property --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label>Seller Name</label>
                    <input 
                      type="text" 
                      value={formData.sellerName}
                      onChange={(e) => setFormData({...formData, sellerName: e.target.value})}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label>Seller Phone (WhatsApp)</label>
                    <input 
                      type="text" 
                      value={formData.sellerPhone}
                      onChange={(e) => setFormData({...formData, sellerPhone: e.target.value})}
                      placeholder="+91 ..."
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Custom Legal Text (Optional)</label>
                  <textarea 
                    rows={6}
                    value={formData.customLegalText}
                    onChange={(e) => setFormData({...formData, customLegalText: e.target.value})}
                    placeholder="Leave blank to use default template..."
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.secondaryBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button 
                  className={styles.primaryBtn} 
                  disabled={!formData.propertyId || !formData.sellerPhone}
                  onClick={handleCreate}
                >
                  Create & Send Link <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
