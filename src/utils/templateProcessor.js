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

// Default mappings - used when no mappings are provided in Firestore
const DEFAULT_MAPPINGS = {
  '{{Govt.ID_number}}': 'id',
  '{{Govt._ID_number}}': 'id',
  '{{Full_legal_name}}': 'sellerName',
  '{{Seller_email}}': 'sellerEmail',
  '{{Seller_phone}}': 'sellerPhone',
  '{{Property_title}}': 'propertyTitle',
  '{{Property_type}}': 'propertyType',
  '{{Property_address}}': 'address',
  '{{Property_location}}': 'location',
  '{{Property_area}}': 'area',
  '{{Listed_sale_price}}': 'price',
  '{{Seller_signature_(image)}}': 'seller_signature',
  '{{Admin_signature_(image)}}': 'admin_signature',
  '{{Approval_date_(auto)}}': 'current_date',
  '{{Approval_date(auto)}}': 'current_date'
};

export const mergeHtmlTemplate = async (htmlString, submissionData, mapping, signatures = {}) => {
  // Use provided mappings or fall back to defaults
  const effectiveMapping = (mapping && Object.keys(mapping).length > 0) ? mapping : DEFAULT_MAPPINGS;
  
  console.log('[TemplateProcessor] Using mappings:', effectiveMapping);
  
  try {
    let html = htmlString;

    for (const [placeholder, fieldId] of Object.entries(effectiveMapping)) {
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
      } else if (fieldId === 'agreement_id') {
        replacement = submissionData.id || 'N/A';
      } else {
        replacement = submissionData[fieldId] !== undefined ? String(submissionData[fieldId]) : (placeholder || '');
      }

      // Debugging: Log the replacement process
      console.log(`[TemplateProcessor] Replacing {{${placeholder}}} (field: ${fieldId}) with: ${String(replacement).substring(0, 50)}...`);

      html = html.replace(regex, replacement);
    }

    // 4. Wrap in a standard container - styling is managed by the caller (Preview or Export)
    const styledContainer = `
      <div class="agreement-document" style="
        font-family: 'Times New Roman', serif; 
        color: #000; 
        line-height: 1.5; 
        background: #fff;
        font-size: 11pt;
        width: 100%;
        box-sizing: border-box;
        margin: 0;
      ">
        <style>
          .agreement-document { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt;
            line-height: 1.5;
          }
          .agreement-document p { margin-bottom: 0.8em; text-align: justify; }
          .agreement-document h1, .agreement-document h2, .agreement-document h3 { 
            text-align: center; 
            text-transform: uppercase; 
            margin: 1em 0 0.5em;
            font-size: 14pt;
          }
          .agreement-document strong { color: #000; font-weight: 700; }
          .agreement-document table { width: 100%; border-collapse: collapse; margin-bottom: 1em; font-size: 10pt; }
          .agreement-document td { padding: 4px; vertical-align: top; border: 1px solid #ccc; }
          .agreement-document img { display: inline-block; max-width: 100%; height: auto; }
          .agreement-document ul, .agreement-document ol { margin-bottom: 0.8em; padding-left: 1.5em; }
          .agreement-document li { margin-bottom: 0.3em; }
        </style>
        ${html}
      </div>
    `;
    return styledContainer;
  } catch (err) {
    console.error("HTML template merging failed:", err);
    throw new Error("Unable to generate agreement from template.");
  }
};
