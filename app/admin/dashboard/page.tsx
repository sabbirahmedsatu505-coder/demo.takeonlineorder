'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Order = {
  id: string; order_number: number; customer_name: string; status: string;
  payment_status: string; payment_method: string; total: number; created_at: string;
};
type OrderItemAgg = { item_name: string; count: number };

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <AdminNav>
        <Dashboard />
      </AdminNav>
    </RequireAuth>
  );
}

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [topDishes, setTopDishes] = useState<OrderItemAgg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, payment_status, payment_method, total, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      const { data: itemRows } = await supabase
        .from('order_items')
        .select('item_name, quantity');

      setOrders(allOrders || []);

      const counts: Record<string, number> = {};
      (itemRows || []).forEach(row => {
        counts[row.item_name] = (counts[row.item_name] || 0) + row.quantity;
      });
      const sorted = Object.entries(counts)
        .map(([item_name, count]) => ({ item_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopDishes(sorted);

      setLoading(false);
    }

    load();

    // Live updates — no manual refresh needed. Any new order, status change,
    // or payment confirmation re-pulls the dashboard data instantly.
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter(o => new Date(o.created_at) >= todayStart);

  const pending = orders.filter(o => o.status === 'pending').length;
  const inProgress = orders.filter(o => ['preparing', 'ready'].includes(o.status)).length;
  const completed = todaysOrders.filter(o => o.status === 'completed').length;
  const todaysRevenue = todaysOrders
    .filter(o => o.payment_status === 'paid' || o.payment_method === 'cash')
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Last 7 days revenue for the bar chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 1);
    const dayOrders = orders.filter(o => {
      const created = new Date(o.created_at);
      return created >= d && created < nextDay;
    });
    const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), revenue };
  });
  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading dashboard…</div>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Welcome back!</h1>
      <p className="text-gray-500 text-sm mb-6">Here's what's happening at your restaurant today.</p>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Orders" value={pending} color="bg-orange-50 text-orange-700" />
        <StatCard label="Orders in Progress" value={inProgress} color="bg-blue-50 text-blue-700" />
        <StatCard label="Completed Today" value={completed} color="bg-green-50 text-green-700" />
        <StatCard label="Today's Revenue" value={`$${todaysRevenue.toFixed(2)}`} color="bg-red-50 text-red-700" />
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {/* REVENUE CHART */}
        <div className="sm:col-span-2 bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Revenue — Last 7 Days</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {last7Days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-brand rounded-t-md"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                  title={`$${d.revenue.toFixed(2)}`}
                />
                <span className="text-xs text-gray-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOP DISHES */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Top Dishes</h2>
          <div className="space-y-3">
            {topDishes.map((dish, i) => (
              <div key={dish.item_name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </span>
                  {dish.item_name}
                </span>
                <span className="text-gray-500">{dish.count} orders</span>
              </div>
            ))}
            {topDishes.length === 0 && <p className="text-gray-400 text-sm">No order data yet.</p>}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white border rounded-xl p-5 mt-6">
        <h2 className="font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2 pr-4">#Order</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(order => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-semibold text-brand">#{order.order_number}</td>
                  <td className="py-2 pr-4">{order.customer_name}</td>
                  <td className="py-2 pr-4">${Number(order.total).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{timeAgo(order.created_at)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-gray-400 text-center">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-orange-100 text-orange-700';
    case 'preparing': return 'bg-blue-100 text-blue-700';
    case 'ready': return 'bg-purple-100 text-purple-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}
