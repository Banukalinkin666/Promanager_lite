import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function ReportsPage() {
  const [data, setData] = useState({ pending: 0, collected: 0 });
  useEffect(() => {
    (async () => {
      const invoices = await api.get('/invoices');
      const payments = await api.get('/payments');
      const collected = payments.data.filter((p)=>p.status==='SUCCEEDED').reduce((s,p)=>s+p.amount, 0);
      const pending = invoices.data.filter((i)=>i.status!=='PAID').reduce((s,i)=>s+i.amount, 0);
      setData({ pending, collected });
    })();
  }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <div className="text-sm text-gray-500">Pending Rents</div>
        <div className="text-2xl font-semibold">${data.pending.toFixed(2)}</div>
      </div>
      <div className="card">
        <div className="text-sm text-gray-500">Collected Rents</div>
        <div className="text-2xl font-semibold">${data.collected.toFixed(2)}</div>
      </div>
    </div>
  );
}


