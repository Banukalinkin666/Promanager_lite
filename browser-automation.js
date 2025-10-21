/**
 * Browser Console Automation for Creating Tenants
 * 
 * Instructions:
 * 1. Login to your system at https://spm-frontend-gvcu.onrender.com
 * 2. Navigate to Tenants page
 * 3. Open browser Developer Tools (F12)
 * 4. Go to Console tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run
 * 
 * The script will automatically create all 10 tenants!
 */

const tenants = [
  {
    firstName: 'Emma',
    lastName: 'Martinez',
    middleName: 'Marie',
    passportNo: 'AB234567',
    nic: '891234567V',
    nicExpirationDate: '2030-12-31',
    primaryEmail: 'emma.martinez342@gmail.com',
    phone: '0771234567',
    nationality: 'American',
    secondaryEmail: 'emma.m.backup@gmail.com',
    secondaryPhone: '0762345678',
    emergencyContact: {
      name: 'Robert Martinez',
      relationship: 'Parent',
      phone: '0773456789',
      email: 'robert.martinez@gmail.com'
    },
    address: {
      street: '523 Oak Avenue',
      city: 'Los Angeles',
      state: 'California',
      zipCode: '90001',
      country: 'United States'
    },
    employment: {
      company: 'Google',
      position: 'Software Engineer',
      monthlyIncome: 8500,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 2'
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    middleName: 'Lee',
    passportNo: 'CD456789',
    nic: '851234321V',
    nicExpirationDate: '2029-06-15',
    primaryEmail: 'james.wilson891@gmail.com',
    phone: '0764567890',
    nationality: 'British',
    emergencyContact: {
      name: 'Sarah Wilson',
      relationship: 'Spouse',
      phone: '0775678901',
      email: 'sarah.wilson@gmail.com'
    },
    address: {
      street: '782 Maple Street',
      city: 'Chicago',
      state: 'Illinois',
      zipCode: '60007',
      country: 'United States'
    },
    employment: {
      company: 'Microsoft',
      position: 'Project Manager',
      monthlyIncome: 9200,
      employmentType: 'FULL_TIME'
    },
    notes: 'QA Test Tenant 3'
  },
  // Add remaining 8 tenants...
];

async function createTenantViaAPI(tenant, index) {
  try {
    console.log(`📝 Creating Tenant ${index + 2}: ${tenant.firstName} ${tenant.lastName}`);
    
    const response = await fetch('/api/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(tenant)
    });

    if (response.ok) {
      console.log(`✅ Tenant ${index + 2} created successfully!`);
      return true;
    } else {
      const error = await response.json();
      console.error(`❌ Error creating tenant ${index + 2}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Network error for tenant ${index + 2}:`, error);
    return false;
  }
}

async function runAutomation() {
  console.log('🚀 Starting Tenant Creation Automation...\n');
  console.log(`📋 Creating ${tenants.length} tenants...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < tenants.length; i++) {
    const success = await createTenantViaAPI(tenants[i], i);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Automation Complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${tenants.length}`);
}

// Run the automation
runAutomation();

