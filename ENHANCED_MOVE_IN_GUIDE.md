# 📋 Enhanced Move-In Modal - Complete Guide

## 🎯 Overview

The Enhanced Move-In Modal is a comprehensive, professional-grade interface for managing tenant move-ins with 6 structured sections, auto-fetching capabilities, real-time validation, file uploads, and draft support.

---

## ✨ Key Features

### 1. **6 Structured Sections**
Each section is collapsible/expandable with clear visual indicators:

1. 🏠 **Property Information** - Property and unit details
2. 👤 **Tenant Information** - Tenant contact and identification  
3. 📅 **Lease Details** - Lease period and terms
4. 💰 **Financial Details** - Rent and payment information
5. ⚡ **Utilities & Charges** - Meter readings and additional fees
6. 📎 **Documents** - File uploads for required documents

### 2. **Auto-Fetch & Auto-Fill**
- Property data automatically populated from selected property/unit
- Tenant data automatically fetched when tenant is selected
- Auto-calculated fields:
  - Lease Duration (from start/end dates)
  - Next Rent Due Date (based on rent type)
  - Property Code (from property ID)
  - Tenant Code (from tenant ID)

### 3. **Smart Validation**
- **Mandatory fields** marked with red asterisk (*)
- **Inline real-time validation** with error messages
- **Format validation** for:
  - Phone numbers
  - Email addresses
  - Dates (end date must be >= start date)
  - Rent amount (must be > 0)
- **Auto-badges** showing "auto-fetched" and "auto-calculated" fields

### 4. **File Upload System**
- **4 document types** supported:
  - Signed Lease Agreement (PDF, DOCX)
  - ID Proof (Images, PDF)
  - Deposit Receipt (Images, PDF)
  - Move-In Inspection Report (Images, PDF)
- **10MB file size limit** per file
- **Upload progress bar** with percentage
- **Preview** with filename and file size
- **Remove** capability for uploaded files

### 5. **Draft Support**
- **Save Draft** button to persist incomplete data
- Continue editing later without losing progress
- Draft status tracked separately from active leases

### 6. **Progress Tracking**
- Visual progress bar showing completion percentage
- Section completion tracking
- Clear indication of how many sections completed

### 7. **Professional PDF Generation**
- Automatic PDF generation upon move-in completion
- Success screen with lease details
- Download PDF button
- PDF opens in new tab for preview
- Auto-download option

---

## 🎨 UI/UX Highlights

### Single-Page Flow
- No pagination or page reloads
- Smooth scrolling between sections
- Expandable/collapsible sections for easy navigation

### Visual Design
- **Color-coded sections** for easy identification:
  - Blue: Property
  - Green: Tenant
  - Purple: Lease
  - Yellow: Financial
  - Orange: Utilities
  - Red: Documents
- **Clear progress indicator** at top
- **Responsive grid layout** (2 columns on desktop, 1 on mobile)
- **Dark mode support** throughout

### User Feedback
- Toast notifications for all actions
- Real-time error messages
- Upload progress indicators
- Loading states for async operations

---

## 📋 Field Details

### Section 1: Property Information

| Field | Type | Required | Auto-Fetched | Notes |
|-------|------|----------|--------------|-------|
| Property Name | Text | ✅ | ✅ | From property.title |
| Property Code | Text | ✅ | ✅ | First 8 chars of property ID |
| Unit Number | Text | ✅ | ✅ | From unit.name |
| Unit Name | Text | | ✅ | From unit.name |
| Property Type | Select | ✅ | ✅ | Apartment, Villa, Office, etc. |
| Location/Address | Textarea | ✅ | ✅ | Full address string |
| Move-in Date | Date | | Auto-set | Defaults to today |
| Move-out Date | Date | | | Optional |

### Section 2: Tenant Information

| Field | Type | Required | Auto-Fetched | Validation |
|-------|------|----------|--------------|------------|
| Select Tenant | Dropdown | ✅ | | Triggers auto-fetch |
| Tenant Name | Text | ✅ | ✅ | From tenant record |
| Tenant Code | Text | ✅ | ✅ | First 8 chars of tenant ID |
| Contact Number | Phone | ✅ | ✅ | Phone format validation |
| Email Address | Email | | ✅ | Email format validation |
| National ID/Passport | Text | ✅ | ✅ | From NIC or passport |
| Emergency Contact | Text | | | Optional |
| Tenant Type | Select | | | Individual/Corporate |

