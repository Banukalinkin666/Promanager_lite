# Smart Property Manager - Server

Environment variables:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/smart_property_manager
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Commands:

- Install: `npm i`
- Seed: `npm run seed`
- Dev: `npm run dev`

Users (after seed):
- Admin: admin@spm.test / admin123
- Owner: owner@spm.test / owner123
- Tenant: tenant@spm.test / tenant123


