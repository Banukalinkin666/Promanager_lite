# Smart Property Manager - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Getting Started](#getting-started)
4. [User Roles and Permissions](#user-roles-and-permissions)
5. [Dashboard Overview](#dashboard-overview)
6. [Property Management](#property-management)
7. [Tenant Management](#tenant-management)
8. [Move-In Process](#move-in-process)
9. [Payment Management](#payment-management)
10. [Reports and Analytics](#reports-and-analytics)
11. [Settings and Configuration](#settings-and-configuration)
12. [Troubleshooting](#troubleshooting)
13. [Support and Contact](#support-and-contact)

---

## Introduction

### Welcome to Smart Property Manager

Smart Property Manager is a comprehensive property management system designed to streamline rental property operations. This system helps property owners, administrators, and tenants manage properties, tenants, payments, and lease agreements efficiently.

### Key Features
- **Property Management**: Add, edit, and manage multiple properties and units
- **Tenant Management**: Comprehensive tenant profiles and information tracking
- **Lease Management**: Digital lease agreements and move-in processes
- **Payment Tracking**: Automated rent collection and payment status monitoring
- **Reporting**: Detailed analytics and financial reports
- **Multi-role Access**: Different interfaces for owners, administrators, and tenants

---

## System Overview

### Architecture
The Smart Property Manager consists of:
- **Frontend**: React-based web application with modern UI
- **Backend**: Node.js/Express API server
- **Database**: MongoDB for data storage
- **File Storage**: Cloudinary for document and image storage
- **Payment Processing**: Stripe integration for online payments

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- JavaScript enabled

---

## Getting Started

### Accessing the System
1. Open your web browser
2. Navigate to the Smart Property Manager URL
3. You will see the login page

![Login Page](screenshots/login-page.png)
*Figure 1: Smart Property Manager Login Page*

### Initial Login Credentials
The system comes with default test accounts:

**Administrator Account:**
- Email: admin@spm.test
- Password: admin123

**Property Owner Account:**
- Email: owner@spm.test
- Password: owner123

**Tenant Account:**
- Email: tenant@spm.test
- Password: tenant123

### First-Time Setup
1. Log in with administrator credentials
2. Change default passwords in Settings
3. Configure system preferences
4. Add your first property

---

## User Roles and Permissions

### Administrator Role
**Full System Access:**
- Manage all properties and units
- Create and manage tenant accounts
- Access all financial reports
- Configure system settings
- Manage user accounts and permissions

### Property Owner Role
**Property Management Access:**
- Manage assigned properties
- View tenant information
- Track payments and rent collection
- Generate property-specific reports
- Manage lease agreements

### Tenant Role
**Limited Access:**
- View assigned units and lease information
- Access payment schedules
- Download lease agreements
- Make online rent payments
- View payment history

---

## Dashboard Overview

### Administrator/Owner Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)
*Figure 2: Administrator Dashboard Overview*

The dashboard provides a comprehensive overview of your property portfolio:

#### Key Metrics Cards
- **Total Properties**: Number of properties in your portfolio
- **Available Units**: Units ready for rent
- **Occupied Units**: Currently rented units
- **Rent Collected**: Total revenue collected

#### Property Statistics Section
- **Property-wise Breakdown**: Detailed statistics for each property
- **Unit Status Distribution**: Visual representation of unit availability
- **Occupancy Rates**: Performance metrics for each property

#### Tenant & Rent Statistics
- **Active Tenants**: Number of current tenants
- **Rent Collection Status**: Paid, pending, and due amounts
- **Property-wise Tenant Details**: Tenant information by property

### Tenant Dashboard

![Tenant Dashboard](screenshots/tenant-dashboard.png)
*Figure 3: Tenant Dashboard Overview*

Tenants see a personalized dashboard with:

#### Current Occupied Units
- **Unit Details**: Property name, unit number, and specifications
- **Monthly Rent**: Current rent amount
- **Lease Information**: Agreement number and dates
- **Payment Schedule**: Monthly rent payment tracking

#### Payment Management
- **Rent Schedule**: Monthly payment calendar
- **Payment Status**: Current payment status (Paid, Due, Pending)
- **Online Payment**: Direct payment processing
- **Payment History**: Complete payment records

---

## Property Management

### Adding a New Property

![Add Property Form](screenshots/add-property-form.png)
*Figure 4: Add New Property Form*

#### Step 1: Basic Property Information
1. Navigate to **Properties** in the sidebar
2. Click **Add Property** button
3. Fill in the required fields:
   - **Property Title**: Name of the property
   - **Address**: Complete street address
   - **Property Type**: Residential, Commercial, or Mixed
   - **Description**: Detailed property description

#### Step 2: Location Details
- **Country**: Property country
- **City**: Property city
- **State/Province**: State or province
- **ZIP/Postal Code**: Postal code

#### Step 3: Property Structure
- **Property Structure**: Single unit or Multi-unit
- **Base Rent**: Default rent amount
- **Meter Numbers**: Electricity and water meter numbers
- **Features**: Property amenities and features

#### Step 4: Property Images and Documents
- **Photos**: Upload property images
- **Documents**: Upload property documents (deeds, permits, etc.)

### Managing Property Units

![Property Units Management](screenshots/property-units.png)
*Figure 5: Property Units Management*

#### Adding Units to Properties
1. Select a property from the properties list
2. Click **Add Unit** button
3. Fill in unit details:
   - **Unit Name/Number**: Unit identifier
   - **Unit Type**: Apartment, Office, Villa, Studio, Penthouse
   - **Size**: Square footage
   - **Floor**: Floor number
   - **Bedrooms**: Number of bedrooms
   - **Bathrooms**: Number of bathrooms
   - **Parking**: Number of parking spaces
   - **Rent Amount**: Monthly rent
   - **Status**: Available, Occupied, or Maintenance
   - **Amenities**: Unit-specific amenities

#### Unit Status Management
- **Available**: Unit is ready for rent
- **Occupied**: Unit is currently rented
- **Maintenance**: Unit is under maintenance

#### Unit Actions
- **Edit Unit**: Modify unit details
- **Delete Unit**: Remove unit (only if no lease history)
- **View Details**: See complete unit information

---

## Tenant Management

### Creating Tenant Profiles

![Add Tenant Form](screenshots/add-tenant-form.png)
*Figure 6: Comprehensive Tenant Registration Form*

#### Step 1: General Information
1. Navigate to **Tenants** in the sidebar
2. Click **Add Tenant** button
3. Complete the general information section:
   - **First Name**: Tenant's first name
   - **Last Name**: Tenant's last name
   - **Middle Name**: Middle name (optional)
   - **Passport Number**: International identification
   - **NIC**: National ID number
   - **NIC Expiration Date**: ID expiration date
   - **Primary Email**: Main contact email
   - **Phone**: Primary phone number
   - **Nationality**: Tenant's nationality

#### Step 2: Contact Information
- **Secondary Email**: Alternative email address
- **Secondary Phone**: Alternative phone number

#### Step 3: Emergency Contact
- **Emergency Contact Name**: Emergency contact person
- **Relationship**: Relationship to tenant
- **Emergency Phone**: Emergency contact number
- **Emergency Email**: Emergency contact email

#### Step 4: Address Information
- **Street Address**: Current address
- **City**: Current city
- **State**: Current state
- **ZIP Code**: Postal code
- **Country**: Current country

#### Step 5: Employment Information
- **Company**: Employer name
- **Position**: Job title
- **Monthly Income**: Monthly salary
- **Employment Type**: Full-time, Part-time, Self-employed, Student, Unemployed

#### Step 6: Additional Information
- **Status**: Active, Inactive, or Blacklisted
- **Notes**: Additional tenant notes
- **Password**: Initial login password

### Managing Tenant Information

![Tenant Management Interface](screenshots/tenant-management.png)
*Figure 7: Tenant Management Interface*

#### Tenant List View
The tenant management interface displays:
- **Tenant Name**: Full name
- **Email**: Primary email address
- **Phone**: Contact number
- **NIC**: National ID number
- **Status**: Current tenant status
- **Actions**: View, Edit, Delete options

#### Tenant Status
- **Active**: Currently renting
- **Inactive**: Not currently renting
- **Blacklisted**: Cannot rent properties

#### Tenant Actions
- **View Details**: Complete tenant profile
- **Edit Tenant**: Modify tenant information
- **Delete Tenant**: Remove tenant from system

---

## Move-In Process

### Initiating Move-In

![Move-In Process](screenshots/move-in-process.png)
*Figure 8: Move-In Process Interface*

#### Step 1: Select Unit and Tenant
1. Navigate to **Properties** and select a property
2. Choose an available unit
3. Click **Move In** button
4. Select tenant from the dropdown list

#### Step 2: Lease Agreement Details
- **Lease Start Date**: Move-in date
- **Lease End Date**: Lease expiration date
- **Monthly Rent**: Agreed rent amount
- **Security Deposit**: Security deposit amount
- **Advance Payment**: Any advance payments

#### Step 3: Lease Terms
- **Late Fee Amount**: Late payment penalty
- **Late Fee After Days**: Grace period for late payments
- **Notice Period**: Required notice for lease termination
- **Pet Policy**: Pet allowance
- **Smoking Policy**: Smoking restrictions

### Document Management

![Document Upload](screenshots/document-upload.png)
*Figure 9: Document Upload Interface*

#### Required Documents
- **Signed Lease Agreement**: Executed lease document
- **ID Proof**: Tenant identification
- **Deposit Receipt**: Security deposit proof
- **Move-In Inspection**: Property condition report

#### Document Upload Process
1. Click **Upload Document** button
2. Select document type
3. Choose file from your device
4. Add document description
5. Click **Upload** to save

### Lease Agreement Generation

![Lease Agreement](screenshots/lease-agreement.png)
*Figure 10: Generated Lease Agreement*

#### Automatic Agreement Generation
- **Agreement Number**: Unique lease identifier
- **PDF Generation**: Automatic PDF creation
- **Digital Signatures**: Electronic signature capture
- **Document Storage**: Secure cloud storage

#### Agreement Features
- **Legal Compliance**: Standard lease terms
- **Customizable Terms**: Property-specific conditions
- **Digital Distribution**: Email delivery to tenants
- **Version Control**: Agreement history tracking

---

## Payment Management

### Payment Tracking System

![Payment Management](screenshots/payment-management.png)
*Figure 11: Payment Management Dashboard*

#### Payment Overview
The payment management system provides:
- **Total Amount**: Sum of all payments
- **Paid Payments**: Successfully completed payments
- **Pending Payments**: Payments in process
- **Due Payments**: Overdue payments

#### Payment Status Indicators
- **Paid**: Green indicator - Payment completed
- **Pending**: Yellow indicator - Payment processing
- **Due**: Red indicator - Payment overdue
- **Failed**: Red indicator - Payment failed

### Payment Processing

![Payment Processing](screenshots/payment-processing.png)
*Figure 12: Payment Processing Interface*

#### Online Payment Options
- **Credit Card**: Stripe-powered card payments
- **Bank Transfer**: Direct bank transfers
- **Cash Payments**: Manual cash entry

#### Payment Workflow
1. **Payment Creation**: Automatic payment record generation
2. **Payment Notification**: Email/SMS notifications
3. **Payment Processing**: Secure payment handling
4. **Status Updates**: Real-time payment status
5. **Receipt Generation**: Automatic receipt creation

### Rent Schedule Management

![Rent Schedule](screenshots/rent-schedule.png)
*Figure 13: Monthly Rent Schedule*

#### Schedule Features
- **Monthly Calendar**: Visual payment calendar
- **Due Dates**: Clear due date indicators
- **Payment Status**: Color-coded status tracking
- **Amount Tracking**: Monthly rent amounts

#### Payment Actions
- **Pay Now**: Direct payment processing
- **View Details**: Payment information
- **Download Receipt**: Payment confirmation
- **Payment History**: Complete payment records

---

## Reports and Analytics

### Financial Reports

![Financial Reports](screenshots/financial-reports.png)
*Figure 14: Financial Reports Dashboard*

#### Report Types
- **Revenue Reports**: Income tracking
- **Expense Reports**: Cost analysis
- **Profit/Loss**: Financial performance
- **Cash Flow**: Money movement tracking

#### Report Features
- **Date Ranges**: Customizable time periods
- **Property Filtering**: Property-specific reports
- **Export Options**: PDF/Excel export
- **Visual Charts**: Graphical data representation

### Property Performance

![Property Performance](screenshots/property-performance.png)
*Figure 15: Property Performance Analytics*

#### Performance Metrics
- **Occupancy Rates**: Unit utilization
- **Revenue per Property**: Income by property
- **Tenant Retention**: Lease renewal rates
- **Maintenance Costs**: Property upkeep expenses

### Tenant Analytics

![Tenant Analytics](screenshots/tenant-analytics.png)
*Figure 16: Tenant Analytics Dashboard*

#### Tenant Metrics
- **Payment History**: Individual payment records
- **Lease Duration**: Average tenancy length
- **Payment Patterns**: Payment behavior analysis
- **Satisfaction Scores**: Tenant feedback metrics

---

## Settings and Configuration

### User Management

![User Management](screenshots/user-management.png)
*Figure 17: User Management Interface*

#### User Account Management
- **Create Users**: Add new system users
- **Edit Profiles**: Modify user information
- **Role Assignment**: Assign user roles
- **Access Control**: Permission management

#### User Roles Configuration
- **Administrator**: Full system access
- **Property Owner**: Property management access
- **Tenant**: Limited tenant access

### System Settings

![System Settings](screenshots/system-settings.png)
*Figure 18: System Configuration Settings*

#### General Settings
- **Company Information**: Business details
- **Contact Information**: Support contacts
- **System Preferences**: Default settings
- **Notification Settings**: Alert configurations

#### Payment Settings
- **Payment Gateway**: Stripe configuration
- **Currency Settings**: Local currency setup
- **Fee Configuration**: Payment processing fees
- **Tax Settings**: Tax calculation rules

### Appearance Settings

![Appearance Settings](screenshots/appearance-settings.png)
*Figure 19: Theme and Appearance Configuration*

#### Theme Options
- **Light Theme**: Default light interface
- **Dark Theme**: Dark mode interface
- **Auto Theme**: System-based theme switching
- **Custom Colors**: Brand color customization

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
**Issue**: Cannot log in to the system
**Solutions**:
1. Verify email and password are correct
2. Check internet connection
3. Clear browser cache and cookies
4. Try a different browser
5. Contact system administrator

#### Payment Processing Issues
**Issue**: Payments not processing correctly
**Solutions**:
1. Verify payment gateway configuration
2. Check Stripe account status
3. Ensure sufficient funds
4. Verify payment method validity
5. Contact payment support

#### Document Upload Problems
**Issue**: Cannot upload documents
**Solutions**:
1. Check file size limits (max 10MB)
2. Verify file format (PDF, JPG, PNG)
3. Ensure stable internet connection
4. Try different file formats
5. Contact technical support

#### Performance Issues
**Issue**: System running slowly
**Solutions**:
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Restart browser
5. Contact system administrator

### Error Messages

#### Common Error Messages
- **"Invalid Credentials"**: Check username and password
- **"Session Expired"**: Log in again
- **"Permission Denied"**: Contact administrator for access
- **"File Too Large"**: Reduce file size
- **"Network Error"**: Check internet connection

---

## Support and Contact

### Getting Help

#### Self-Service Resources
- **User Manual**: This comprehensive guide
- **FAQ Section**: Frequently asked questions
- **Video Tutorials**: Step-by-step video guides
- **Knowledge Base**: Searchable help articles

#### Direct Support
- **Email Support**: support@smartpropertymanager.com
- **Phone Support**: +1 (555) 123-4567
- **Live Chat**: Available during business hours
- **Ticket System**: Create support tickets

#### Training Resources
- **Online Training**: Web-based training sessions
- **Video Tutorials**: Comprehensive video library
- **Documentation**: Detailed system documentation
- **Best Practices**: Recommended usage guidelines

### Contact Information

#### Technical Support
- **Email**: tech-support@smartpropertymanager.com
- **Phone**: +1 (555) 123-4568
- **Hours**: Monday-Friday, 9 AM - 6 PM EST

#### Sales and Billing
- **Email**: sales@smartpropertymanager.com
- **Phone**: +1 (555) 123-4569
- **Hours**: Monday-Friday, 8 AM - 5 PM EST

#### Emergency Support
- **Phone**: +1 (555) 123-4570
- **Email**: emergency@smartpropertymanager.com
- **Hours**: 24/7 for critical issues

---

## Conclusion

This user manual provides comprehensive guidance for using the Smart Property Manager system. The system is designed to streamline property management operations and provide a user-friendly experience for all stakeholders.

### Key Takeaways
- **Comprehensive Management**: Full property and tenant lifecycle management
- **User-Friendly Interface**: Intuitive design for all user types
- **Secure Operations**: Robust security and data protection
- **Scalable Solution**: Grows with your property portfolio
- **Continuous Support**: Ongoing assistance and system updates

### Next Steps
1. **Complete Initial Setup**: Configure your system preferences
2. **Add Properties**: Start with your first property
3. **Register Tenants**: Create tenant profiles
4. **Set Up Payments**: Configure payment processing
5. **Generate Reports**: Monitor your property performance

For additional support or questions not covered in this manual, please contact our support team using the information provided in the Support and Contact section.

---

*This manual is regularly updated to reflect system improvements and new features. Please check for the latest version on our website.*

**Version**: 1.0  
**Last Updated**: January 2025  
**Document ID**: SPM-UM-001