### Section 3: Lease Details

| Field | Type | Required | Auto-Calculated | Notes |
|-------|------|----------|-----------------|-------|
| Lease Start Date | Date | ✅ | Auto-set | Defaults to today |
| Lease End Date | Date | ✅ | | Must be >= start date |
| Lease Duration (Months) | Number | | ✅ | Calculated from dates |
| Contract Number | Text | | | Optional reference |
| Rent Type | Select | | | Monthly/Quarterly/Yearly |
| Renewal Reminder Date | Date | | | Optional |

### Section 4: Financial Details

| Field | Type | Required | Auto-Fetched | Validation |
|-------|------|----------|--------------|------------|
| Monthly Rent | Currency | ✅ | ✅ | Must be > 0 |
| Security Deposit | Currency | | | Optional |
| Advance Payment | Currency | | | Optional |
| Payment Method | Select | | | Bank/Cash/Cheque/Online |
| Next Rent Due Date | Date | | ✅ | Auto-calculated |

### Section 5: Utilities & Charges

| Field | Type | Required | Auto-Fetched | Notes |
|-------|------|----------|--------------|-------|
| Electricity Meter No | Text | | ✅ | From unit data |
| Electricity Initial Reading | Number | | | Optional |
| Water Meter No | Text | | ✅ | From unit data |
| Water Initial Reading | Number | | | Optional |
| Gas Fee (Monthly) | Currency | | | Optional |
| Internet Fee (Monthly) | Currency | | | Optional |
| Maintenance Fee (Monthly) | Currency | | | Optional |

### Section 6: Documents

| Document Type | Accepted Formats | Required | Max Size |
|---------------|------------------|----------|----------|
| Signed Lease Agreement | PDF, DOCX | Optional | 10MB |
| ID Proof | Images, PDF | Optional | 10MB |
| Deposit Receipt | Images, PDF | Optional | 10MB |
| Move-In Inspection Report | Images, PDF | Optional | 10MB |

---

## 🔧 Technical Implementation

### Frontend Component
**File:** `client/src/components/EnhancedMoveInModal.jsx`

**Key Technologies:**
- React Hooks (useState, useEffect)
- Lucide React Icons
- Tailwind CSS
- Toast Notifications
- Form Validation

**State Management:**
```javascript
{
  formData,          // All form fields
  currentStep,       // Current section number
  completedSections, // Array of completed section IDs
  expandedSections,  // Array of expanded section IDs
  errors,            // Validation errors object
  uploadProgress,    // File upload progress tracking
  isDraft,           // Draft status flag
  pdfPreview,        // PDF data for preview screen
  showPdfPreview     // Show PDF success screen
}
```

### Auto-Fetch Logic

**Property Data:**
```javascript
autoFetchPropertyData() {
  - propertyName ← property.title
  - propertyCode ← property._id (first 8 chars)
  - unitNumber ← unit.name
  - propertyType ← property.type
  - location ← concatenated address
  - monthlyRent ← unit.rentAmount
  - electricityMeterNo ← unit.electricityMeterNo
  - waterMeterNo ← unit.waterMeterNo
}
```

**Tenant Data:**
```javascript
handleTenantSelect(tenantId) {
  API: GET /api/tenants/:id
  - tenantName ← firstName + middleName + lastName
  - tenantCode ← _id (first 8 chars)
  - contactNumber ← phone
  - emailAddress ← email
  - nationalId ← nic || passportNo
}
```

### Auto-Calculation Logic

**Lease Duration:**
```javascript
useEffect(() => {
  if (leaseStartDate && leaseEndDate) {
    duration = Math.round((endDate - startDate) / (30 days))
  }
}, [leaseStartDate, leaseEndDate])
```

**Next Rent Due Date:**
```javascript
useEffect(() => {
  switch (rentType) {
    case 'MONTHLY': dueDate = startDate + 1 month
    case 'QUARTERLY': dueDate = startDate + 3 months
    case 'YEARLY': dueDate = startDate + 1 year
  }
}, [leaseStartDate, rentType])
```

### Validation Rules

