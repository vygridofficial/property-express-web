import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../assets/logo.png';

// Initialize fonts correctly
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else {
  pdfMake.vfs = pdfFonts;
}

const getAssetBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
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

/**
 * Advanced LaTeX Interpreter for pdfmake.
 * Fixes: Spacing, Tabular alignment, and signature layout.
 */
export const generateAgreementPDF = async (submissionData, adminSignatureData = null, downloadDirectly = true, sellerSignatureOverride = null) => {
  console.log('[AgreementPDF] --- GENERATING REFINED LAYOUT ---');
  
  try {
    const docSnap = await getDoc(doc(db, 'admin_settings', 'agreement_template'));
    if (!docSnap.exists()) throw new Error('Active template not found.');
    const data = docSnap.data();
    let tex = data.templateTex || '';
    const mappings = data.mappings || {};

    const signatures = {
      seller: sellerSignatureOverride || submissionData.sellerSignature || submissionData.signature,
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
