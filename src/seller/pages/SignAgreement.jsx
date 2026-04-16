import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Lock,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { generateAgreementOTP, finalizeAgreement } from '../../services/agreementService';
import { sendOTP } from '../../services/notificationService';
import { generateAgreementPDF } from '../../utils/agreementPdf';
import SignaturePad from '../components/SignaturePad';
import Skeleton from 'react-loading-skeleton';
import styles from '../styles/SignAgreement.module.css';

const DEFAULT_LEGAL_TEXT = `This Agreement ("Agreement") is made effective as of the date of signing.

1. SCOPE OF SERVICE: The Seller grants Property Express the exclusive/non-exclusive right to market and facilitate the sale/lease of the specified property.

2. PRICING & COMMISSION: The property shall be marketed at the agreed price. Upon successful transaction, a commission as per the standard company policy or manual agreement shall be applicable.

3. DISCLOSURE: The Seller confirms that all information provided regarding the property is accurate and that they hold legal authority to enter into this agreement.

4. DURATION: This agreement shall remain valid for a period of 6 months from the date of signing unless terminated earlier by mutual consent in writing.

5. CONFIDENTIALITY: Both parties agree to maintain the confidentiality of sensitive information exchanged during the course of this agreement.`;

export default function SignAgreement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agreements, refreshAgreements } = useSeller();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: View, 2: Consent, 3: Sign, 4: OTP, 5: Success
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signature, setSignature] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const data = agreements.find(a => a.id === id);
    if (data) {
      setAgreement(data);
      setLoading(false);
    } else {
      // Fallback if not in context
      navigate('/agreements');
    }
  }, [id, agreements, navigate]);

  const handleSendOTP = async () => {
    try {
      const otp = await generateAgreementOTP(agreement.id);
      await sendOTP(agreement.sellerPhone, otp);
      setStep(4);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    setOtpError('');
    
    // Simulate verification
    setTimeout(async () => {
      if (otpValue === agreement.activeOTP) {
        await finalizeAgreement(agreement.id, signature);
        await refreshAgreements();
        setStep(5);
      } else {
        setOtpError('Invalid code. Please try again.');
      }
      setIsVerifying(false);
    }, 1500);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (loading) return <div className={styles.loaderArea}><Clock className={styles.rotating} /></div>;

  return (
    <div className={styles.dashboardWrapper}>
      <header className={styles.header}>
        {loading ? <Skeleton height={40} width={200} /> : <h1>Sign Agreement</h1>}
      </header>
      {loading ? (
        <Skeleton count={5} height={30} style={{ marginBottom: '1rem' }} />
      ) : (
        <div className={styles.signPage}>
          <header className={styles.signHeader}>
            <button onClick={() => navigate('/agreements')} className={styles.backBtn}>
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(step / 5) * 100}%` }}></div>
            </div>
          </header>

          <div className={styles.signContainer}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.stepBox}>
                    <div className={styles.titleArea}>
                      <FileText size={32} />
                      <h2>Agreement Review</h2>
                    </div>
                    <div className={styles.docBox}>
                      <div className={styles.docHeader}>
                        <h3>{agreement.propertyTitle}</h3>
                        <p>{agreement.propertyCategory} | {agreement.propertyAddress}</p>
                      </div>
                      <div className={styles.docBody}>
                        {agreement.customLegalText || DEFAULT_LEGAL_TEXT}
                      </div>
                    </div>
                    <button className={styles.ctaBtn} onClick={nextStep}>
                      I Understand, Let's Proceed <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className={styles.stepBox}>
                    <div className={styles.titleArea}>
                      <ShieldCheck size={32} />
                      <h2>Legal Consent</h2>
                    </div>
                    <div className={styles.consentBox}>
                      <p>By checking the box below, you electronically consent to the terms of this agreement and acknowledge it as a legally binding document.</p>
                      <label className={styles.checkLabel}>
                        <input type="checkbox" checked={hasAgreed} onChange={(e) => setHasAgreed(e.target.checked)} />
                        <span>I agree to the terms and conditions outlined in this document.</span>
                      </label>
                    </div>
                    <div className={styles.btnRow}>
                      <button className={styles.ghostBtn} onClick={prevStep}>Back</button>
                      <button className={styles.ctaBtn} disabled={!hasAgreed} onClick={nextStep}>
                        Go to Digital Signature
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className={styles.stepBox}>
                    <div className={styles.titleArea}>
                      <Lock size={32} />
                      <h2>Digital Signature</h2>
                    </div>
                    <SignaturePad onSave={(data) => { setSignature(data); handleSendOTP(); }} />
                    <button className={styles.linkBtn} onClick={prevStep}>Back</button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.stepBox} style={{ textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 1.5rem', color: '#18181a' }} />
                  <h2>Verify Identity</h2>
                  <p>Enter the 6-digit code sent to <strong>{agreement.sellerPhone}</strong></p>
                  
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className={styles.otpField}
                    placeholder="000 000"
                  />
                  
                  {otpError && <p className={styles.errorText}>{otpError}</p>}
                  
                  <button className={styles.ctaBtn} onClick={handleVerifyOTP} disabled={otpValue.length < 6 || isVerifying}>
                    {isVerifying ? <RefreshCw className={styles.spin} /> : 'Finalize & Sign Document'}
                  </button>
                  <button className={styles.linkBtn} onClick={handleSendOTP} style={{ marginTop: '1rem' }}>Resend Code</button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.successCard}>
                  <CheckCircle size={80} color="#10b981" />
                  <h1>Document Finalized</h1>
                  <p>Your agreement for "{agreement.propertyTitle}" has been securely signed and timestamped.</p>
                  
                  <div className={styles.successActions}>
                    <button className={styles.ctaBtn} onClick={() => generateAgreementPDF(agreement, signature)}>
                      Download Signed PDF
                    </button>
                    <button className={styles.ghostBtn} onClick={() => navigate('/agreements')}>
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