```javascript
validateForm() {
  // Section 1
  - propertyName: required
  - unitNumber: required
  - propertyType: required
  - location: required
  
  // Section 2
  - tenantId: required
  - tenantName: required
  - tenantCode: required
  - contactNumber: required + phone format
  - emailAddress: email format (if provided)
  - nationalId: required
  
  // Section 3
  - leaseStartDate: required
  - leaseEndDate: required + >= startDate
  
  // Section 4
  - monthlyRent: required + > 0
}
```

---

## 🎬 User Flow

### 1. Open Move-In Modal
```
User clicks "Move In" button on available unit
→ Modal opens with Section 1 expanded
→ Property data auto-populated
→ Progress: 0 of 6 sections
```

### 2. Fill Property Information
```
User reviews auto-fetched data
→ Can edit any field if needed
→ "auto-fetched" badge shows for relevant fields
→ Collapse section when done
```

### 3. Select Tenant
```
User selects tenant from dropdown
→ API call to fetch tenant details
→ All tenant fields auto-populate
→ Toast: "Tenant details loaded successfully"
→ User can edit any field
```

### 4. Configure Lease
```
User sets start/end dates
→ Duration auto-calculates
→ User selects rent type
→ Next due date auto-calculates
```

### 5. Set Financial Details
```
Monthly rent pre-filled from unit
→ User adds security deposit
→ Selects payment method
→ Reviews next due date
```

### 6. Add Utilities (Optional)
```
Meter numbers pre-filled
→ User adds initial readings
→ Adds optional fees (gas, internet, maintenance)
```

### 7. Upload Documents (Optional)
```
Click "Click to upload" for each document type
→ Select file (max 10MB)
→ Progress bar shows upload
→ Preview shows filename and size
→ Can remove and re-upload
```

### 8. Save Draft OR Complete
```
Option A: Save Draft
  → Click "Save Draft"
  → API: POST /api/move-in/draft
  → Toast: "Draft saved successfully"
  → Can close and resume later

Option B: Complete Move-In
  → Click "Complete Move-In"
  → Validation runs
  → If errors: Toast + expand sections with errors
  → If valid:
    → API: POST /api/move-in/:propertyId/:unitId
    → Unit status → "OCCUPIED"
    → Lease record created
    → PDF generated
    → Success screen shown
```

### 9. Success Screen
```
Green success message displayed
→ Lease details summary shown
→ "Download Agreement PDF" button
→ Click download:
  → PDF opens in new tab
  → Auto-download triggers
  → Toast: "Agreement downloaded successfully"
→ Click "Close" to exit
```

---

## 🔌 Backend Integration Required

### Current Endpoints Used
1. `GET /api/move-in/tenants` - Get list of available tenants
2. `GET /api/tenants/:id` - Get specific tenant details
3. `POST /api/move-in/:propertyId/:unitId` - Complete move-in
4. `GET /api/move-in/agreement/:leaseId` - Download PDF

### New Endpoints Needed

#### 1. Document Upload
```http
POST /api/move-in/upload-document
Content-Type: multipart/form-data

Request:
{
  document: File,
  type: 'signedLease' | 'idProof' | 'depositReceipt' | 'moveInInspection'
}

Response:
{
  url: string,          // Cloudinary URL or server path
  filename: string,
  size: number,
  type: string,
  uploadedAt: ISODate
}

Validation:
- Max file size: 10MB
- Accepted types: PDF, DOCX, Images
- Store metadata: uploader, timestamp
```

#### 2. Save Draft
```http
POST /api/move-in/draft

Request:
{
  propertyId: string,
  unitId: string,
  status: 'DRAFT',
  ...formData (all fields)
}

Response:
{
  draftId: string,
  message: 'Draft saved successfully'
}

Logic:
- Create draft record in DB
- Status = 'DRAFT'
- Do NOT update unit status
- Do NOT generate PDF
```

#### 3. Load Draft
```http
GET /api/move-in/draft/:draftId

Response:
{
  draftId: string,
  propertyId: string,
  unitId: string,
  status: 'DRAFT',
  ...allFormData
}
```

#### 4. Complete from Draft
```http
POST /api/move-in/complete-draft/:draftId

Response:
{
  lease: { ...leaseData },
  pdfUrl: string
}

Logic:
- Validate all mandatory fields
- Update draft status to 'ACTIVE'
- Create lease record
- Update unit status to 'OCCUPIED'
- Generate rent payment schedule
- Generate PDF agreement
```

---

## 📊 Database Schema Updates

