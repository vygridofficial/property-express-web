import mammoth from 'mammoth';

/**
 * Merges seller submission data into a DOCX template using a mapping configuration.
 * @param {ArrayBuffer} templateArrayBuffer - The raw docx file data.
 * @param {Object} submissionData - The data from the seller's portal listing.
 * @param {Object} mapping - { templatePlaceholder: submissionFieldId }
 * @param {Object} signatures - { seller: base64, admin: base64 }
 * @returns {Promise<string>} - The populated HTML string.
 */
export const mergeTemplateData = async (templateArrayBuffer, submissionData, mapping, signatures = {}) => {
  try {
    // 1. Convert DOCX to HTML for processing
    // We use mammoth to get the structure. 
    // Mammoth generates semantic HTML which is easy to string-replace.
    const result = await mammoth.convertToHtml({ arrayBuffer: templateArrayBuffer });
    let html = result.value;

    // 2. Perform replacements based on mapping
    for (const [placeholder, fieldId] of Object.entries(mapping)) {
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      
      let replacement = '';
      
      if (fieldId === 'seller_signature' && signatures.seller) {
        // Handle seller signature as an image
        const sig = signatures.seller;
        const sigSrc = typeof sig === 'object' && sig.type === 'text' 
          ? `[Signed Digitally: ${sig.value}]` 
          : `<img src="${sig}" style="height: 60px; object-fit: contain;" />`;
        replacement = sigSrc;
      } else if (fieldId === 'admin_signature' && signatures.admin) {
        // Handle admin signature as an image
        const sig = signatures.admin;
        const sigSrc = typeof sig === 'object' && sig.type === 'text' 
          ? `[Counter-signed: ${sig.value}]` 
          : `<img src="${sig}" style="height: 60px; object-fit: contain;" />`;
        replacement = sigSrc;
      } else if (fieldId === 'current_date') {
        replacement = new Date().toLocaleDateString();
      } else {
        // Standard data field
        replacement = submissionData[fieldId] || '';
      }

      html = html.replace(regex, replacement);
    }

    // 3. Wrap in a container for styling
    const styledHtml = `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.6; background: #fff;">
        <div style="margin-bottom: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">PROPERTY EXPRESS AGREEMENT</h1>
        </div>
        ${html}
      </div>
    `;

    return styledHtml;
  } catch (err) {
    console.error("Template merging failed:", err);
    throw new Error("Unable to generate agreement from template.");
  }
};

/**
 * Escapes characters with special meaning in regular expressions.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

/**
 * Merges data directly into a pre-extracted HTML string (stored in Firestore as templateHtml).
 * This is the preferred path — no DOCX binary, no network fetch, no CORS issues.
 */
export const mergeHtmlTemplate = async (htmlString, submissionData, mapping, signatures = {}) => {
  try {
    let html = htmlString;

    for (const [placeholder, fieldId] of Object.entries(mapping || {})) {
      // Create a regex that strips invisible zero-width spaces/soft hyphens and exactly matches the placeholder
      // Also handles variable internal spacing
      const cleanPlaceholder = placeholder.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(cleanPlaceholder)}\\s*\\}\\}`, 'g');
      let replacement = '';

      if (fieldId === 'seller_signature' && signatures.seller) {
        const sig = signatures.seller;
        replacement = typeof sig === 'object' && sig.type === 'text'
          ? `<span style="font-family: 'Dancing Script', cursive; font-size: 1.5rem;">[Signed: ${sig.value}]</span>`
          : `<img src="${sig}" style="height: 60px; object-fit: contain; vertical-align: middle;" crossorigin="anonymous" />`;
      } else if (fieldId === 'admin_signature' && signatures.admin) {
        const sig = signatures.admin;
        replacement = typeof sig === 'object' && sig.type === 'text'
          ? `<span style="font-family: 'Dancing Script', cursive; font-size: 1.5rem;">[Counter-signed: ${sig.value}]</span>`
          : `<img src="${sig}" style="height: 60px; object-fit: contain; vertical-align: middle;" crossorigin="anonymous" />`;
      } else if (fieldId === 'current_date') {
        replacement = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      } else {
        replacement = submissionData[fieldId] !== undefined ? String(submissionData[fieldId]) : (placeholder || '');
      }

      html = html.replace(regex, replacement);
    }

    // 4. Wrap in a standard A4 container for preview/print
    return `
      <div style="
        font-family: 'Times New Roman', serif; 
        padding: 40px 60px; 
        color: #000; 
        line-height: 1.5; 
        background: #fff;
        font-size: 14px;
        text-align: justify;
        width: 800px;
        box-sizing: border-box;
      ">
        ${html}
      </div>
    `;
  } catch (err) {
    console.error("HTML template merging failed:", err);
    throw new Error("Unable to generate agreement from template.");
  }
};
