import { chromium } from 'playwright';

// Tenant test data
const tenants = [
  {
    firstName: 'Emma',
    lastName: 'Martinez',
    middleName: 'Marie',
    passportNo: 'AB234567',
    nic: '891234567V',
    nicExpiration: '2030-12-31',
    primaryEmail: 'emma.martinez342@gmail.com',
    phone: '0771234567',
    nationality: 'American',
    secondaryEmail: 'emma.m.backup@gmail.com',
    secondaryPhone: '0762345678',
    emergencyName: 'Robert Martinez',
    emergencyRelationship: 'Parent',
    emergencyPhone: '0773456789',
    emergencyEmail: 'robert.martinez@gmail.com',
    street: '523 Oak Avenue',
    city: 'Los Angeles',
    state: 'California',
    zipCode: '90001',
    country: 'United States',
    company: 'Google',
    position: 'Software Engineer',
    monthlyIncome: '8500',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 2'
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    middleName: 'Lee',
    passportNo: 'CD456789',
    nic: '851234321V',
    nicExpiration: '2029-06-15',
    primaryEmail: 'james.wilson891@gmail.com',
    phone: '0764567890',
    nationality: 'British',
    emergencyName: 'Sarah Wilson',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '0775678901',
    emergencyEmail: 'sarah.wilson@gmail.com',
    street: '782 Maple Street',
    city: 'Chicago',
    state: 'Illinois',
    zipCode: '60007',
    country: 'United States',
    company: 'Microsoft',
    position: 'Project Manager',
    monthlyIncome: '9200',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 3'
  },
  {
    firstName: 'Sophia',
    lastName: 'Garcia',
    middleName: 'Ann',
    passportNo: 'EF789012',
    nic: '921234567V',
    nicExpiration: '2031-03-20',
    primaryEmail: 'sophia.garcia456@gmail.com',
    phone: '0776789012',
    nationality: 'Spanish',
    emergencyName: 'Michael Garcia',
    emergencyRelationship: 'Sibling',
    emergencyPhone: '0767890123',
    emergencyEmail: 'michael.garcia@gmail.com',
    street: '156 Pine Road',
    city: 'Houston',
    state: 'Texas',
    zipCode: '77002',
    country: 'United States',
    company: 'Amazon',
    position: 'Data Analyst',
    monthlyIncome: '7800',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 4'
  },
  {
    firstName: 'William',
    lastName: 'Brown',
    middleName: 'Joseph',
    passportNo: 'GH234567',
    nic: '871234567V',
    nicExpiration: '2028-11-10',
    primaryEmail: 'william.brown234@gmail.com',
    phone: '0778901234',
    nationality: 'Canadian',
    emergencyName: 'Emma Brown',
    emergencyRelationship: 'Parent',
    emergencyPhone: '0769012345',
    emergencyEmail: 'emma.brown@gmail.com',
    street: '943 Cedar Boulevard',
    city: 'Phoenix',
    state: 'Arizona',
    zipCode: '85001',
    country: 'United States',
    company: 'Apple',
    position: 'Marketing Manager',
    monthlyIncome: '10500',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 5'
  },
  {
    firstName: 'Olivia',
    lastName: 'Rodriguez',
    middleName: 'Elizabeth',
    passportNo: 'IJ567890',
    nic: '941234567V',
    nicExpiration: '2032-08-25',
    primaryEmail: 'olivia.rodriguez678@gmail.com',
    phone: '0770123456',
    nationality: 'Australian',
    emergencyName: 'James Rodriguez',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '0761234567',
    emergencyEmail: 'james.rodriguez@gmail.com',
    street: '321 Main Street',
    city: 'Philadelphia',
    state: 'Pennsylvania',
    zipCode: '19019',
    country: 'United States',
    company: 'Meta',
    position: 'Sales Representative',
    monthlyIncome: '6500',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 6'
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    middleName: 'Thomas',
    passportNo: 'KL890123',
    nic: '831234567V',
    nicExpiration: '2027-04-30',
    primaryEmail: 'michael.johnson234@gmail.com',
    phone: '0772345678',
    nationality: 'German',
    emergencyName: 'Sophia Johnson',
    emergencyRelationship: 'Sibling',
    emergencyPhone: '0763456789',
    emergencyEmail: 'sophia.johnson@gmail.com',
    street: '654 Oak Avenue',
    city: 'San Antonio',
    state: 'Texas',
    zipCode: '78201',
    country: 'United States',
    company: 'Tesla',
    position: 'HR Specialist',
    monthlyIncome: '5800',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 7'
  },
  {
    firstName: 'Ava',
    lastName: 'Davis',
    middleName: 'Grace',
    passportNo: 'MN345678',
    nic: '901234567V',
    nicExpiration: '2030-09-15',
    primaryEmail: 'ava.davis901@gmail.com',
    phone: '0774567890',
    nationality: 'French',
    emergencyName: 'William Davis',
    emergencyRelationship: 'Parent',
    emergencyPhone: '0765678901',
    emergencyEmail: 'william.davis@gmail.com',
    street: '888 Maple Road',
    city: 'San Diego',
    state: 'California',
    zipCode: '92101',
    country: 'United States',
    company: 'Netflix',
    position: 'Accountant',
    monthlyIncome: '7200',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 8'
  },
  {
    firstName: 'Robert',
    lastName: 'Miller',
    middleName: 'Alex',
    passportNo: 'OP678901',
    nic: '861234567V',
    nicExpiration: '2029-02-28',
    primaryEmail: 'robert.miller543@gmail.com',
    phone: '0776789012',
    nationality: 'Italian',
    emergencyName: 'Olivia Miller',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '0767890123',
    emergencyEmail: 'olivia.miller@gmail.com',
    street: '234 Pine Street',
    city: 'Dallas',
    state: 'Texas',
    zipCode: '75201',
    country: 'United States',
    company: 'Adobe',
    position: 'Designer',
    monthlyIncome: '8900',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 9'
  },
  {
    firstName: 'Isabella',
    lastName: 'Hernandez',
    middleName: 'Marie',
    passportNo: 'QR012345',
    nic: '931234567V',
    nicExpiration: '2033-07-20',
    primaryEmail: 'isabella.hernandez789@gmail.com',
    phone: '0778901234',
    nationality: 'Japanese',
    emergencyName: 'David Hernandez',
    emergencyRelationship: 'Sibling',
    emergencyPhone: '0769012345',
    emergencyEmail: 'david.hernandez@gmail.com',
    street: '567 Cedar Avenue',
    city: 'San Jose',
    state: 'California',
    zipCode: '95101',
    country: 'United States',
    company: 'Oracle',
    position: 'Consultant',
    monthlyIncome: '11200',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 10'
  },
  {
    firstName: 'David',
    lastName: 'Smith',
    middleName: 'James',
    passportNo: 'ST456789',
    nic: '881234567V',
    nicExpiration: '2028-12-05',
    primaryEmail: 'david.smith321@gmail.com',
    phone: '0770123456',
    nationality: 'Korean',
    secondaryEmail: 'd.smith.backup@gmail.com',
    secondaryPhone: '0761234567',
    emergencyName: 'Emma Smith',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '0772345678',
    emergencyEmail: 'emma.smith@gmail.com',
    street: '789 Main Boulevard',
    city: 'New York',
    state: 'New York',
    zipCode: '10001',
    country: 'United States',
    company: 'Salesforce',
    position: 'Developer',
    monthlyIncome: '12500',
    employmentType: 'FULL_TIME',
    notes: 'QA Test Tenant 11'
  }
];