### MoveInDraft Collection (New)
```javascript
{
  _id: ObjectId,
  propertyId: ObjectId,
  unitId: ObjectId,
  status: 'DRAFT',
  
  // Property Info
  propertyName: String,
  propertyCode: String,
  unitNumber: String,
  unitName: String,
  propertyType: String,
  location: String,
  moveInDate: Date,
  moveOutDate: Date,
  
  // Tenant Info
  tenantId: ObjectId,
  tenantName: String,
  tenantCode: String,
  contactNumber: String,
  emailAddress: String,
  nationalId: String,
  emergencyContact: String,
  tenantType: String,
  
  // Lease Details
  leaseStartDate: Date,
  leaseEndDate: Date,
  leaseDuration: Number,
  contractNumber: String,
  rentType: String,
  renewalReminderDate: Date,
  
  // Financial Details
  monthlyRent: Number,
  securityDeposit: Number,
  advancePayment: Number,
  paymentMethod: String,
  nextRentDueDate: Date,
  
  // Utilities
  electricityMeterNo: String,
  electricityInitialReading: Number,
  waterMeterNo: String,
  waterInitialReading: Number,
  gasFee: Number,
  internetFee: Number,
  maintenanceFee: Number,
  
  // Documents
  documents: {
    signedLease: { url, filename, size, type, uploadedAt },
    idProof: { url, filename, size, type, uploadedAt },
    depositReceipt: { url, filename, size, type, uploadedAt },
    moveInInspection: { url, filename, size, type, uploadedAt }
  },
  
  // Meta
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Lease Model Updates (Optional)
```javascript
// Add document references to existing Lease model
documents: {
  signedLease: { url, filename, uploadedAt },
  idProof: { url, filename, uploadedAt },
  depositReceipt: { url, filename, uploadedAt },
  moveInInspection: { url, filename, uploadedAt }
},
utilities: {
  electricity: { meterNo, initialReading },
  water: { meterNo, initialReading },
  gasFee: Number,
  internetFee: Number,
  maintenanceFee: Number
}
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [x] All 6 sections display correctly
- [x] Sections can expand/collapse individually
- [x] Progress bar shows accurate completion
- [x] Property data auto-populates on load
- [x] Tenant data auto-populates on selection
- [x] Lease duration auto-calculates from dates
- [x] Next rent due date auto-calculates
- [x] All mandatory fields marked with red asterisk
- [x] Inline validation shows error messages
- [x] Phone format validated
- [x] Email format validated
- [x] End date >= start date validated
- [x] Rent amount > 0 validated
- [ ] File upload accepts correct formats
- [ ] File upload rejects files > 10MB
- [ ] Upload progress bar shows percentage
- [ ] Files can be removed after upload
- [ ] "Save Draft" persists incomplete data
- [ ] "Complete Move-In" validates all fields
- [ ] Success screen shows lease summary
- [ ] PDF download button works
- [ ] PDF opens in new tab

### UI/UX Requirements
- [x] Single-page layout (no pagination)
- [x] Responsive design (mobile + desktop)
- [x] Dark mode support
- [x] Color-coded sections
- [x] Clear visual hierarchy
- [x] Loading states for async operations
- [x] Toast notifications for user feedback
- [x] Auto-fetched fields have blue badge
- [x] Auto-calculated fields indicated
- [x] Read-only fields visually distinct

### Backend Requirements
- [ ] Document upload endpoint implemented
- [ ] Draft save endpoint implemented
- [ ] Draft load endpoint implemented
- [ ] Draft to active conversion implemented
- [ ] File storage configured (Cloudinary/local)
- [ ] Enhanced PDF with all new fields
- [ ] Audit trail for move-in actions

---

## 🧪 Test Checklist

### Manual Testing

#### Test 1: Auto-Fetch
```
1. Open modal for a property/unit
2. Verify property name, code, unit, type auto-filled
3. Select a tenant from dropdown
4. Verify tenant name, code, contact, email, ID auto-filled
5. Toast notification shows success
✅ PASS if all fields populate correctly
```

#### Test 2: Validation
```
1. Click "Complete Move-In" with empty form
2. Verify error messages appear
3. Verify first error section expands
4. Fill tenant name incorrectly (leave blank)
5. Submit → verify inline error shows
6. Set end date before start date
7. Submit → verify date error shows
8. Set rent to 0 or negative
9. Submit → verify rent error shows
✅ PASS if all validations work
```

