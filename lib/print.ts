import { getSupabaseAdmin } from './supabase';

// Formats an order as plain-text receipt content.
function formatReceipt(order: any, items: any[]) {
  const line = '--------------------------------';
  let receipt = '';
  receipt += `ORDER #${order.order_number}\n`;
  receipt += `${new Date(order.created_at).toLocaleString()}\n`;
  receipt += `${line}\n`;
  receipt += `${order.customer_name}\n`;
  receipt += `${order.customer_phone}\n`;
  receipt += `Type: ${order.order_type.toUpperCase()}\n`;
  if (order.delivery_address) receipt += `Address: ${order.delivery_address}\n`;
  receipt += `${line}\n`;
  for (const item of items) {
    receipt += `${item.quantity}x ${item.item_name}  $${item.line_total.toFixed(2)}\n`;
    if (item.selected_options?.length) {
      for (const opt of item.selected_options) {
        receipt += `   - ${opt.choice}\n`;
      }
    }
  }
  receipt += `${line}\n`;
  receipt += `TOTAL: $${order.total.toFixed(2)}\n`;
  if (order.notes) receipt += `Notes: ${order.notes}\n`;
  receipt += `\n\n\n`; // feed paper before cut
  return receipt;
}

// Sends the order to the kitchen printer via PrintNode's API.
// Requires PRINTNODE_API_KEY and PRINTNODE_PRINTER_ID env vars (see README).
// If not configured, this silently skips printing (won't break checkout).
export async function printOrder(orderId: string) {
  const apiKey = process.env.PRINTNODE_API_KEY;
  const printerId = process.env.PRINTNODE_PRINTER_ID;
  if (!apiKey || !printerId) {
    console.warn('PrintNode not configured — skipping print. Set PRINTNODE_API_KEY and PRINTNODE_PRINTER_ID to enable.');
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
  const { data: items } = await supabaseAdmin.from('order_items').select('*').eq('order_id', orderId);
  if (!order) return;

  const receiptText = formatReceipt(order, items || []);

  try {
    const res = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // PrintNode uses HTTP Basic auth: API key as username, empty password
        Authorization: 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
      },
      body: JSON.stringify({
        printerId: Number(printerId),
        title: `Order #${order.order_number}`,
        contentType: 'raw_base64',
        content: Buffer.from(receiptText).toString('base64'),
        source: 'Restaurant Website',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('PrintNode print job failed:', errText);
    }
  } catch (err) {
    // Never let a printer failure break the payment flow — just log it.
    console.error('PrintNode request error:', err);
  }
}
