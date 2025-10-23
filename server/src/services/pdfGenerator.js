import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateRentAgreement = async (leaseData) => {
  const doc = new PDFDocument({ margin: 50 });
  
  // Create agreements directory if it doesn't exist
  const agreementsDir = path.join(__dirname, '../../agreements');
  if (!fs.existsSync(agreementsDir)) {
    fs.mkdirSync(agreementsDir, { recursive: true });
  }
  
  const fileName = `rent-agreement-${leaseData.agreementNumber}.pdf`;
  const filePath = path.join(agreementsDir, fileName);
  
  // Create a write stream for the PDF
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  
  // Header
  doc.fontSize(20).font('Helvetica-Bold')
     .text('RENT AGREEMENT', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica')
     .text(`Agreement Number: ${leaseData.agreementNumber}`, { align: 'center' });
  
  doc.moveDown(1);
  
  // Property Information
  doc.fontSize(16).font('Helvetica-Bold')
     .text('PROPERTY INFORMATION', { underline: true });
  
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica')
     .text(`Property Name: ${leaseData.property.title}`)
     .text(`Address: ${leaseData.property.address}`)
     .text(`Unit: ${leaseData.unit.name}`)
     .text(`Unit Type: ${leaseData.unit.type}`)
     .text(`Size: ${leaseData.unit.sizeSqFt} sq ft`)
     .text(`Floor: ${leaseData.unit.floor || 'N/A'}`);
  
  if (leaseData.unit.bedrooms > 0) {
    doc.text(`Bedrooms: ${leaseData.unit.bedrooms}`);
  }
  if (leaseData.unit.bathrooms > 0) {
    doc.text(`Bathrooms: ${leaseData.unit.bathrooms}`);
  }
  if (leaseData.unit.parking > 0) {
    doc.text(`Parking Spaces: ${leaseData.unit.parking}`);
  }
  
  doc.moveDown(1);
  
  // Tenant Information
  doc.fontSize(16).font('Helvetica-Bold')
     .text('TENANT INFORMATION', { underline: true });
  
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica')
     .text(`Name: ${leaseData.tenant.name}`)
     .text(`Email: ${leaseData.tenant.email}`)
     .text(`Phone: ${leaseData.tenant.phone || 'N/A'}`);
  
  doc.moveDown(1);
  
  // Owner Information
  doc.fontSize(16).font('Helvetica-Bold')
     .text('OWNER INFORMATION', { underline: true });
  
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica')
     .text(`Name: ${leaseData.owner.name}`)
     .text(`Email: ${leaseData.owner.email}`)
     .text(`Phone: ${leaseData.owner.phone || 'N/A'}`);
  
  doc.moveDown(1);
  
  // Lease Terms
  doc.fontSize(16).font('Helvetica-Bold')
     .text('LEASE TERMS', { underline: true });
  
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica')
     .text(`Lease Start Date: ${new Date(leaseData.leaseStartDate).toLocaleDateString()}`)
     .text(`Lease End Date: ${new Date(leaseData.leaseEndDate).toLocaleDateString()}`)
     .text(`Monthly Rent: $${leaseData.monthlyRent}`)
     .text(`Security Deposit: $${leaseData.securityDeposit || 0}`)
     .text(`Late Fee: $${leaseData.terms?.lateFeeAmount || 50} (after ${leaseData.terms?.lateFeeAfterDays || 5} days)`)
     .text(`Notice Period: ${leaseData.terms?.noticePeriodDays || 30} days`)
     .text(`Pet Allowed: ${leaseData.terms?.petAllowed ? 'Yes' : 'No'}`)
     .text(`Smoking Allowed: ${leaseData.terms?.smokingAllowed ? 'Yes' : 'No'}`);
  
  doc.moveDown(1);
  
  // Terms and Conditions
  doc.fontSize(16).font('Helvetica-Bold')
     .text('TERMS AND CONDITIONS', { underline: true });
  
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica')
     .text('1. The tenant agrees to pay rent on time and maintain the property in good condition.')
     .text('2. The tenant shall not make any alterations to the property without written consent.')
     .text('3. The tenant is responsible for utilities unless otherwise specified.')
     .text('4. The tenant must give proper notice before vacating the property.')
     .text('5. The landlord reserves the right to inspect the property with reasonable notice.')
     .text('6. Any disputes shall be resolved through proper legal channels.')
     .text('7. This agreement is binding and enforceable under local laws.');
  
  doc.moveDown(1);
  
  // Signatures
  doc.fontSize(16).font('Helvetica-Bold')
     .text('SIGNATURES', { underline: true });
  
  doc.moveDown(0.5);
  
  // Owner signature
  doc.fontSize(12).font('Helvetica')
     .text('Landlord/Owner Signature:')
     .moveDown(0.3)
     .text('_________________________')
     .text(`Name: ${leaseData.owner.name}`)
     .text(`Date: ${new Date().toLocaleDateString()}`);
  
  doc.moveDown(1);
  
  // Tenant signature
  doc.fontSize(12).font('Helvetica')
     .text('Tenant Signature:')
     .moveDown(0.3)
     .text('_________________________')
     .text(`Name: ${leaseData.tenant.name}`)
     .text(`Date: ${new Date().toLocaleDateString()}`);
  
  // Footer
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica')
     .text('This agreement was generated automatically by Smart Property Manager', 
           { align: 'center' });
  
  // Finalize the PDF
  doc.end();
  
  // Return a promise that resolves when the PDF is fully written
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log('✅ PDF written successfully:', filePath);
      resolve({
        filePath,
        fileName,
        relativePath: `agreements/${fileName}`
      });
    });
    
    writeStream.on('error', (error) => {
      console.error('❌ PDF write error:', error);
      reject(error);
    });
    
    doc.on('error', (error) => {
      console.error('❌ PDF generation error:', error);
      reject(error);
    });
  });
};