#### Test 3: Auto-Calculation
```
1. Set lease start: Jan 1, 2024
2. Set lease end: Dec 31, 2024
3. Verify duration shows 12 months
4. Change rent type to "Quarterly"
5. Verify next due date = Apr 1, 2024
6. Change to "Yearly"
7. Verify next due date = Jan 1, 2025
✅ PASS if calculations are accurate
```

#### Test 4: File Upload
```
1. Click upload for ID Proof
2. Select a 2MB image file
3. Verify progress bar shows 0-100%
4. Verify file preview shows filename/size
5. Click remove (X) button
6. Verify file removed
7. Try uploading 15MB file
8. Verify error toast "File must be < 10MB"
✅ PASS if upload works with size validation
```

#### Test 5: Save Draft
```
1. Fill property and tenant sections
2. Leave lease details empty
3. Click "Save Draft"
4. Verify toast "Draft saved successfully"
5. Close modal
6. Reopen modal
7. Verify partial data persists
✅ PASS if draft saves and loads
```

#### Test 6: Complete Move-In
```
1. Fill all mandatory fields
2. Upload at least 1 document
3. Click "Complete Move-In"
4. Verify success screen appears
5. Verify lease summary shows
6. Click "Download PDF"
7. Verify PDF opens in new tab
8. Verify auto-download triggers
9. Check property page
10. Verify unit status = "Occupied"
✅ PASS if full flow completes
```

---

## 🚀 Deployment Notes

### Frontend
```bash
# Files changed
client/src/components/EnhancedMoveInModal.jsx  (NEW)
client/src/pages/PropertiesPage.jsx           (UPDATED)

# Deployment
git add -A
git commit -m "Add Enhanced Move-In Modal"
git push
# Render will auto-deploy
```

### Backend (Still Required)
```bash
# Files to create/update
server/src/routes/moveIn.js          (UPDATE)
server/src/models/MoveInDraft.js     (NEW)
server/src/middleware/documentUpload.js (NEW)

# Endpoints to implement
POST /api/move-in/upload-document
POST /api/move-in/draft
GET /api/move-in/draft/:draftId
POST /api/move-in/complete-draft/:draftId
```

---

## 📝 Next Steps

### Immediate (Required for Full Functionality)
1. ✅ Frontend Enhanced Modal (COMPLETED)
2. ⏳ Backend Document Upload Endpoint
3. ⏳ Backend Draft Save/Load Endpoints
4. ⏳ Update PDF Generator with New Fields
5. ⏳ Test Complete Flow End-to-End

### Future Enhancements
- Editable agreement template before PDF generation
- Multiple document versions tracking
- Document approval workflow
- E-signature integration
- Automated email of agreement to tenant
- Move-in checklist/inspection form builder
- Photo uploads for property condition
- Integration with external document storage (Google Drive, Dropbox)

---

## 🐛 Known Issues / Limitations

1. **File Upload** - Backend endpoint not yet implemented (returns simulated success)
2. **Draft Persistence** - Backend endpoint not yet implemented (local state only)
3. **PDF Preview** - Uses existing PDF generator (doesn't include new utility fields yet)
4. **Document Storage** - Needs Cloudinary or S3 configuration for production
5. **Mobile UX** - Sections might be tall on small screens (consider pagination toggle)

---

## 💡 Tips for Users

### For Fastest Move-In
1. Create tenant record first with all details
2. Ensure property has electricity/water meter numbers
3. Have documents ready in PDF format before starting
4. Use "Save Draft" if interrupted
5. Review auto-filled data carefully before submitting

### For Data Accuracy
- Double-check auto-calculated dates
- Verify tenant contact information
- Ensure meter numbers are correct
- Include emergency contact for safety
- Upload ID proof for verification

### Troubleshooting
- **"Tenant details not loading"** → Refresh page and try again
- **"File upload failed"** → Check file size < 10MB and format
- **"Can't complete move-in"** → Check for red error messages
- **"PDF won't download"** → Check browser pop-up blocker
- **Data lost after refresh** → Use "Save Draft" frequently

---

## 📞 Support

For issues or questions:
1. Check validation messages for field-specific errors
2. Review browser console (F12) for technical errors
3. Ensure all mandatory fields (red *) are filled
4. Verify internet connection for file uploads
5. Contact system administrator for backend issues

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Frontend Complete, Backend In Progress

