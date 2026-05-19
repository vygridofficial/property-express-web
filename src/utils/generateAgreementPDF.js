import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { jsPDF } from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../assets/logo.png';
import mouPage1 from '../assets/agreement/property-express-mou-page-1.png';
import mouPage2 from '../assets/agreement/property-express-mou-page-2.png';
import mouPage3 from '../assets/agreement/property-express-mou-page-3.png';
import mouPage4 from '../assets/agreement/property-express-mou-page-4.png';

// Initialize fonts correctly
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else {
  pdfMake.vfs = pdfFonts;
}

const getAssetBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
  });
};

const getPdfDate = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
};

const getAgreementValue = (submissionData, fields, fallback = '') => {
  for (const field of fields) {
    if (submissionData[field] !== undefined && submissionData[field] !== null && String(submissionData[field]).trim()) {
      return String(submissionData[field]).trim();
    }
  }
  return fallback;
};

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

const getMappedMouValue = (submissionData, mappings, key, fallbackFields = [], fallback = '') => {
  const sourceField = mappings[key];
  if (sourceField === 'current_date') return getPdfDate();

  if (sourceField && submissionData[sourceField] !== undefined && submissionData[sourceField] !== null) {
    const value = String(submissionData[sourceField]).trim();
    if (value) return value;
  }

  return getAgreementValue(submissionData, fallbackFields, fallback);
};

const drawFitText = (doc, text, x, y, maxWidth, options = {}) => {
  const value = String(text || '').trim();
  if (!value) return;

  const fontSize = options.fontSize || 8;
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(options.color || '#111111');

  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines.slice(0, options.maxLines || 1), x, y, { lineHeightFactor: 1.15 });
};

const getDateParts = (value) => {
  const raw = String(value || '').trim();
  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    return {
      day: slashMatch[1].padStart(2, '0'),
      month: slashMatch[2].padStart(2, '0'),
      year: slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]
    };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, '0'),
      month: String(parsed.getMonth() + 1).padStart(2, '0'),
      year: String(parsed.getFullYear())
    };
  }

  return { day: raw, month: '', year: '' };
};

const drawDateSlots = (doc, value, x, y) => {
  const parts = getDateParts(value);
  drawFitText(doc, parts.day, x, y, 8, { fontSize: 7.5 });
  drawFitText(doc, parts.month, x + 13, y, 8, { fontSize: 7.5 });
  drawFitText(doc, parts.year, x + 26, y, 18, { fontSize: 7.5 });
};

const drawCheckbox = (doc, x, y) => {
  doc.setDrawColor('#111111');
  doc.setLineWidth(0.35);
  doc.line(x, y, x + 4, y + 4);
  doc.line(x + 4, y, x, y + 4);
};

