# Smart Property Manager - Process Flow Documentation

**Version:** 1.1  
**Date:** November 2025  
**System URL:** https://spm-frontend-dfju.onrender.com/

## Introduction

This document provides step-by-step instructions for using the Smart Property Manager system. It covers both administrative processes (for property managers, admins, and owners) and tenant self-service features.

**For Property Managers/Admins/Owners:** Processes 1-5 cover creating tenants, properties, units, managing move-ins, and collecting payments.

**For Tenants:** Processes 6-7 cover how tenants can pay rent online and view their lease details and history through their own login account.

---

## Table of Contents

1. [How to Create a Tenant](#1-how-to-create-a-tenant)
2. [How to Create a Property](#2-how-to-create-a-property)
3. [How to Create a Unit](#3-how-to-create-a-unit)
4. [How to Add Move-In](#4-how-to-add-move-in)
5. [How to Collect Payment](#5-how-to-collect-payment)
6. [How Tenants Pay Online (Tenant Self-Service)](#6-how-tenants-pay-online-tenant-self-service)
7. [How Tenants View Lease Details and History (Tenant Self-Service)](#7-how-tenants-view-lease-details-and-history-tenant-self-service)

---

## 1. How to Create a Tenant

### Overview
Creating a tenant profile is the first step in managing your rental properties. A tenant must be registered in the system before they can be assigned to a unit.

### Prerequisites
- Admin or Owner account access
- Tenant's personal and contact information

### Step-by-Step Process

#### Step 1: Navigate to Tenants Page
1. Log in to the Smart Property Manager system
2. From the left sidebar menu, click on **"Tenants"** (icon: two person icons)
3. You will see the "Registered Tenants" page with a list of existing tenants (if any)

#### Step 2: Open Tenant Registration Form
1. Click the **"+ Add Tenant"** button (usually located at the top right of the page)
2. A tenant registration form modal will appear

#### Step 3: Fill in General Information
Fill in the following required fields:

**Personal Details:**
- **First Name** * (Required)
- **Last Name** * (Required)
- **Middle Name** (Optional)
- **NIC/Passport Number** * (Required - National ID or Passport)
- **NIC Expiration Date** (If applicable)
- **Nationality** * (Required)
- **Status** (Default: ACTIVE)
  - Options: ACTIVE, INACTIVE, BLACKLISTED

**Contact Information:**
- **Primary Email** * (Required - used for login)
- **Phone** * (Required)
- **Secondary Email** (Optional)
- **Secondary Phone** (Optional)

#### Step 4: Add Address Information
- **Street Address**
- **City** * (Required)
- **State/Province** * (Required)
- **ZIP/Postal Code** * (Required)
- **Country** * (Required)

#### Step 5: Add Emergency Contact
- **Name** (Optional)
- **Relationship** (Optional)
- **Phone** (Optional)
- **Email** (Optional)

#### Step 6: Add Employment Information
- **Company Name** (Optional)
- **Position/Job Title** (Optional)
- **Monthly Income** (Optional)
- **Employment Type** (Default: FULL_TIME)
  - Options: FULL_TIME, PART_TIME, SELF_EMPLOYED, STUDENT, UNEMPLOYED

#### Step 7: Add Notes (Optional)
- Enter any additional notes or comments about the tenant

#### Step 8: Set Default Password
- The system automatically sets a default password: **"tenant123"**
- The tenant will use this password along with their primary email to log in
- **Important:** Inform the tenant to change their password after first login

#### Step 9: Save Tenant
1. Review all entered information
2. Click the **"Save Tenant"** or **"Create Tenant"** button
3. A success message will appear confirming the tenant has been created
4. The tenant will now appear in the tenants list

### Important Notes
- Each tenant must have a unique email address (primary email)
- The NIC/Passport number should be unique for proper identification
- Tenants with status "BLACKLISTED" cannot be assigned to units
- You can edit tenant information later by clicking the "Edit" button next to their name

### Next Steps
After creating a tenant, you can:
- Assign them to a unit (see Process 4: How to Add Move-In)
- View their profile details
- Edit their information if needed

---

## 2. How to Create a Property

### Overview
A property is a building or real estate that contains one or more rental units. You must create a property before adding units to it.

### Prerequisites
- Admin or Owner account access
- Property details (address, type, owner information)

### Step-by-Step Process

#### Step 1: Navigate to Properties Page
1. Log in to the Smart Property Manager system
2. From the left sidebar menu, click on **"Properties"** (icon: building icon)
3. You will see the properties dashboard with a list of existing properties (if any)

#### Step 2: Open Property Creation Form
1. Click the **"+ Add Property"** button (usually located at the top right of the page)
2. A property creation form will appear

#### Step 3: Fill in Property Basic Information
**Property Details:**
- **Property Title/Name** * (Required - e.g., "Green Valley Estates")
- **Property Type** * (Required)
  - Options: RESIDENTIAL, COMMERCIAL, MIXED
- **Property Structure** * (Required)
  - Options: SINGLE_UNIT, MULTI_UNIT
- **Base Rent** * (Required - default rent amount for the property)
- **Description** (Optional - detailed description of the property)

#### Step 4: Add Location Information
**Address:**
- **Street Address** * (Required)
- **City** * (Required)
- **State/Province** * (Required)
- **ZIP/Postal Code** * (Required)
- **Country** * (Required)

#### Step 5: Add Property Owner
- **Owner** * (Required)
  - Select from existing users with "OWNER" role
  - If no owner exists, you must create an owner account first in User Management

#### Step 6: Add Meter Information (Optional)
- **Electricity Meter Number**
- **Water Meter Number**

#### Step 7: Add Property Features (Optional)
- Select or enter property features/amenities
- Examples: Parking, Security, Elevator, Swimming Pool, etc.

#### Step 8: Upload Property Photos (Optional)
- Click **"Upload Photos"** or drag and drop images
- You can upload multiple photos
- Supported formats: JPG, PNG, etc.

#### Step 9: Save Property
1. Review all entered information
2. Click the **"Save Property"** or **"Create Property"** button
3. A success message will appear confirming the property has been created
4. The property will now appear in the properties list

### Important Notes
- Each property must have an owner assigned
- The property structure determines if you can add multiple units (MULTI_UNIT) or just one (SINGLE_UNIT)
- You can add units to the property after creation (see Process 3: How to Create a Unit)
- Property photos help tenants view available properties

### Next Steps
After creating a property, you can:
- Add units to the property (see Process 3: How to Create a Unit)
- View property details and statistics
- Edit property information if needed

---

## 3. How to Create a Unit

### Overview
A unit is an individual rental space within a property (e.g., Apartment 101, Office Suite 5). Units must be created within an existing property.

### Prerequisites
- Admin or Owner account access
- A property must already exist in the system
- Unit details (number, type, size, rent amount)

### Step-by-Step Process

#### Step 1: Navigate to Property Details
1. Go to the **Properties** page
2. Find and click on the property where you want to add a unit
3. You will see the property details page showing existing units (if any)

#### Step 2: Open Unit Creation Form
1. On the property details page, click the **"+ Add Unit"** button
2. A unit creation form modal will appear

#### Step 3: Fill in Unit Basic Information
**Unit Details:**
- **Unit Number/Name** * (Required - e.g., "101", "Suite A", "Unit 5")
- **Unit Type** * (Required)
  - Options: APARTMENT, OFFICE, VILLA, STUDIO, PENTHOUSE, OTHER
- **Status** * (Default: AVAILABLE)
  - Options: AVAILABLE, OCCUPIED, MAINTENANCE

#### Step 4: Add Unit Specifications
**Physical Details:**
- **Size (Square Feet)** (Optional)
- **Floor Number** (Default: 0)
- **Number of Bedrooms** (Default: 0)
- **Number of Bathrooms** (Default: 0)
- **Parking Spaces** (Default: 0)

#### Step 5: Set Rental Information
- **Rent Amount** * (Required - monthly rent for this unit)
- This is the amount the tenant will pay monthly

#### Step 6: Add Meter Information (Optional)
- **Electricity Meter Number**
- **Water Meter Number**

#### Step 7: Add Amenities (Optional)
- Select or enter unit-specific amenities
- Examples: Air Conditioning, Balcony, Furnished, etc.

#### Step 8: Upload Unit Photos (Optional)
- Click **"Upload Photos"** or drag and drop images
- You can upload multiple photos
- These photos will be visible to tenants when viewing available units

#### Step 9: Save Unit
1. Review all entered information
2. Click the **"Save Unit"** or **"Create Unit"** button
3. A success message will appear confirming the unit has been created
4. The unit will now appear in the property's unit list

### Important Notes
- Unit numbers should be unique within the same property
- Units with status "OCCUPIED" cannot be edited or deleted
- Units with status "MAINTENANCE" are temporarily unavailable for rent
- The rent amount is the monthly rental fee for this specific unit
- Once a unit has transaction history or leases, it cannot be deleted (only edited if status is AVAILABLE or MAINTENANCE)

### Next Steps
After creating a unit, you can:
- Assign a tenant to the unit (see Process 4: How to Add Move-In)
- Edit unit information (if status is AVAILABLE or MAINTENANCE)
- View unit details and history

---

## 4. How to Add Move-In

### Overview
Move-in is the process of assigning a tenant to a unit and creating a lease agreement. This generates rent payment records and activates the rental relationship.

### Prerequisites
- Admin or Owner account access
- A tenant must exist in the system
- A property with at least one AVAILABLE unit
- Lease agreement details (start date, duration, rent amount)

### Step-by-Step Process

#### Step 1: Navigate to Property and Select Unit
1. Go to the **Properties** page
2. Click on the property containing the unit you want to assign
3. On the property details page, find the unit you want to assign
4. Click the **"Move In"** button next to the unit (or click on the unit card)

#### Step 2: Open Move-In Modal
1. The Move-In form modal will open automatically
2. You will see the property and unit information pre-filled

#### Step 3: Select Tenant
1. In the **"Select Tenant"** field, start typing the tenant's name or email
2. Select the tenant from the dropdown list
3. **Note:** The tenant must already exist in the system (see Process 1: How to Create a Tenant)

#### Step 4: Fill in Lease Agreement Details
**Lease Information:**
- **Lease Start Date** * (Required - when the lease begins)
- **Lease End Date** * (Required - when the lease expires)
- **Lease Duration** (Automatically calculated based on start and end dates)
- **Monthly Rent** * (Required - usually pre-filled from unit rent amount)
- **Security Deposit** (Optional)
- **Advance Payment** (Optional - any advance payment made by tenant)

#### Step 5: Upload Lease Agreement Document (Optional)
1. Click **"Upload Lease Agreement"** or drag and drop the document
2. Supported formats: PDF, DOC, DOCX, images
3. This document will be stored with the lease record

#### Step 6: Add Additional Information
- **Notes** (Optional - any special terms or conditions)
- **Agreement Number** (Optional - your internal reference number)

#### Step 7: Review and Confirm
1. Review all entered information:
   - Tenant details
   - Unit information
   - Lease dates and duration
   - Rent amount
2. Ensure the lease dates are correct
3. Verify the rent amount matches the unit's rent

#### Step 8: Complete Move-In
1. Click the **"Complete Move-In"** or **"Save Lease"** button
2. The system will:
   - Create a lease agreement record
   - Change the unit status from "AVAILABLE" to "OCCUPIED"
   - Generate rent payment records for the lease duration
   - Link the tenant to the unit
3. A success message will appear confirming the move-in is complete

### Important Notes
- Once a move-in is completed, the unit status automatically changes to "OCCUPIED"
- The system automatically generates rent payment records based on the lease duration
- If an advance payment is entered, it will be applied to the first month's rent
- The lease agreement document is stored securely and can be accessed later
- You cannot move in a tenant to an already occupied unit

### What Happens After Move-In
After completing move-in:
- The unit status changes to "OCCUPIED"
- Rent payment records are created for each month of the lease
- The tenant can now log in and view their lease and payment information
- Payment collection can begin (see Process 5: How to Collect Payment)

### Next Steps
After move-in, you can:
- Collect rent payments (see Process 5: How to Collect Payment)
- View lease details and history
- Edit lease information if needed
- Process move-out when the lease ends

---

## 5. How to Collect Payment

### Overview
Payment collection is the process of recording and processing rent payments from tenants. The system tracks payment status, methods, and generates payment records.

### Prerequisites
- Admin or Owner account access
- A tenant must have an active lease (move-in completed)
- Payment information (amount, method, date)

### Step-by-Step Process

#### Step 1: Navigate to Payments Page
1. Log in to the Smart Property Manager system
2. From the left sidebar menu, click on **"Payments"** (icon: credit card icon)
3. You will see the Payments page with a list of all payment records

#### Step 2: View Pending Payments
1. The payments page shows all payment records
2. Filter or search for specific payments:
   - Use the search bar to find by tenant name, property, or agreement number
   - Use filters for:
     - **Tenant** (All Tenants or specific tenant)
     - **Property** (All Properties or specific property)
     - **Unit** (All Units or specific unit)
     - **Status** (All, Paid, Pending, Due)
     - **Payment Method** (All, Cash, Card, Bank Transfer)

#### Step 3: Identify Payment to Process
1. Look for payments with status:
   - **Pending** (Yellow badge) - Payment not yet received
   - **Due** (Red badge) - Payment is overdue
2. Click on a payment record to view details, or
3. Click the **"Edit"** or **"Update"** button (eye icon) next to the payment

#### Step 4: Open Payment Update Modal
1. Click the **"Edit"** button (eye icon) next to the payment you want to process
2. A payment details/update modal will open
3. You will see:
   - Tenant information
   - Property and unit details
   - Payment amount
   - Due date
   - Current status

#### Step 5: Record Payment Information
**Payment Details:**
- **Payment Method** * (Required)
  - Options: CASH, CARD, BANK TRANSFER
- **Payment Date** (Usually today's date, can be adjusted)
- **Amount** (Pre-filled from the payment record, can be adjusted if partial payment)

#### Step 6: Add Payment Notes (Optional)
- Enter any notes about the payment
- Examples: "Received in cash", "Bank transfer reference: ABC123", etc.

#### Step 7: Confirm Payment
1. Review the payment information:
   - Verify the amount is correct
   - Confirm the payment method
   - Check the payment date
2. Click the **"Mark as Paid"** or **"Update Payment"** button
3. The system will:
   - Update payment status to "SUCCEEDED" (Paid)
   - Record the payment method
   - Update the payment date
   - Generate a payment receipt (if applicable)

#### Step 8: Verify Payment Status
1. After updating, the payment status will change to **"Paid"** (Green badge)
2. The payment will now appear in the "Paid" filter
3. The payment method will be displayed in the payment record

### Alternative: Bulk Payment Processing
If multiple payments need to be processed:
1. Use the filters to find all pending payments for a specific tenant or property
2. Process each payment individually using the steps above
3. The system tracks each payment separately

### Payment Status Indicators
- **Paid (Green)** - Payment successfully received and recorded
- **Pending (Yellow)** - Payment not yet received, but not overdue
- **Due (Red)** - Payment is past the due date and not received

### Important Notes
- Payments can only be marked as paid if they have a status of PENDING or OVERDUE
- Once marked as paid, the payment status cannot be easily reversed (contact admin if correction needed)
- The payment method is recorded for accounting and reporting purposes
- Partial payments can be recorded by adjusting the amount
- All payment records are stored and can be viewed in reports

### Viewing Payment History
To view payment history:
1. Go to the Payments page
2. Use filters to find specific payments:
   - Filter by tenant to see all payments from a specific tenant
   - Filter by property to see all payments for a property
   - Filter by status to see paid, pending, or due payments
3. Click on any payment to view full details

### Generating Payment Reports
1. Navigate to the **Reports** page
2. Select the appropriate report:
   - **Due Rent Report** - Shows all pending and overdue payments
   - **Uncollected Rent Report** - Shows uncollected rent by property/unit
   - **Property Management Reports** - Income and expenses reports
3. Apply filters (property, year, date range)
4. Generate and export reports as needed

### Next Steps
After collecting a payment:
- The payment record is updated and stored
- Reports will reflect the updated payment status
- The tenant can view their payment history in their account
- You can generate receipts or reports as needed

### Alternative: Tenant Self-Service Online Payment
**Note:** Tenants can also make payments online through their own login account. See Process 6: How Tenants Pay Online for detailed instructions.

---

## 6. How Tenants Pay Online (Tenant Self-Service)

### Overview
Tenants can make rent payments online through their own login account using a secure payment gateway (Stripe). This allows tenants to pay their rent 24/7 without needing to contact the property manager.

### Prerequisites
- Tenant account with login credentials (email and password)
- Active lease agreement
- Valid credit/debit card or payment method
- Internet connection

### Step-by-Step Process

#### Step 1: Log In to Tenant Account
1. Go to the Smart Property Manager login page: https://spm-frontend-dfju.onrender.com/
2. Enter your **Primary Email** (the email used when your tenant account was created)
3. Enter your **Password** (default password is "tenant123" if not changed)
4. Click **"Sign In"** or press Enter
5. You will be redirected to your tenant dashboard

#### Step 2: Navigate to Dashboard
1. After logging in, you will automatically see your **Dashboard**
2. The dashboard shows:
   - Your current rental units
   - Lease information
   - Rent payment schedule
   - Payment status for each month

#### Step 3: View Your Rent Schedule
1. On the dashboard, you will see cards for each unit you are renting
2. Each unit card shows:
   - Property name and address
   - Unit number
   - Current lease information
   - Rent payment schedule
3. Click on **"View Rent Schedule"** or expand the rent schedule section to see all monthly payments

#### Step 4: Identify Payments to Make
1. Review your rent schedule to see payment status:
   - **Paid (Green)** - Payment already completed
   - **Pending (Yellow)** - Payment not yet due, but can be paid early
   - **Due (Red)** - Payment is overdue and needs immediate attention
2. Each payment entry shows:
   - Month and year (e.g., "January 2025")
   - Due date
   - Amount due
   - Current status

#### Step 5: Select Payment to Process
1. Find the payment you want to make (Pending or Due status)
2. Click the **"Pay Now"** or **"Pay Rent"** button next to the payment
3. A confirmation dialog will appear showing:
   - Payment month
   - Amount to pay
   - Due date
   - Property and unit information

#### Step 6: Confirm Payment Details
1. Review the payment information in the confirmation dialog:
   - Verify the amount is correct
   - Check the property and unit details
   - Confirm the month you're paying for
2. Click **"OK"** or **"Confirm"** to proceed
3. The system will create a secure payment session

#### Step 7: Complete Payment via Payment Gateway
1. You will be redirected to the secure payment gateway (Stripe Checkout)
2. The payment page will open in a new window or tab
3. Enter your payment information:
   - **Card Number** (16-digit credit or debit card number)
   - **Expiration Date** (MM/YY)
   - **CVV** (3-digit security code on the back of the card)
   - **Cardholder Name** (name as it appears on the card)
   - **Billing Address** (if required)
4. Review the payment summary:
   - Amount to be charged
   - Payment description (e.g., "Rent payment for January 2025")
5. Click **"Pay"** or **"Submit Payment"** to complete the transaction

#### Step 8: Payment Confirmation
1. After successful payment, you will see a confirmation message
2. The payment gateway will process your payment
3. You will be redirected back to your dashboard
4. The payment status will automatically update to **"Paid"** (Green badge)
5. You may receive a payment receipt via email (if configured)

#### Step 9: Verify Payment Status
1. Return to your dashboard
2. Refresh the page if needed (or it may update automatically)
3. Check that the payment status has changed to **"Paid"**
4. The payment should now show a green checkmark or "Paid" badge

### Important Notes
- **Payment Security:** All payments are processed through Stripe, a secure payment gateway. Your card information is never stored on the property management system.
- **Payment Timing:** Payments are processed immediately. The status updates automatically after successful payment.
- **Failed Payments:** If a payment fails, you will see an error message. Check your card details and try again, or contact your bank.
- **Payment Methods:** Currently supports credit and debit cards. Other payment methods may be available depending on your region.
- **Early Payments:** You can pay rent in advance (for future months) if desired.
- **Partial Payments:** Contact your property manager if you need to make a partial payment arrangement.

### Viewing Payment History
To view your complete payment history:
1. Go to the **Payments** page from the left sidebar menu
2. You will see all your payment records:
   - Paid payments (with green badge)
   - Pending payments (with yellow badge)
   - Due payments (with red badge)
3. Each payment shows:
   - Payment date
   - Amount
   - Payment method
   - Status
   - Property and unit information
4. Use the search bar or filters to find specific payments

### Troubleshooting Payment Issues

**Issue:** Payment button not working
- **Solution:** Ensure you have an active lease and the payment is in Pending or Due status. Contact your property manager if the issue persists.

**Issue:** Payment gateway not loading
- **Solution:** Check your internet connection. Disable pop-up blockers as the payment gateway may open in a new window.

**Issue:** Payment failed
- **Solution:** Verify your card details are correct. Check that your card has sufficient funds. Contact your bank if the issue continues.

**Issue:** Payment processed but status not updated
- **Solution:** Refresh your dashboard page. If the status still doesn't update, contact your property manager to verify the payment was received.

### Next Steps
After making an online payment:
- Your payment record is automatically updated
- You can view the payment in your payment history
- You may receive a payment receipt (check your email)
- The property manager is automatically notified of your payment

---

## 7. How Tenants View Lease Details and History (Tenant Self-Service)

### Overview
Tenants can view their current lease details and complete lease history through their login account. This includes lease agreement information, rent schedules, payment history, and downloadable lease documents.

### Prerequisites
- Tenant account with login credentials
- Active or previous lease agreement

### Step-by-Step Process

#### Step 1: Log In to Tenant Account
1. Go to the Smart Property Manager login page: https://spm-frontend-dfju.onrender.com/
2. Enter your **Primary Email** and **Password**
3. Click **"Sign In"**
4. You will be redirected to your tenant dashboard

#### Step 2: Access Your Dashboard
1. After logging in, you will see your **Dashboard**
2. The dashboard displays:
   - Your current rental units (if you have an active lease)
   - Previous rental units (if you have ended leases)
   - Summary statistics

#### Step 3: View Current Lease Details
1. On the dashboard, find the card for your current unit
2. The unit card shows:
   - **Property Information:**
     - Property name and address
     - Property type and features
   - **Unit Information:**
     - Unit number
     - Unit type (Apartment, Office, etc.)
     - Size, bedrooms, bathrooms
     - Amenities
   - **Lease Information:**
     - Lease start date
     - Lease end date
     - Monthly rent amount
     - Agreement number
     - Lease status (Active/Ended)

#### Step 4: Expand Lease Details
1. Click on your unit card or click **"View Details"** to see more information
2. You will see detailed lease information including:
   - **Lease Agreement Details:**
     - Agreement number
     - Lease start and end dates
     - Lease duration
     - Monthly rent amount
     - Security deposit (if applicable)
     - Advance payment (if any)
   - **Property Details:**
     - Full property address
     - Property features and amenities
   - **Unit Specifications:**
     - Unit size (square feet)
     - Number of bedrooms and bathrooms
     - Parking spaces
     - Unit-specific amenities

#### Step 5: View Rent Payment Schedule
1. On the unit details, click **"View Rent Schedule"** or expand the rent schedule section
2. You will see a monthly breakdown showing:
   - **Month/Year** (e.g., "January 2025")
   - **Due Date** for each month
   - **Amount** due for each month
   - **Payment Status:**
     - Paid (Green) - Payment completed
     - Pending (Yellow) - Payment not yet due
     - Due (Red) - Payment overdue
   - **Payment Date** (if paid)
   - **Payment Method** (if paid)

#### Step 6: Download Lease Agreement Document
1. On the lease details page, look for the **"Download Agreement"** or **"View Agreement"** button
2. Click the button to download your lease agreement PDF
3. The PDF will open in a new window or download to your device
4. Save the PDF for your records
5. **Note:** The lease agreement document contains all terms and conditions of your rental agreement

#### Step 7: View Lease History
1. On your dashboard, scroll to find the **"Lease History"** section
2. Click **"View Lease History"** or expand the history section for your unit
3. You will see a list of all previous leases for that unit, including:
   - **Previous Lease Details:**
     - Lease start and end dates
     - Agreement number
     - Monthly rent amount
     - Lease status (Ended/Expired)
   - **Payment History** for that lease period
   - **Notes** or special conditions (if any)

#### Step 8: View All Lease History (Multiple Units)
If you have rented multiple units:
1. On the dashboard, you will see separate cards for each unit
2. Each unit card shows its own lease history
3. You can expand each unit's history individually
4. The system maintains a complete history of all your rental agreements

### Information Available in Lease Details

#### Current Lease Information
- **Agreement Number:** Unique identifier for your lease
- **Lease Period:** Start date and end date
- **Monthly Rent:** Amount due each month
- **Security Deposit:** Amount held as security (if applicable)
- **Advance Payment:** Any advance payments made
- **Lease Status:** Active, Expired, or Ended

#### Property and Unit Details
- **Property Name and Address:** Full property information
- **Unit Number:** Your specific unit identifier
- **Unit Type:** Apartment, Office, Villa, Studio, etc.
- **Size:** Square footage of the unit
- **Bedrooms and Bathrooms:** Number of each
- **Parking:** Number of parking spaces included
- **Amenities:** List of available amenities

#### Payment Information
- **Rent Schedule:** Monthly breakdown of all payments
- **Payment Status:** Paid, Pending, or Due for each month
- **Payment History:** Complete record of all payments made
- **Payment Methods:** How each payment was made (if applicable)
- **Payment Dates:** When each payment was received

#### Documents
- **Lease Agreement PDF:** Downloadable copy of your signed lease agreement
- **Payment Receipts:** Available through the Payments page

### Important Notes
- **Privacy:** Only you can view your own lease details. Property managers and other tenants cannot see your information.
- **Data Accuracy:** All lease information is synchronized with the property manager's records.
- **Document Access:** Lease agreement documents are available for download at any time during and after your lease period.
- **History Retention:** Your complete lease history is maintained in the system for record-keeping purposes.

### Troubleshooting

**Issue:** Cannot see lease details
- **Solution:** Ensure you have an active lease. If you just moved in, the lease details may take a few minutes to appear. Contact your property manager if the issue persists.

**Issue:** Lease agreement PDF not downloading
- **Solution:** Check your browser's pop-up blocker settings. Try right-clicking the download button and selecting "Save Link As". Contact your property manager if the document is missing.

**Issue:** Payment history not showing
- **Solution:** Refresh the page. Payment history updates automatically after payments are processed. If payments are missing, contact your property manager.

**Issue:** Previous lease history not visible
- **Solution:** Lease history is maintained for all your previous rentals. If you don't see a previous lease, contact your property manager to verify it was properly recorded in the system.

### Next Steps
After viewing your lease details:
- Download and save your lease agreement PDF for your records
- Review your rent schedule to plan upcoming payments
- Make payments online if you have pending or due payments (see Process 6: How Tenants Pay Online)
- Contact your property manager if you have questions about your lease terms

---

## General Tips and Best Practices

### Data Entry
- Always verify information before saving
- Use consistent naming conventions for properties and units
- Keep tenant contact information up to date
- Upload lease documents for record-keeping

### Payment Management
- Process payments promptly to maintain accurate records
- Use appropriate payment methods for tracking
- Review pending payments regularly
- Generate reports monthly for accounting purposes

### System Maintenance
- Regularly review and update tenant status
- Keep property and unit information current
- Archive or remove inactive tenants/properties as needed
- Back up important documents and data

### Security
- Only authorized users (Admin/Owner) should have access to these functions
- Keep login credentials secure
- Log out when finished using the system

---

## Support and Troubleshooting

### Common Issues

**Issue:** Cannot create tenant - Email already exists
- **Solution:** Each tenant must have a unique email address. Check if the tenant already exists in the system.

**Issue:** Cannot add unit - Property not found
- **Solution:** Ensure the property exists and you have selected the correct property.

**Issue:** Cannot move in tenant - Unit is occupied
- **Solution:** Only units with status "AVAILABLE" can be assigned. Check unit status or process move-out first.

**Issue:** Payment not updating
- **Solution:** Ensure you have proper permissions (Admin/Owner role) and the payment status allows updates.

### Getting Help
- Contact your system administrator for access issues
- Refer to this documentation for step-by-step guidance
- Check system notifications for error messages

---

## Document Control

**Document Version:** 1.1  
**Last Updated:** November 2025  
**Prepared For:** Smart Property Manager System Users  
**Prepared By:** System Documentation Team

### Version History
- **v1.1 (November 2025):** Added tenant self-service processes (online payment and lease viewing)
- **v1.0 (November 2025):** Initial release with administrative processes

---

**End of Document**

