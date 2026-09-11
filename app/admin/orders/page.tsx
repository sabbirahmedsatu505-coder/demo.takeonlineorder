'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Order = {
  id: string; order_number: number; customer_name: string; customer_phone: string;
  order_type: string; payment_method: string; status: string; payment_status: string;
  total: number; created_at: string;
};

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'completed'];

export default function AdminOrdersPage() {
  return (
    <RequireAuth>
      <AdminNav>
        <OrdersDashboard />
      </AdminNav>
    </RequireAuth>
  );
}

function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        setOrders(prev => {
          if (payload.eventType === 'INSERT') return [payload.new as Order, ...prev];
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              return prev.filter(o => o.id !== updated.id);
            }
            return prev.map(o => o.id === updated.id ? updated : o);
          }
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function advanceStatus(order: Order) {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    if (!nextStatus) return;
    await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id);
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`Cancel order #${order.order_number}? This can't be undone.`)) return;
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Live Orders</h1>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-gray-500">No active orders.</p>}
        {orders.map(order => (
          <div key={order.id} className="border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">
                #{order.order_number} · {order.customer_name} · {order.order_type}
              </p>
              <p className="text-sm text-gray-500">
                {order.customer_phone} · ${order.total.toFixed(2)} ·{' '}
                <span className="uppercase text-xs font-semibold text-gray-400">{order.payment_method}</span> ·{' '}
                <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}>
                  {order.payment_status}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => advanceStatus(order)}
                className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold capitalize"
              >
                {order.status} → next
              </button>
              <button
                onClick={() => cancelOrder(order)}
                className="text-xs text-gray-400 underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
