# Toast Notification System - Implementation Guide

## ✅ What's Been Added

A professional toast notification and confirmation dialog system has been implemented to replace browser `alert()` and `confirm()` dialogs.

### Components Created:

1. **Toast.jsx** - Individual toast notification component
2. **ToastContainer.jsx** - Toast manager and context provider  
3. **ConfirmDialog.jsx** - Custom confirmation dialog component

---

## 🎨 Toast Types

The system supports 4 types of notifications:

### 1. Success (Green)
```javascript
toast.success('Property created successfully');
toast.success('Data saved!', 3000); // Custom duration (3 seconds)
```

### 2. Error (Red)
```javascript
toast.error('Failed to upload image');
toast.error('Invalid data provided');
```

### 3. Warning (Yellow)
```javascript
toast.warning('This action cannot be undone');
toast.warning('Please save your changes');
```

### 4. Info (Blue)
```javascript
toast.info('Loading property details...');
toast.info('New feature available');
```

---

## 📝 How to Use in Your Components

### Step 1: Import the hook
```javascript
import { useToast } from '../components/ToastContainer.jsx';
```

### Step 2: Use the hook in your component
```javascript
export default function MyComponent() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await api.post('/endpoint', data);
      toast.success('Saved successfully!');
    } catch (error) {
      toast.error('Failed to save. Please try again.');
    }
  };
  
  return (
    // ... your component JSX
  );
}
```

---

## 🔔 Replacing Existing Alerts

### OLD WAY (Browser Alert):
```javascript
alert('Error uploading images. Please try again.');
```

### NEW WAY (Toast):
```javascript
toast.error('Error uploading images. Please try again.');
```

---

## ✅ Replacing Confirmation Dialogs

### Using ConfirmDialog Component

#### Step 1: Import
```javascript
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/ToastContainer.jsx';
```

#### Step 2: Add state
```javascript
const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null
});
```

#### Step 3: Replace window.confirm

**OLD WAY:**
```javascript
const deleteProperty = async (id) => {
  if (window.confirm('Are you sure you want to delete this property?')) {
    await api.delete(`/properties/${id}`);
    load();
  }
};
```

**NEW WAY:**
```javascript
const deleteProperty = (id) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete Property',
    message: 'Are you sure you want to delete this property? This action cannot be undone.',
    onConfirm: async () => {
      try {
        await api.delete(`/properties/${id}`);
        toast.success('Property deleted successfully');
        load();
      } catch (error) {
        toast.error('Failed to delete property');
      }
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  });
};
```

#### Step 4: Add ConfirmDialog to JSX
```javascript
return (
  <div>
    {/* Your component content */}
    
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      onConfirm={confirmDialog.onConfirm}
      title={confirmDialog.title}
      message={confirmDialog.message}
      type="danger" // 'danger', 'warning', or 'info'
      confirmText="Delete"
      cancelText="Cancel"
    />
  </div>
);
```

---

## 🎨 ConfirmDialog Types

### Danger (Red - for deletions)
```javascript
<ConfirmDialog
  type="danger"
  title="Delete Property"
  message="Are you sure you want to delete this property?"
  confirmText="Delete"
/>
```

### Warning (Yellow - for important actions)
```javascript
<ConfirmDialog
  type="warning"
  title="End Lease"
  message="End lease without collecting due rents?"
  confirmText="End Lease"
/>
```

### Info (Blue - for general confirmations)
```javascript
<ConfirmDialog
  type="info"
  title="Save Changes"
  message="Do you want to save your changes?"
  confirmText="Save"
/>
```

---

## 📍 Toast Positioning

Toasts appear in the **top-right corner** of the screen and:
- ✅ Stack vertically if multiple toasts
- ✅ Auto-dismiss after 5 seconds (customizable)
- ✅ Can be manually dismissed by clicking X
- ✅ Slide in with animation
- ✅ Fully responsive on mobile

---

## 🎯 Common Patterns

### Pattern 1: API Success/Error
```javascript
const saveData = async () => {
  try {
    await api.post('/endpoint', data);
    toast.success('Data saved successfully!');
    navigate('/list');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to save data');
  }
};
```

### Pattern 2: Validation Errors
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name) {
    toast.warning('Please enter a name');
    return;
  }
  
  if (!formData.email) {
    toast.warning('Please enter an email');
    return;
  }
  
  // Proceed with submission
  try {
    await api.post('/users', formData);
    toast.success('User created successfully!');
  } catch (error) {
    toast.error('Failed to create user');
  }
};
```

### Pattern 3: Delete with Confirmation
```javascript
const handleDelete = (id) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete Tenant',
    message: 'Are you sure you want to delete this tenant? This action cannot be undone.',
    onConfirm: async () => {
      try {
        await api.delete(`/tenants/${id}`);
        toast.success('Tenant deleted successfully');
        loadTenants();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete tenant');
      }
      setConfirmDialog({ isOpen: false });
    }
  });
};
```

---

## 🔧 Customization

### Custom Duration
```javascript
toast.success('Quick message!', 2000); // 2 seconds
toast.info('Important info', 10000); // 10 seconds
toast.error('Critical error', 0); // No auto-dismiss
```

### Custom Styling
Edit `client/src/components/Toast.jsx` to change colors, sizes, or icons.

---

## 📦 Files to Update

To fully implement the toast system across your app, update these files:

### Already Updated:
- ✅ `client/src/main.jsx` - ToastProvider added
- ✅ `client/src/styles.css` - Animations added
- ✅ `client/src/components/Toast.jsx` - Created
- ✅ `client/src/components/ToastContainer.jsx` - Created
- ✅ `client/src/components/ConfirmDialog.jsx` - Created

### Need to Update:
Replace `alert()` and `window.confirm()` in:
- ⏳ `client/src/pages/PropertiesPage.jsx`
- ⏳ `client/src/pages/TenantsPage.jsx`
- ⏳ `client/src/pages/PaymentsPage.jsx`
- ⏳ `client/src/pages/SettingsPage.jsx`
- ⏳ Any other pages with alert/confirm

---

## 🚀 Benefits

✅ **Professional UI** - No more ugly browser alerts
✅ **Better UX** - Non-blocking, dismissible notifications
✅ **Consistent** - Same look and feel across the app
✅ **Accessible** - Proper ARIA labels and keyboard support
✅ **Customizable** - Easy to modify colors, duration, position
✅ **Type-safe** - Clear success/error/warning/info states
✅ **Responsive** - Works great on mobile devices
✅ **Animated** - Smooth slide-in and scale animations

---

## 📸 Visual Examples

### Toast Notification
```
┌─────────────────────────────────────┐
│ ✓  Property created successfully    │ × 
└─────────────────────────────────────┘
```

### Confirmation Dialog
```
        ┌──────────────────────────┐
        │  🗑️  Delete Property      │ ×
        ├──────────────────────────┤
        │  Are you sure you want   │
        │  to delete this property?│
        │                          │
        │ [Delete]     [Cancel]    │
        └──────────────────────────┘
```

---

**Next Steps:** Update existing `alert()` and `window.confirm()` calls throughout the codebase to use the new toast notification system!

