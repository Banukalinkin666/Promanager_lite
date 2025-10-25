import PDFDocument from 'pdfkit';

/**
 * Generate and stream rent agreement PDF directly to response
 * Professional industry-standard format with proper layout
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
    
    // Pipe PDF directly to response
    doc.pipe(res);
    
    console.log('✅ PDF pipe established');
    
    // Constants for layout
    const pageWidth = doc.page.width;
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    // Helper function to check if we need a new page
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
       .text('RESIDENTIAL LEASE AGREEMENT', marginLeft, doc.y, { 
         width: contentWidth,
         align: 'center' 
       });
  
  doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
       .fillColor('#666666')
       .text(`Agreement Number: ${leaseData.agreementNumber}`, { 
         width: contentWidth,
         align: 'center' 
       });
    
    doc.fontSize(10)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { 
         width: contentWidth,
         align: 'center' 
       });
    
    // Decorative line
    doc.moveDown(0.5);
    doc.strokeColor('#1a365d')
       .lineWidth(2)
       .moveTo(marginLeft, doc.y)
       .lineTo(pageWidth - marginRight, doc.y)
       .stroke();
    
    doc.moveDown(1.5);
    doc.fillColor('#000000');
    
    // =============================================
    // PARTIES SECTION
    // =============================================
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('PARTIES TO THIS AGREEMENT', marginLeft, doc.y, { 
         underline: true,
         align: 'left'
       });
    
    doc.moveDown(0.8);
    
    // Landlord and Tenant boxes side by side
    const boxY = doc.y;
    const boxWidth = (contentWidth - 20) / 2;
    
    // Landlord Box
    drawBox(marginLeft, boxY, boxWidth, 90);
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('LANDLORD/OWNER', marginLeft + 10, boxY + 10, { width: boxWidth - 20 });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.owner.name}`, marginLeft + 10, boxY + 30, { width: boxWidth - 20 })
       .text(`Email: ${leaseData.owner.email}`, marginLeft + 10, boxY + 45, { width: boxWidth - 20 })
       .text(`Phone: ${leaseData.owner.phone || 'N/A'}`, marginLeft + 10, boxY + 60, { width: boxWidth - 20 });
    
    // Tenant Box
    const tenantBoxX = marginLeft + boxWidth + 20;
    drawBox(tenantBoxX, boxY, boxWidth, 90);
    doc.fontSize(12).font('Helvetica-Bold')
       .text('TENANT', tenantBoxX + 10, boxY + 10, { width: boxWidth - 20 });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.tenant.name}`, tenantBoxX + 10, boxY + 30, { width: boxWidth - 20 })
       .text(`Email: ${leaseData.tenant.email}`, tenantBoxX + 10, boxY + 45, { width: boxWidth - 20 })
       .text(`Phone: ${leaseData.tenant.phone || 'N/A'}`, tenantBoxX + 10, boxY + 60, { width: boxWidth - 20 });
    
    doc.y = boxY + 100;
    doc.moveDown(1.5);
    
    // =============================================
    // PROPERTY INFORMATION SECTION
    // =============================================
    checkPageBreak(220);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('PROPERTY DETAILS', marginLeft, doc.y, { 
         underline: true,
         align: 'left'
       });
    
    doc.moveDown(0.8);
    
    const propBoxY = doc.y;
    const propBoxHeight = 160;
    drawBox(marginLeft, propBoxY, contentWidth, propBoxHeight, '#e8f4f8');
    
    // Left column
    let currentY = propBoxY + 15;
    const labelWidth = 110;
    const valueX = marginLeft + labelWidth + 10;
    const leftColWidth = 200; // Fixed width to prevent overlap
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Property Name:', marginLeft + 10, currentY, { width: labelWidth });
    doc.font('Helvetica')
       .text(leaseData.property.title, valueX, currentY, { width: leftColWidth });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Address:', marginLeft + 10, currentY, { width: labelWidth });
    doc.font('Helvetica')
       .text(leaseData.property.address, valueX, currentY, { width: leftColWidth });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Unit Number:', marginLeft + 10, currentY, { width: labelWidth });
    doc.font('Helvetica')
       .text(leaseData.unit.name, valueX, currentY, { width: leftColWidth });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Unit Type:', marginLeft + 10, currentY, { width: labelWidth });
    doc.font('Helvetica')
       .text(leaseData.unit.type, valueX, currentY, { width: leftColWidth });
    
    // Right column - moved further right to avoid conflicts
    const rightColX = marginLeft + 340; // Fixed position, moved right
    const rightLabelWidth = 80;
    const rightValueX = rightColX + rightLabelWidth + 10;
    const rightColWidth = contentWidth - 340 - rightLabelWidth - 30;
    
    currentY = propBoxY + 15;
    doc.font('Helvetica-Bold')
       .text('Floor:', rightColX + 10, currentY, { width: rightLabelWidth });
    doc.font('Helvetica')
       .text(leaseData.unit.floor || 'N/A', rightValueX, currentY, { width: rightColWidth });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Size:', rightColX + 10, currentY, { width: rightLabelWidth });
    doc.font('Helvetica')
       .text(`${leaseData.unit.sizeSqFt} sq ft`, rightValueX, currentY, { width: rightColWidth });
  
  if (leaseData.unit.bedrooms > 0) {
      currentY += 20;
      doc.font('Helvetica-Bold')
         .text('Bedrooms:', rightColX + 10, currentY, { width: rightLabelWidth });
      doc.font('Helvetica')
         .text(`${leaseData.unit.bedrooms}`, rightValueX, currentY, { width: rightColWidth });
    }
    
  if (leaseData.unit.bathrooms > 0) {
      currentY += 20;
      doc.font('Helvetica-Bold')
         .text('Bathrooms:', rightColX + 10, currentY, { width: rightLabelWidth });
      doc.font('Helvetica')
         .text(`${leaseData.unit.bathrooms}`, rightValueX, currentY, { width: rightColWidth });
    }
    
  if (leaseData.unit.parking > 0) {
      currentY += 20;
      doc.font('Helvetica-Bold')
         .text('Parking:', rightColX + 10, currentY, { width: rightLabelWidth });
      doc.font('Helvetica')
         .text(`${leaseData.unit.parking} space(s)`, rightValueX, currentY, { width: rightColWidth });
    }
    
    doc.y = propBoxY + propBoxHeight + 10;
    doc.moveDown(1.5);
    
    // =============================================
    // LEASE TERMS SECTION
    // =============================================
    checkPageBreak(200);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('LEASE TERMS & FINANCIAL DETAILS', marginLeft, doc.y, { 
         underline: true,
         align: 'left'
       });
    
    doc.moveDown(0.8);
    
    const termsBoxY = doc.y;
    const termsBoxHeight = 80;
    drawBox(marginLeft, termsBoxY, contentWidth, termsBoxHeight, '#fff3cd');
    
    // Left column - Lease dates and rent
    currentY = termsBoxY + 15;
    const termsLabelWidth = 120;
    const termsValueX = marginLeft + termsLabelWidth + 10;
    const termsLeftColWidth = 200;
    
    // Define consistent positioning for all values - use fixed column approach
    const labelX = marginLeft + 10;
    const termsValueX = marginLeft + 140; // Fixed position for all values
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Lease Start Date:', labelX, currentY, { width: termsLabelWidth });
    doc.font('Helvetica')
       .text(new Date(leaseData.leaseStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), termsValueX, currentY, { width: 200 });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Lease End Date:', labelX, currentY, { width: termsLabelWidth });
    doc.font('Helvetica')
       .text(new Date(leaseData.leaseEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), termsValueX, currentY, { width: 200 });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Monthly Rent:', labelX, currentY, { width: termsLabelWidth });
    doc.font('Helvetica')
       .text(`$${leaseData.monthlyRent}`, termsValueX, currentY, { width: 200 });
    
    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Security Deposit:', labelX, currentY, { width: termsLabelWidth });
    doc.font('Helvetica')
       .text(`$${leaseData.securityDeposit || 0}`, termsValueX, currentY, { width: 200 });
    
    doc.y = termsBoxY + termsBoxHeight + 10;
    doc.moveDown(1.5);
    
    // =============================================
    // TERMS AND CONDITIONS SECTION
    // =============================================
    checkPageBreak(400);
    
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('TERMS AND CONDITIONS', marginLeft, doc.y, { 
         underline: true,
         align: 'left'
       });
    
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
         .text(`${index + 1}. ${term.title}`, marginLeft, doc.y, { 
           width: contentWidth,
           continued: false 
         });
  doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica')
         .text(term.content, marginLeft + 10, doc.y, { 
           width: contentWidth - 10,
           align: 'justify'
         });
      doc.moveDown(0.8);
    });
    
    // =============================================
    // SIGNATURES SECTION
    // =============================================
    checkPageBreak(250);
  
  doc.moveDown(1);
  
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('SIGNATURES', marginLeft, doc.y, { 
         underline: true,
         align: 'left'
       });
  
  doc.moveDown(0.5);
  
    doc.fontSize(10).font('Helvetica')
       .fillColor('#666666')
       .text('By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this lease agreement.', marginLeft, doc.y, {
         width: contentWidth,
         align: 'justify'
       });
    
    doc.moveDown(1.5);
    
    // Signatures side by side
    const sigY = doc.y;
    const sigBoxWidth = (contentWidth - 20) / 2;
    
    // Landlord Signature
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Landlord/Owner Signature:', marginLeft, sigY, { width: sigBoxWidth });
    
    doc.moveTo(marginLeft, sigY + 45)
       .lineTo(marginLeft + sigBoxWidth - 10, sigY + 45)
       .stroke();
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.owner.name}`, marginLeft, sigY + 55, { width: sigBoxWidth })
       .text(`Date: _______________`, marginLeft, sigY + 70, { width: sigBoxWidth });
    
    // Tenant Signature
    const tenantSigX = marginLeft + sigBoxWidth + 20;
    doc.fontSize(11).font('Helvetica-Bold')
       .text('Tenant Signature:', tenantSigX, sigY, { width: sigBoxWidth });
    
    doc.moveTo(tenantSigX, sigY + 45)
       .lineTo(tenantSigX + sigBoxWidth - 10, sigY + 45)
       .stroke();
    
    doc.fontSize(10).font('Helvetica')
       .text(`Name: ${leaseData.tenant.name}`, tenantSigX, sigY + 55, { width: sigBoxWidth })
       .text(`Date: _______________`, tenantSigX, sigY + 70, { width: sigBoxWidth });
    
    // =============================================
    // FOOTER
    // =============================================
    doc.y = Math.max(doc.y, sigY + 100);
  doc.moveDown(2);
    
    const footerY = doc.page.height - 60;
    doc.strokeColor('#dee2e6')
       .lineWidth(1)
       .moveTo(marginLeft, footerY)
       .lineTo(pageWidth - marginRight, footerY)
       .stroke();
    
    doc.fontSize(9).font('Helvetica')
       .fillColor('#666666')
     .text('This agreement was generated automatically by Smart Property Manager', 
             marginLeft, footerY + 10, 
             { width: contentWidth, align: 'center' });
    
    doc.fontSize(8)
       .text('For legal questions regarding this agreement, please consult with a qualified attorney in your jurisdiction.', 
             marginLeft, footerY + 25, 
             { width: contentWidth, align: 'center' });
    
    // Finalize
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
      doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ PDF buffer generated, size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      doc.end();
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      reject(error);
    }
  });
};