const generateMouAgreementPDF = async (submissionData, adminSignatureData, downloadDirectly, sellerSignatureOverride, templateData = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageImages = await Promise.all([mouPage1, mouPage2, mouPage3, mouPage4].map(getAssetBase64));
  const pageWidth = 210;
  const pageHeight = 297;
  const today = getPdfDate();
  const mouMappings = { ...DEFAULT_MOU_MAPPINGS, ...(templateData.mouMappings || {}) };
  const signatures = {
    seller: sellerSignatureOverride || submissionData.sellerSignature || submissionData.signatureData || submissionData.signature,
    admin: adminSignatureData || submissionData.adminSignature
  };

  pageImages.forEach((pageImage, index) => {
    if (index > 0) doc.addPage();
    doc.addImage(pageImage, 'PNG', 0, 0, pageWidth, pageHeight);
  });

  const rawFormNo = getMappedMouValue(submissionData, mouMappings, 'formNo', ['formNo', 'id']);
  const rawSlNo = getMappedMouValue(submissionData, mouMappings, 'slNo', ['slNo', 'id']);
  const formNo = mouMappings.formNo === 'id' ? rawFormNo.slice(-8).toUpperCase() : rawFormNo;
  const slNo = mouMappings.slNo === 'id' ? rawSlNo.slice(-6).toUpperCase() : rawSlNo;
  const date = getMappedMouValue(submissionData, mouMappings, 'date', ['date'], today);
  const sellerName = getMappedMouValue(submissionData, mouMappings, 'sellerName', ['sellerName', 'ownerName']);
  const sellerPhone = getMappedMouValue(submissionData, mouMappings, 'sellerPhone', ['sellerPhone', 'phone']);
  const sellerEmail = getMappedMouValue(submissionData, mouMappings, 'sellerEmail', ['sellerEmail', 'email']);
  const idProof = getMappedMouValue(submissionData, mouMappings, 'idProof', ['idProof', 'governmentId', 'id'], 'N/A');
  const address = getMappedMouValue(submissionData, mouMappings, 'address', ['propertyAddress', 'address']);
  const location = getMappedMouValue(submissionData, mouMappings, 'location', ['location', 'propertyLocation'], address);
  const area = getMappedMouValue(submissionData, mouMappings, 'area', ['area', 'propertyArea', 'builtUpArea']);
  const price = getMappedMouValue(submissionData, mouMappings, 'ownerExpectedNetAmount', ['price', 'expectedPrice', 'ownerExpectedNetAmount']);
  const category = getMappedMouValue(submissionData, mouMappings, 'propertyType', ['propertyType', 'propertyCategory', 'category', 'type']).toLowerCase();
  const listingType = getMappedMouValue(submissionData, mouMappings, 'listingType', ['listingType', 'propertyType', 'propertyCategory']).toLowerCase();
  const details = getMappedMouValue(submissionData, mouMappings, 'propertyDetails', ['propertyTitle', 'propertyDetails', 'description']);
  const duration = getMappedMouValue(submissionData, mouMappings, 'agreementDuration', ['agreementDuration', 'duration'], '6 months');
  const tokenAdvance = getMappedMouValue(submissionData, mouMappings, 'tokenAdvance', ['tokenAdvance', 'advanceAmount'], 'N/A');
  const validUntil = getMappedMouValue(submissionData, mouMappings, 'validUntil', ['validUntil', 'expiryDate']);
  const authorizedSignatory = getMappedMouValue(submissionData, mouMappings, 'authorizedSignatory', ['adminName', 'authorizedSignatory'], '');
  const designation = getMappedMouValue(submissionData, mouMappings, 'designation', ['adminDesignation', 'designation'], '');

  doc.setPage(1);
  drawFitText(doc, formNo, 43, 72, 26, { fontSize: 7.5 });
  drawFitText(doc, slNo, 91, 72, 28, { fontSize: 7.5 });
  drawDateSlots(doc, date, 158, 72);
  drawFitText(doc, sellerName, 12, 118, 82);
  drawFitText(doc, sellerPhone, 110, 118, 82);
  drawFitText(doc, sellerEmail, 12, 141, 82);
  drawFitText(doc, idProof, 110, 141, 82);
  drawFitText(doc, address, 12, 162, 180, { maxLines: 2 });
  drawFitText(doc, location, 13, 255, 84);
  drawFitText(doc, area, 112, 255, 80);
  drawFitText(doc, details, 12, 280, 160, { maxLines: 2 });

  if (category.includes('villa')) drawCheckbox(doc, 14, 199);
  else if (category.includes('flat') || category.includes('apartment')) drawCheckbox(doc, 111, 199);
  else if (category.includes('commercial')) drawCheckbox(doc, 14, 209);
  else if (category.includes('warehouse')) drawCheckbox(doc, 111, 209);
  else if (category.includes('land') || category.includes('plot')) drawCheckbox(doc, 14, 220);
  else if (category.includes('rent')) drawCheckbox(doc, 111, 220);
  else drawCheckbox(doc, 111, 232);

  if (listingType.includes('rent') || listingType.includes('lease')) drawCheckbox(doc, 140, 270);
  else drawCheckbox(doc, 111, 270);

  doc.setPage(3);
  drawFitText(doc, price, 12, 57, 75, { fontSize: 7.5 });
  drawFitText(doc, duration, 111, 57, 75, { fontSize: 7.5 });
  drawFitText(doc, tokenAdvance, 76, 90, 80);
  drawFitText(doc, validUntil, 56, 226, 74);

  doc.setPage(4);
  drawFitText(doc, sellerName, 32, 130, 70);
  drawDateSlots(doc, date, 40, 160);
  drawFitText(doc, authorizedSignatory, 80, 175, 58);
  drawFitText(doc, designation, 64, 191, 70);
  drawDateSlots(doc, date, 30, 229);

  if (signatures.seller) {
    doc.addImage(signatures.seller, 'PNG', 32, 136, 38, 12);
  }
  if (signatures.admin) {
    doc.addImage(signatures.admin, 'PNG', 58, 204, 44, 12);
  }

  if (downloadDirectly) {
    const fileName = `Agreement_${(submissionData.propertyTitle || 'Property_Express_MOU').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    return null;
  }

  return doc.output('blob');
};

/**
 * Advanced LaTeX Interpreter for pdfmake.
 * Fixes: Spacing, Tabular alignment, and signature layout.
 */
export const generateAgreementPDF = async (submissionData, adminSignatureData = null, downloadDirectly = true, sellerSignatureOverride = null, templateOverride = null) => {
  console.log('[AgreementPDF] --- GENERATING REFINED LAYOUT ---');
  
  try {
    const docSnap = await getDoc(doc(db, 'admin_settings', 'agreement_template'));
    const data = templateOverride || (docSnap.exists() ? docSnap.data() : {});

    if (templateOverride?.templateType === 'mouPdf' || !docSnap.exists() || data.templateType === 'mouPdf' || !data.templateTex) {
      return generateMouAgreementPDF(submissionData, adminSignatureData, downloadDirectly, sellerSignatureOverride, data);
    }

    let tex = data.templateTex || '';
    const mappings = data.mappings || {};

    const signatures = {
      seller: sellerSignatureOverride || submissionData.sellerSignature || submissionData.signatureData || submissionData.signature,
      admin: adminSignatureData || submissionData.adminSignature
    };
    const logoBase64 = await getAssetBase64(logo);

    const replaceInText = (rawText) => {
      let processed = rawText;
      for (const [tag, fieldId] of Object.entries(mappings)) {
        const tagPattern = tag.split('').map(c => `\\\\?${c}`).join('');
        const regex = new RegExp(`(?:\\\\\\{){2}\\s*${tagPattern}\\s*(?:\\\\\\}){2}|\\{\\{\\s*${tagPattern}\\s*\\}\\}`, 'g');
        
        let val = '';
        if (fieldId === 'seller_signature') val = '[[S_SIG]]';
        else if (fieldId === 'admin_signature') val = '[[A_SIG]]';
        else if (fieldId === 'current_date') val = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        else val = String(submissionData[fieldId] || 'N/A');
        processed = processed.replace(regex, val);
      }
      return processed;
    };

    const docContent = [];
    if (logoBase64) {
      docContent.push({ image: logoBase64, width: 120, alignment: 'center', margin: [0, 0, 0, 15] });
    }

    let inDocument = false;
    let currentTableBody = [];
    let inTabular = false;
    let alignment = 'left';

    const lines = tex.split('\n');

    lines.forEach(line => {
      let trimmed = line.trim();
      if (trimmed.includes('\\begin{document}')) { inDocument = true; return; }
      if (trimmed.includes('\\end{document}')) { inDocument = false; return; }
      if (!inDocument || !trimmed || trimmed.startsWith('%')) return;

      if (trimmed.includes('\\begin{center}')) { alignment = 'center'; return; }
      if (trimmed.includes('\\end{center}')) { alignment = 'left'; return; }

      // --- TABULAR START ---
      if (trimmed.includes('\\begin{tabular}')) { 
        inTabular = true; 
        currentTableBody = []; 
        return; 
      }

      if (inTabular && trimmed.includes('&')) {
        const parts = trimmed.split('&').map(p => p.replace(/\\\\$/, '').trim());
        const label = replaceInText(parts[0]).replace(':', '').replace(/\\/g, '');
        const value = replaceInText(parts[1] || '');

        let cellContent;
        if (value.includes('[[S_SIG]]')) {
          cellContent = signatures.seller ? { image: signatures.seller, width: 80, margin: [0, 5, 0, 5] } : { text: 'Not Signed', italics: true, color: '#999' };
        } else if (value.includes('[[A_SIG]]')) {
          cellContent = signatures.admin ? { image: signatures.admin, width: 80, margin: [0, 5, 0, 5] } : { text: 'Pending Approval', italics: true, color: '#999' };
        } else {
          cellContent = { text: value.replace(/\\/g, ''), bold: true };
        }

        currentTableBody.push([
          { text: label, style: 'tableLabel' },
          cellContent
        ]);
        return;
      }

      if (trimmed.includes('\\end{tabular}')) {
        inTabular = false;
        docContent.push({
          table: {
            widths: [140, '*'],
            body: currentTableBody
          },
          layout: 'noBorders',
          margin: [0, 5, 0, 15],
          unbreakable: true // Keep signatures/details together
        });
        return;
      }
      // --- TABULAR END ---

      if (trimmed.includes('\\vspace')) {
        const spaceMatch = trimmed.match(/\\vspace\{([^}]+)\}/);
        if (spaceMatch) {
          const val = parseFloat(spaceMatch[1]);
          docContent.push({ text: ' ', margin: [0, val * 10, 0, 0] });
          return;
        }
      }

      if (trimmed.includes('\\section*')) {
        const title = trimmed.match(/\\section\*\{([^}]+)\}/)?.[1] || 'Section';
        docContent.push({ text: title.replace(/\\u2014/g, '—').replace(/\\/g, ''), style: 'sectionHeader' });
        return;
      }

      let text = trimmed.replace(/\\\\$/, '').trim();
      if (!text) return;

      let fontSize = 10.5;
      if (text.includes('\\LARGE')) fontSize = 20;
      if (text.includes('\\large')) fontSize = 14;
      
      text = replaceInText(text);
      text = text.replace(/\\LARGE|\\large|\\normalsize|\\noindent|\\textbf\{|\\textit\{|\}/g, '');
      text = text.replace(/\\\&/g, '&').replace(/\\\_/g, '_').replace(/\\u2014/g, '—').replace(/\\/g, '');

      docContent.push({
        text: text,
        fontSize: fontSize,
        bold: trimmed.includes('\\textbf'),
        italics: trimmed.includes('\\textit'),
        alignment: alignment,
        margin: [0, 0, 0, 8],
        lineHeight: 1.3
      });
    });

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [60, 50, 60, 60],
      content: docContent,
      styles: {
        sectionHeader: { fontSize: 13, bold: true, color: '#ed1b24', margin: [0, 15, 0, 5], borderBottom: 1 },
        tableLabel: { fontSize: 10.5, color: '#666', margin: [0, 2, 0, 2] },
        body: { fontSize: 10.5, color: '#222' }
      },
      defaultStyle: { font: 'Roboto' }
    };

    if (downloadDirectly) {
      const fileName = `Agreement_${(submissionData.propertyTitle || 'Draft').replace(/\s+/g, '_')}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    } else {
      return new Promise(resolve => pdfMake.createPdf(docDefinition).getBlob(resolve));
    }
  } catch (err) {
    console.error('[AgreementPDF] Error:', err);
    alert('PDF Generation failed: ' + err.message);
  }
};
