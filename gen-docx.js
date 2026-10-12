const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

async function txtToDocx(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.split('\n');
  
  const paragraphs = lines.map(line => {
    // Detect slide headers and make them bold
    if (line.startsWith('SLIDE ') || line.startsWith('Generate a PowerPoint')) {
      return new Paragraph({
        children: [new TextRun({ text: line, bold: true, font: 'Calibri', size: 22 })],
        spacing: { after: 120 },
      });
    }
    // Section markers (LEFT COLUMN, RIGHT COLUMN, etc)
    if (line.match(/^(LEFT COLUMN|RIGHT COLUMN|LEFT \(wide\)|RIGHT \(narrow\)|TOP-LEFT|TOP-RIGHT|BOTTOM-LEFT|BOTTOM-RIGHT)/)) {
      return new Paragraph({
        children: [new TextRun({ text: line, bold: true, font: 'Calibri', size: 20 })],
        spacing: { after: 80 },
      });
    }
    // Key-value lines (Label: Value)
    if (line.match(/^(Authoring Company|Level of Maturity|Use Case Source|Process|Product Category|Industry|Line of Business|Focus Topics|Customer Segment|Customer Type|Buyer Persona|Customer Profile|Deployment|Competitive|Support Mode|Implementation|Prerequisites|Technology|Industry Configurability|Mission Effort|Community Page):/)) {
      const colonIdx = line.indexOf(':');
      return new Paragraph({
        children: [
          new TextRun({ text: line.substring(0, colonIdx + 1), bold: true, font: 'Calibri', size: 20 }),
          new TextRun({ text: line.substring(colonIdx + 1), font: 'Calibri', size: 20 }),
        ],
        spacing: { after: 60 },
      });
    }
    // Empty lines
    if (line.trim() === '') {
      return new Paragraph({ children: [], spacing: { after: 120 } });
    }
    // Regular text
    return new Paragraph({
      children: [new TextRun({ text: line, font: 'Calibri', size: 20 })],
      spacing: { after: 60 },
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log('Created: ' + outputPath);
}

async function main() {
  await txtToDocx(
    'prompts/generation-prompt-STEEL.txt',
    'prompts/generation-prompt-STEEL.docx'
  );
  await txtToDocx(
    'prompts/generation-prompt-MILL-PRODUCTS.txt',
    'prompts/generation-prompt-MILL-PRODUCTS.docx'
  );
  console.log('Both .docx files generated successfully.');
}

main().catch(console.error);