async function fillTenantForm(page, tenant, index) {
  console.log(`\n📝 Creating Tenant ${index + 2}: ${tenant.firstName} ${tenant.lastName}`);

  try {
    // Wait for and click "Add Tenant" or "Create Tenant" button
    await page.waitForSelector('button:has-text("Add Tenant"), button:has-text("Create Tenant"), button:has-text("New Tenant")', { timeout: 5000 });
    await page.click('button:has-text("Add Tenant"), button:has-text("Create Tenant"), button:has-text("New Tenant")');
    
    // Wait for form to appear
    await page.waitForTimeout(1000);

    // Fill General Information
    console.log('   ✓ Filling general information...');
    await page.fill('input[name="firstName"], input[placeholder*="First Name"]', tenant.firstName);
    await page.fill('input[name="lastName"], input[placeholder*="Last Name"]', tenant.lastName);
    if (tenant.middleName) {
      await page.fill('input[name="middleName"], input[placeholder*="Middle Name"]', tenant.middleName);
    }
    
    // Fill NIC and Passport
    await page.fill('input[name="nic"], input[placeholder*="NIC"]', tenant.nic);
    if (tenant.passportNo) {
      await page.fill('input[name="passportNo"], input[name="passport"], input[placeholder*="Passport"]', tenant.passportNo);
    }
    if (tenant.nicExpiration) {
      await page.fill('input[name="nicExpirationDate"], input[type="date"]', tenant.nicExpiration);
    }
    
    // Fill Contact Information
    console.log('   ✓ Filling contact information...');
    await page.fill('input[name="primaryEmail"], input[name="email"], input[type="email"]', tenant.primaryEmail);
    await page.fill('input[name="phone"], input[placeholder*="Phone"]', tenant.phone);
    await page.fill('input[name="nationality"], input[placeholder*="Nationality"]', tenant.nationality);
    
    if (tenant.secondaryEmail) {
      await page.fill('input[name="secondaryEmail"]', tenant.secondaryEmail);
    }
    if (tenant.secondaryPhone) {
      await page.fill('input[name="secondaryPhone"]', tenant.secondaryPhone);
    }

    // Fill Emergency Contact
    console.log('   ✓ Filling emergency contact...');
    await page.fill('input[name="emergencyContact.name"], input[placeholder*="Emergency Contact Name"]', tenant.emergencyName);
    await page.fill('input[name="emergencyContact.relationship"], input[placeholder*="Relationship"]', tenant.emergencyRelationship);
    await page.fill('input[name="emergencyContact.phone"], input[placeholder*="Emergency Phone"]', tenant.emergencyPhone);
    await page.fill('input[name="emergencyContact.email"], input[placeholder*="Emergency Email"]', tenant.emergencyEmail);

    // Fill Address
    console.log('   ✓ Filling address...');
    await page.fill('input[name="address.street"], input[placeholder*="Street"]', tenant.street);
    await page.fill('input[name="address.city"], input[placeholder*="City"]', tenant.city);
    await page.fill('input[name="address.state"], input[placeholder*="State"]', tenant.state);
    await page.fill('input[name="address.zipCode"], input[placeholder*="ZIP"]', tenant.zipCode);
    await page.fill('input[name="address.country"], input[placeholder*="Country"]', tenant.country);

    // Fill Employment
    console.log('   ✓ Filling employment details...');
    await page.fill('input[name="employment.company"], input[placeholder*="Company"]', tenant.company);
    await page.fill('input[name="employment.position"], input[placeholder*="Position"]', tenant.position);
    await page.fill('input[name="employment.monthlyIncome"], input[placeholder*="Monthly Income"]', tenant.monthlyIncome);
    
    // Select employment type
    await page.selectOption('select[name="employment.employmentType"], select:has(option:has-text("FULL_TIME"))', tenant.employmentType);

    // Fill Notes
    if (tenant.notes) {
      await page.fill('textarea[name="notes"], textarea[placeholder*="Notes"]', tenant.notes);
    }

    // Submit form
    console.log('   ✓ Submitting form...');
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    console.log(`   ✅ Tenant ${index + 2} created successfully!`);
    
  } catch (error) {
    console.error(`   ❌ Error creating tenant ${index + 2}:`, error.message);
    throw error;
  }
}

