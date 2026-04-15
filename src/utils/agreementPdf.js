import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';

export const generateAgreementPDF = async (agreement, signatureData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Add Logo (Center top)
  // We need the logo as base64. In a real environment, you might fetch it or import it.
  // For this implementation, we assume the logo is loaded.
  try {
    const img = new Image();
    img.src = logo;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if logo fails
    });
    
    if (img.complete && img.naturalHeight !== 0) {
      const logoWidth = 40;
      const logoHeight = (img.naturalHeight * logoWidth) / img.naturalWidth;
      doc.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
    }
  } catch (err) {
    console.error('Failed to add logo to PDF:', err);
  }

  // 2. Header Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PROPERTY AGREEMENT', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agreement ID: #${agreement.id.slice(-6).toUpperCase()}`, pageWidth - 20, 60, { align: 'right' });
  doc.text(`Date of Signing: ${new Date().toLocaleDateString()}`, 20, 60);

  // 3. Property Details Box
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(250, 250, 250);
  doc.rect(20, 70, pageWidth - 40, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PROPERTY DETAILS', 25, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Title: ${agreement.propertyTitle}`, 25, 88);
  doc.text(`Category: ${agreement.propertyCategory} | Address: ${agreement.propertyAddress}`, 25, 94);

  // 4. Agreement Content
  const legalText = agreement.customLegalText || `This Agreement ("Agreement") is made effective as of the date of signing.
  1. SCOPE OF SERVICE: The Seller grants Property Express the exclusive/non-exclusive right to market and facilitate the sale/lease of the specified property.
  2. PRICING & COMMISSION: The property shall be marketed at the agreed price. Upon successful transaction, a commission shall be applicable.
  3. DISCLOSURE: The Seller confirms that all information provided regarding the property is accurate.
  4. DURATION: This agreement shall remain valid for a period of 6 months.
  5. CONFIDENTIALITY: Both parties agree to maintain the confidentiality of sensitive information.`;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const splitContent = doc.splitTextToSize(legalText, pageWidth - 40);
  doc.text(splitContent, 20, 115);

  // 5. Signature Section
  const signatureY = 115 + (splitContent.length * 5) + 20;
  
  doc.line(20, signatureY, 80, signatureY);
  doc.text('Seller Signature', 20, signatureY + 8);
  
  if (signatureData) {
    if (typeof signatureData === 'string' && signatureData.startsWith('data:image')) {
      doc.addImage(signatureData, 'PNG', 20, signatureY - 20, 50, 20);
    } else if (signatureData.type === 'text') {
      doc.setFont('courier', 'italic');
      doc.text(signatureData.value, 20, signatureY - 5);
      doc.setFont('times', 'normal');
    }
  }

  doc.line(pageWidth - 80, signatureY, pageWidth - 20, signatureY);
  doc.text('Property Express Authorized Signatory', pageWidth - 80, signatureY + 8);
  
  // 6. Security Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Electronically signed and verified via OTP on ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text('This is a legally binding digital document.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // 7. Save/Download
  doc.save(`Agreement_${agreement.propertyTitle.replace(/\s+/g, '_')}.pdf`);
};
