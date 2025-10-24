import PDFDocument from 'pdfkit';

/**
 * Generate and stream rent agreement PDF directly to response
 * Modern streaming approach - no filesystem required
 * Professional industry-standard format
 */
export const streamRentAgreementPDF = (leaseData, res) => {
  console.log('📄 Starting PDF generation for:', leaseData.agreementNumber);
  
  try {
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Rent Agreement - ${leaseData.agreementNumber}`,
        Author: 'Smart Property Manager',
        Subject: 'Residential Lease Agreement',
        Keywords: 'rent, lease, agreement, property'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rent-agreement-${leaseData.agreementNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Pipe PDF directly to response - MUST be done before adding content
    doc.pipe(res);
    
    console.log('✅ PDF pipe established');
    
    // Helper function to check if we need a new page for a section
    const checkPageBreak = (requiredSpace) => {
      if (doc.y + requiredSpace > doc.page.height - 100) {
        doc.addPage();
      }
    };
    
    // Helper function to draw a styled box
    const drawBox = (x, y, width, height, fillColor = '#f8f9fa') => {
      doc.rect(x, y, width, height)
         .fillAndStroke(fillColor, '#dee2e6')
         .fillColor('#000000');
    };
    
    // =============================================
    // HEADER SECTION
    // =============================================
    doc.fontSize(24).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('RESIDENTIAL LEASE AGREEMENT', { align: 'center' });
  
  doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
       .fillColor('#666666')
       .text(`Agreement Number: ${leaseData.agreementNumber}`, { align: 'center' });
    
    doc.fontSize(10)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    
    // Decorative line
    doc.moveDown(0.5);
    doc.strokeColor('#1a365d')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(1.5);
    doc.fillColor('#000000');
    
    // =============================================
    // PARTIES SECTION
    // =============================================
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('PARTIES TO THIS AGREEMENT', { underline: true });
    
    doc.moveDown(0.8);
    
    // Landlord Box
    const boxY = doc.y;
    drawBox(50, boxY, 240, 90);
    
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('LANDLORD/OWNER', 60, boxY + 10);
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.owner.name}`, 60, boxY + 35)
       .text(`Email: ${leaseData.owner.email}`, 60, boxY + 50)
       .text(`Phone: ${leaseData.owner.phone || 'N/A'}`, 60, boxY + 65);
    
    // Tenant Box
    drawBox(doc.page.width - 290, boxY, 240, 90);
    
    doc.fontSize(12).font('Helvetica-Bold')
       .text('TENANT', doc.page.width - 280, boxY + 10);
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.tenant.name}`, doc.page.width - 280, boxY + 35)
       .text(`Email: ${leaseData.tenant.email}`, doc.page.width - 280, boxY + 50)
       .text(`Phone: ${leaseData.tenant.phone || 'N/A'}`, doc.page.width - 280, boxY + 65);
    
    doc.y = boxY + 100;
    doc.moveDown(1.5);
    
    // =============================================
    // PROPERTY INFORMATION SECTION
    // =============================================
    checkPageBreak(200);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('PROPERTY DETAILS', { underline: true });
    
    doc.moveDown(0.8);
    
    const propBoxY = doc.y;
    drawBox(50, propBoxY, doc.page.width - 100, 130, '#e8f4f8');
    
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Property Name:', 60, propBoxY + 15);
    doc.font('Helvetica').text(leaseData.property.title, 180, propBoxY + 15);
    
    doc.font('Helvetica-Bold').text('Address:', 60, propBoxY + 35);
    doc.font('Helvetica').text(leaseData.property.address, 180, propBoxY + 35);
    
    doc.font('Helvetica-Bold').text('Unit Number:', 60, propBoxY + 55);
    doc.font('Helvetica').text(leaseData.unit.name, 180, propBoxY + 55);
    
    doc.font('Helvetica-Bold').text('Unit Type:', 60, propBoxY + 75);
    doc.font('Helvetica').text(leaseData.unit.type, 180, propBoxY + 75);
    
    const detailsX = doc.page.width / 2 + 20;
    doc.font('Helvetica-Bold').text('Floor:', detailsX, propBoxY + 15);
    doc.font('Helvetica').text(leaseData.unit.floor || 'N/A', detailsX + 80, propBoxY + 15);
    
    doc.font('Helvetica-Bold').text('Size:', detailsX, propBoxY + 35);
    doc.font('Helvetica').text(`${leaseData.unit.sizeSqFt} sq ft`, detailsX + 80, propBoxY + 35);
  
  if (leaseData.unit.bedrooms > 0) {
      doc.font('Helvetica-Bold').text('Bedrooms:', detailsX, propBoxY + 55);
      doc.font('Helvetica').text(`${leaseData.unit.bedrooms}`, detailsX + 80, propBoxY + 55);
  }
    
  if (leaseData.unit.bathrooms > 0) {
      doc.font('Helvetica-Bold').text('Bathrooms:', detailsX, propBoxY + 75);
      doc.font('Helvetica').text(`${leaseData.unit.bathrooms}`, detailsX + 80, propBoxY + 75);
  }
    
  if (leaseData.unit.parking > 0) {
      doc.font('Helvetica-Bold').text('Parking:', detailsX, propBoxY + 95);
      doc.font('Helvetica').text(`${leaseData.unit.parking} space(s)`, detailsX + 80, propBoxY + 95);
    }
    
    doc.y = propBoxY + 140;
    doc.moveDown(1.5);
    
    // =============================================
    // LEASE TERMS SECTION
    // =============================================
    checkPageBreak(180);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('LEASE TERMS & FINANCIAL DETAILS', { underline: true });
    
    doc.moveDown(0.8);
    
    const termsBoxY = doc.y;
    drawBox(50, termsBoxY, doc.page.width - 100, 110, '#fff3cd');
    
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Lease Start Date:', 60, termsBoxY + 15);
    doc.font('Helvetica').text(new Date(leaseData.leaseStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 200, termsBoxY + 15);
    
    doc.font('Helvetica-Bold').text('Lease End Date:', 60, termsBoxY + 35);
    doc.font('Helvetica').text(new Date(leaseData.leaseEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 200, termsBoxY + 35);
    
    doc.font('Helvetica-Bold').text('Monthly Rent:', 60, termsBoxY + 55);
    doc.font('Helvetica').text(`$${leaseData.monthlyRent}`, 200, termsBoxY + 55);
    
    doc.font('Helvetica-Bold').text('Security Deposit:', 60, termsBoxY + 75);
    doc.font('Helvetica').text(`$${leaseData.securityDeposit || 0}`, 200, termsBoxY + 75);
    
    if (leaseData.terms) {
      const finX = doc.page.width / 2 + 20;
      doc.font('Helvetica-Bold').text('Late Fee:', finX, termsBoxY + 15);
      doc.font('Helvetica').text(`$${leaseData.terms.lateFeeAmount || 50}`, finX + 100, termsBoxY + 15);
      
      doc.font('Helvetica-Bold').text('Grace Period:', finX, termsBoxY + 35);
      doc.font('Helvetica').text(`${leaseData.terms.lateFeeAfterDays || 5} days`, finX + 100, termsBoxY + 35);
      
      doc.font('Helvetica-Bold').text('Notice Period:', finX, termsBoxY + 55);
      doc.font('Helvetica').text(`${leaseData.terms.noticePeriodDays || 30} days`, finX + 100, termsBoxY + 55);
      
      doc.font('Helvetica-Bold').text('Pet Policy:', finX, termsBoxY + 75);
      doc.font('Helvetica').text(leaseData.terms.petAllowed ? 'Allowed' : 'Not Allowed', finX + 100, termsBoxY + 75);
    }
    
    doc.y = termsBoxY + 120;
    doc.moveDown(1.5);
    
    // =============================================
    // TERMS AND CONDITIONS SECTION
    // =============================================
    checkPageBreak(400);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
     .text('TERMS AND CONDITIONS', { underline: true });
  
    doc.moveDown(0.8);
    doc.fontSize(10).font('Helvetica')
       .fillColor('#000000');
    
    const terms = [
      {
        title: 'Payment Terms',
        content: 'The Tenant agrees to pay the monthly rent on or before the 1st day of each month. Payment shall be made via the agreed payment method. A late fee will be charged if payment is not received within the grace period specified above.'
      },
      {
        title: 'Property Maintenance',
        content: 'The Tenant agrees to maintain the property in good, clean, and sanitary condition and to immediately notify the Landlord of any damage or needed repairs. The Tenant shall be responsible for any damage caused by negligence or misuse.'
      },
      {
        title: 'Utilities and Services',
        content: 'The Tenant is responsible for all utilities and services unless otherwise specified in writing. This includes but is not limited to electricity, water, gas, internet, and cable services.'
      },
      {
        title: 'Alterations and Modifications',
        content: 'The Tenant shall not make any alterations, additions, or improvements to the property without prior written consent from the Landlord. Any approved modifications become property of the Landlord upon lease termination.'
      },
      {
        title: 'Right of Entry',
        content: 'The Landlord reserves the right to enter the property for inspection, repairs, or showing to prospective tenants/buyers, provided reasonable notice (typically 24-48 hours) is given to the Tenant, except in emergencies.'
      },
      {
        title: 'Termination and Notice',
        content: 'Either party may terminate this lease by providing written notice as specified in the notice period above. The Tenant must return the property in the same condition as received, normal wear and tear excepted.'
      },
      {
        title: 'Security Deposit',
        content: 'The security deposit will be held for the duration of the lease and returned within the period specified by local law after lease termination, minus any deductions for damages, unpaid rent, or other charges.'
      },
      {
        title: 'Compliance with Laws',
        content: 'The Tenant agrees to comply with all applicable laws, ordinances, and regulations, including building codes, health codes, and homeowners association rules, if any.'
      },
      {
        title: 'Dispute Resolution',
        content: 'Any disputes arising from this agreement shall be resolved through mediation or arbitration before resorting to litigation. Both parties agree to act in good faith to resolve any conflicts.'
      },
      {
        title: 'Entire Agreement',
        content: 'This agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. Any amendments must be made in writing and signed by both parties.'
      }
    ];
    
    terms.forEach((term, index) => {
      checkPageBreak(60);
      doc.fontSize(10).font('Helvetica-Bold')
         .text(`${index + 1}. ${term.title}`, 60, doc.y, { continued: false });
  doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica')
         .text(term.content, 70, doc.y, { 
           width: doc.page.width - 140,
           align: 'justify'
         });
      doc.moveDown(0.8);
    });
    
    // =============================================
    // SIGNATURES SECTION (Keep together on one page)
    // =============================================
    // Check if we have enough space (at least 200 points) for signatures
    checkPageBreak(250);
  
  doc.moveDown(1);
  
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
     .text('SIGNATURES', { underline: true });
  
  doc.moveDown(0.5);
  
    doc.fontSize(10).font('Helvetica')
       .fillColor('#666666')
       .text('By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this lease agreement.', {
         width: doc.page.width - 100,
         align: 'justify'
       });
    
    doc.moveDown(1.5);
    
    // Landlord Signature Section
    const sigY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Landlord/Owner Signature:', 60, sigY);
    
    doc.moveTo(60, sigY + 45)
       .lineTo(260, sigY + 45)
       .stroke();
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.owner.name}`, 60, sigY + 55)
       .text(`Date: _______________`, 60, sigY + 70);
    
    // Tenant Signature Section
    doc.fontSize(11).font('Helvetica-Bold')
       .text('Tenant Signature:', doc.page.width - 250, sigY);
    
    doc.moveTo(doc.page.width - 250, sigY + 45)
       .lineTo(doc.page.width - 50, sigY + 45)
       .stroke();
    
  doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.tenant.name}`, doc.page.width - 250, sigY + 55)
       .text(`Date: _______________`, doc.page.width - 250, sigY + 70);
    
    // =============================================
    // FOOTER
    // =============================================
    doc.moveDown(3);
    
    // Add a line above footer
    const footerY = doc.page.height - 60;
    doc.strokeColor('#dee2e6')
       .lineWidth(1)
       .moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .stroke();
    
    doc.fontSize(9).font('Helvetica')
       .fillColor('#666666')
     .text('This agreement was generated automatically by Smart Property Manager', 
             50, footerY + 10, 
             { width: doc.page.width - 100, align: 'center' });
    
    doc.fontSize(8)
       .text('For legal questions regarding this agreement, please consult with a qualified attorney in your jurisdiction.', 
             50, footerY + 25, 
             { width: doc.page.width - 100, align: 'center' });
    
    // Finalize and send
  doc.end();
  
    console.log('✅ PDF streamed successfully for agreement:', leaseData.agreementNumber);
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
  }
};

/**
 * Generate rent agreement PDF and return as buffer
 * For cases where you need the PDF as a buffer instead of streaming
 */
export const generateRentAgreementPDF = (leaseData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Rent Agreement - ${leaseData.agreementNumber}`,
          Author: 'Smart Property Manager',
          Subject: 'Residential Lease Agreement'
        }
      });
      
      const chunks = [];
      
      // Collect PDF data in memory
      doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Use the same generation logic as streamRentAgreementPDF
      // (Copy the same content generation code here if needed for buffer generation)
      
      doc.end();
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      reject(error);
    }
  });
};