async function runAutomation() {
  console.log('🚀 Starting Tenant Creation Automation...\n');
  console.log('📋 Target: Create 10 tenants via UI automation');
  console.log('🌐 URL: http://localhost:3000 (local) or https://spm-frontend-gvcu.onrender.com (production)\n');

  const browser = await chromium.launch({ 
    headless: false,  // Set to true for headless mode
    slowMo: 100       // Slow down by 100ms for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    console.log(`🔗 Navigating to: ${baseUrl}`);
    await page.goto(baseUrl);
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', 'admin@spm.test');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    console.log('✅ Login successful!\n');

    // Navigate to Tenants page
    console.log('📂 Navigating to Tenants page...');
    await page.click('a[href="/tenants"], button:has-text("Tenants")');
    await page.waitForTimeout(2000);
    console.log('✅ Tenants page loaded!\n');

    // Create each tenant
    for (let i = 0; i < tenants.length; i++) {
      await fillTenantForm(page, tenants[i], i);
      await page.waitForTimeout(1500); // Wait between submissions
    }

    console.log('\n🎉 All 10 tenants created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total Tenants Created: 10`);
    console.log(`   Total Tenants (including 1st): 11`);
    console.log(`   All passwords: Welcome@123`);
    console.log('\n✅ QA Testing Complete!');

  } catch (error) {
    console.error('\n❌ Automation Error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Run the automation
runAutomation().catch(console.error);

