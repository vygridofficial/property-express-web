import fs from 'fs';
const content = fs.readFileSync('src/pages/CategoryHero.jsx', 'utf8');
const match = content.match(/const CATEGORY_IMAGES = ({[\s\S]*?});\n\n\/\/ Floating positions/);
if (match) {
  let imagesObj = eval('(' + match[1] + ')');
  let output = 'export const CATEGORY_IMAGES = {\n';
  const extraImages = ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'];
  let count = 100;
  for (const cat in imagesObj) {
    output += '  ' + cat + ': [\n';
    for (const prop of imagesObj[cat]) {
      const priceNum = Number(String(prop.price).replace(/[^0-9.-]+/g,""));
      const sqftNum = typeof prop.sqft === 'string' ? Number(prop.sqft.replace(/[^0-9.-]+/g,"")) : prop.sqft;
      
      output += '    {\n';
      output += '      id: "cat-' + count + '",\n';
      output += '      title: "' + prop.title + '",\n';
      output += '      location: "' + prop.location + '",\n';
      output += '      price: ' + priceNum + ',\n';
      output += '      status: "' + prop.status + '",\n';
      output += '      beds: ' + prop.beds + ',\n';
      output += '      baths: ' + prop.baths + ',\n';
      output += '      sqft: ' + sqftNum + ',\n';
      output += '      description: "Enjoy this magnificent property offering modern amenities, spacious layout, and a prime location perfect for your lifestyle needs. It perfectly integrates sleek finishes with practical living spaces.",\n';
      output += '      agentId: "agent-1",\n';
      output += '      images: [\n';
      output += '        "' + prop.src + '",\n';
      output += '        "' + extraImages[0] + '",\n';
      output += '        "' + extraImages[1] + '"\n';
      output += '      ]\n';
      output += '    },\n';
      count++;
    }
    output += '  ],\n';
  }
  output += '};\n';
  fs.writeFileSync('src/data/categoryImages.js', output);
  console.log('Done');
}
