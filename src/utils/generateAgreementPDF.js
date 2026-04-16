import jsPDF from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { mergeHtmlTemplate } from './templateProcessor';

/**
 * Generates an agreement PDF. 
 * Checks for a dynamic template first; if none exists, falls back to legacy procedural layout.
 */
export const generateAgreementPDF = async (submissionData, adminSignatureData, downloadDirectly = false) => {
  try {
    // 1. Check for Active Template in Firestore
    const docRef = doc(db, 'admin_settings', 'agreement_template');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().status === 'active') {
      const templateData = docSnap.data();
      
      console.log('[AgreementPDF] Template fields:', { 
        hasTemplateHtml: !!templateData.templateHtml,
        hasBase64: !!templateData.fileBase64, 
        hasUrl: !!templateData.fileUrl, 
        fileName: templateData.fileName,
        mappingCount: Object.keys(templateData.mappings || {}).length
      });

      // Merge data into template
      const signatures = {
        seller: submissionData.sellerSignature,
        admin: adminSignatureData
      };

      let populatedHtml;

      if (templateData.templateHtml) {
        // ✅ Use the exact same HTML merging as the preview modal
        populatedHtml = await mergeHtmlTemplate(templateData.templateHtml, submissionData, templateData.mappings, signatures);
      } else {
        throw new Error('No template content found. Please re-upload in Agreement Format tab.');
      }

      // Create container with visible positioning for reliable capture
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.backgroundColor = '#fff';
      container.innerHTML = populatedHtml;
      document.body.appendChild(container);

      // Use jsPDF's html method which handles the layout perfectly
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });

      return new Promise((resolve, reject) => {
        pdf.html(container, {
          callback: (pdfInstance) => {
            document.body.removeChild(container);
            if (downloadDirectly) {
              const fileName = `Agreement_${(submissionData.propertyTitle || 'Draft').replace(/\s+/g, '_')}.pdf`;
              pdfInstance.save(fileName);
              resolve();
            } else {
              resolve(pdfInstance.output('blob'));
            }
          },
          margin: [40, 40, 40, 40],
          autoPaging: 'text',
          x: 0,
          y: 0,
          width: 515, // A4 size in points (595) minus margins (40 + 40 = 80)
          windowWidth: 800,
          useCORS: true,
          allowTaint: true
        }).catch(err => {
          if (document.body.contains(container)) document.body.removeChild(container);
          console.error('PDF generation failed:', err);
          reject(err);
        });
      });
    }
  } catch (err) {
    console.warn("Dynamic template failed, falling back to legacy: ", err);
  }

  // LEGACY FALLBACK (Hardcoded Layout)
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  const addCenteredText = (text, y, size = 12, style = 'normal') => {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", style);
    const textWidth = pdf.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    pdf.text(text, x, y);
  };

  addCenteredText("PROPERTY EXPRESS", yPos, 22, 'bold');
  yPos += 10;
  addCenteredText("PROPERTY LISTING & COMMISSION AGREEMENT", yPos, 14, 'bold');
  yPos += 15;

  pdf.setFontSize(10);
  pdf.text(`Reference ID: ${submissionData.id || 'N/A'}`, 15, yPos);
  pdf.text(`Date of Approval: ${new Date().toLocaleDateString()}`, pageWidth - 70, yPos);
  yPos += 15;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
  pdf.text("1. PARTIES INVOLVED", 18, yPos);
  yPos += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Platform: Property Express Administration`, 15, yPos);
  yPos += 6;
  pdf.text(`Seller Name: ${submissionData.sellerName || 'N/A'}`, 15, yPos);
  yPos += 6;
  pdf.text(`Seller Email: ${submissionData.sellerEmail || 'N/A'}`, 15, yPos);
  yPos += 6;
  pdf.text(`Seller Phone: ${submissionData.sellerPhone || 'N/A'}`, 15, yPos);
  yPos += 15;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
  pdf.text("2. PROPERTY DETAILS", 18, yPos);
  yPos += 10;

  pdf.text(`Title: ${submissionData.propertyTitle || 'N/A'}`, 15, yPos);
  yPos += 6;
  pdf.text(`Type: ${submissionData.propertyType || 'N/A'}`, 15, yPos);
  yPos += 6;
  pdf.text(`Area: ${submissionData.area || 'N/A'} sq.ft`, 15, yPos);
  yPos += 6;
  pdf.text(`Price: INR ${submissionData.price || 'N/A'}`, 15, yPos);
  yPos += 10;

  const splitDescription = pdf.splitTextToSize(`Desc: ${submissionData.description || 'N/A'}`, pageWidth - 30);
  pdf.text(splitDescription, 15, yPos);
  yPos += (splitDescription.length * 5) + 20;

  // Signatures
  pdf.text("Seller Signature:", 25, yPos);
  if (submissionData.sellerSignature) {
    if (typeof submissionData.sellerSignature === 'object' && submissionData.sellerSignature.type === 'text') {
      pdf.text(submissionData.sellerSignature.value, 20, yPos + 10);
    } else {
      pdf.addImage(submissionData.sellerSignature, 'PNG', 20, yPos + 5, 50, 20);
    }
  }
  
  pdf.text("Authorized Signatory:", pageWidth - 80, yPos);
  if (adminSignatureData) {
    if (typeof adminSignatureData === 'object' && adminSignatureData.type === 'text') {
      pdf.text(adminSignatureData.value, pageWidth - 85, yPos + 10);
    } else {
      pdf.addImage(adminSignatureData, 'PNG', pageWidth - 85, yPos + 5, 50, 20);
    }
  }

  if (downloadDirectly) {
    pdf.save(`Agreement_${submissionData.id || 'Draft'}.pdf`);
  } else {
    return pdf.output('blob');
  }
};

