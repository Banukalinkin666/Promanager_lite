import PDFDocument from 'pdfkit';

/**
 * Generate and stream rent agreement PDF directly to response
 * Modern streaming approach - no filesystem required
 */
export const streamRentAgreementPDF = (leaseData, res) => {
  console.log('📄 Starting PDF generation for:', leaseData.agreementNumber);
  
  try {
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rent-agreement-${leaseData.agreementNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Pipe PDF directly to response - MUST be done before adding content
    doc.pipe(res);
    
    console.log('✅ PDF pipe established');
    
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
       .text(`Security Deposit: $${leaseData.securityDeposit || 0}`);
    
    if (leaseData.terms) {
      doc.text(`Late Fee: $${leaseData.terms.lateFeeAmount || 50} (after ${leaseData.terms.lateFeeAfterDays || 5} days)`)
         .text(`Notice Period: ${leaseData.terms.noticePeriodDays || 30} days`)
         .text(`Pet Allowed: ${leaseData.terms.petAllowed ? 'Yes' : 'No'}`)
         .text(`Smoking Allowed: ${leaseData.terms.smokingAllowed ? 'Yes' : 'No'}`);
    }
    
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
    
    // Finalize and send
    doc.end();
    
    console.log('✅ PDF streamed successfully for agreement:', leaseData.agreementNumber);
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw error;
  }
};

/**
 * Generate rent agreement PDF and return as buffer
 * For cases where you need the PDF as a buffer instead of streaming
 */
export const generateRentAgreementPDF = (leaseData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      // Collect PDF data in memory
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
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
         .text(`Security Deposit: $${leaseData.securityDeposit || 0}`);
      
      if (leaseData.terms) {
        doc.text(`Late Fee: $${leaseData.terms.lateFeeAmount || 50} (after ${leaseData.terms.lateFeeAfterDays || 5} days)`)
           .text(`Notice Period: ${leaseData.terms.noticePeriodDays || 30} days`)
           .text(`Pet Allowed: ${leaseData.terms.petAllowed ? 'Yes' : 'No'}`)
           .text(`Smoking Allowed: ${leaseData.terms.smokingAllowed ? 'Yes' : 'No'}`);
      }
      
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
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      reject(error);
    }
  });
};
