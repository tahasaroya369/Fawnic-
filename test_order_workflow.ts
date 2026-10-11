import { createSessionToken } from './server/auth.ts';
import { getNeonPool } from './server/storage/neon.ts';

async function runTests() {
  const token = createSessionToken('usr_1791227601178_d48dn', 'tahasaroya369@gmail.com', 'customer');
  const tokenUser2 = createSessionToken('usr_1789586536928_tqjpi', 'tahahussainsaroya329@gmail.com', 'customer');
  const adminToken = createSessionToken('usr_admin_1', 'alichishtia111@gmail.com', 'admin');

  const pool = getNeonPool();
  if (!pool) throw new Error('No Neon pool available');

  const prodRes = await pool.query("SELECT id, name, stock FROM products WHERE id = 'fwn_prd_1791571838415_6k8u'");
  const initialStock = prodRes.rows[0].stock;
  console.log('--- TEST 1: Initial Stock of product in Neon:', initialStock);

  // Clean up any stray test orders from previous runs first
  await pool.query("DELETE FROM orders WHERE customer_email = 'tahasaroya369@gmail.com' AND notes LIKE '%Test%'");

  // 1. Place order with manually entered city 'Daska'
  const placeRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      customerName: 'Taha Ibrar',
      customerEmail: 'tahasaroya369@gmail.com',
      customerPhone: '+92 300 1234567',
      shippingAddress: {
        fullName: 'Taha Ibrar',
        phone: '+92 300 1234567',
        addressLine1: 'Main Bazaar, Near Clock Tower',
        city: 'Daska',
        province: 'Punjab',
        postalCode: '51010'
      },
      items: [
        { productId: 'fwn_prd_1791571838415_6k8u', quantity: 1 }
      ],
      paymentMethod: 'cod',
      notes: 'Automated Test Order 1'
    })
  });

  const orderData = await placeRes.json();
  if (!placeRes.ok) throw new Error('Order placement failed: ' + JSON.stringify(orderData));
  const testOrderId = orderData.order.id;
  console.log('--- TEST 1 PASSED: Order Placed:', orderData.order.orderNumber, '| City:', orderData.order.shippingAddress.city);

  // Verify stock deduction in Neon
  const afterOrderProd = await pool.query("SELECT stock FROM products WHERE id = 'fwn_prd_1791571838415_6k8u'");
  const postOrderStock = afterOrderProd.rows[0].stock;
  console.log('Stock after order in Neon:', postOrderStock, '(expected:', initialStock - 1, ')');
  if (postOrderStock !== initialStock - 1) throw new Error('Stock was not properly deducted in Neon');

  // Verify order in Neon
  const neonOrderRes = await pool.query('SELECT id, order_number, shipping_address, status FROM orders WHERE id = $1', [testOrderId]);
  const neonOrderRow = neonOrderRes.rows[0];
  console.log('Order in Neon orders table:', neonOrderRow.order_number, 'Status:', neonOrderRow.status);
  if (!neonOrderRow) throw new Error('Order not found in Neon database');

  const parsedAddr = typeof neonOrderRow.shipping_address === 'string' ? JSON.parse(neonOrderRow.shipping_address) : neonOrderRow.shipping_address;
  if (parsedAddr.city !== 'Daska') throw new Error('Saved order in Neon did not retain city Daska');
  console.log('--- TEST 9 PASSED: Saved order in Neon retains manual city:', parsedAddr.city);

  // 2. Verify order in customer order history
  const custOrdersRes = await fetch('http://localhost:3000/api/customer/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const custOrders = await custOrdersRes.json();
  const foundInCust = custOrders.find((o: any) => o.id === testOrderId);
  console.log('--- TEST 2A PASSED: Order found in customer order history:', Boolean(foundInCust));
  if (!foundInCust) throw new Error('Order not present in customer order history');

  // Verify order in admin order panel
  const adminOrdersRes = await fetch('http://localhost:3000/api/admin/orders', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminOrders = await adminOrdersRes.json();
  const foundInAdmin = adminOrders.find((o: any) => o.id === testOrderId);
  console.log('--- TEST 2B PASSED: Order found in admin orders list:', Boolean(foundInAdmin));
  if (!foundInAdmin) throw new Error('Order not present in admin orders panel');

  // 3. Test customer cancellation of another user's order (should fail with 403)
  const fakeUserCancelRes = await fetch(`http://localhost:3000/api/customer/orders/${testOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenUser2}`,
    },
    body: JSON.stringify({ reason: 'Malicious attempt' })
  });
  console.log('--- TEST 5 PASSED: Unauthorized cancellation rejected with status:', fakeUserCancelRes.status, '(expected 403)');
  if (fakeUserCancelRes.status !== 403) throw new Error('Unauthorized cancellation was not rejected with 403');

  // 4. Test customer cancellation of own eligible order
  const cancelRes = await fetch(`http://localhost:3000/api/customer/orders/${testOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Changed my mind' })
  });
  const cancelData = await cancelRes.json();
  console.log('--- TEST 3 PASSED: Cancel response message:', cancelData.message, '| Order status:', cancelData.order?.status);
  if (!cancelRes.ok || cancelData.order?.status !== 'cancelled') throw new Error('Cancellation failed');

  // Verify cancellation persisted in Neon database
  const neonOrderAfterCancel = await pool.query('SELECT status FROM orders WHERE id = $1', [testOrderId]);
  console.log('Status in Neon orders table after cancel:', neonOrderAfterCancel.rows[0].status);
  if (neonOrderAfterCancel.rows[0].status !== 'cancelled') throw new Error('Cancelled status not saved in Neon');

  // Verify stock restoration in Neon
  const afterCancelProd = await pool.query("SELECT stock FROM products WHERE id = 'fwn_prd_1791571838415_6k8u'");
  const postCancelStock = afterCancelProd.rows[0].stock;
  console.log('Stock after cancellation in Neon:', postCancelStock, '(expected:', initialStock, ')');
  if (postCancelStock !== initialStock) throw new Error('Stock was not properly restored in Neon');

  // 5. Test repeated cancellation (should be rejected and stock NOT restored again)
  const repeatCancelRes = await fetch(`http://localhost:3000/api/customer/orders/${testOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Repeat cancellation' })
  });
  console.log('--- TEST 6 PASSED: Repeat cancel rejected with status:', repeatCancelRes.status, '(expected 400)');
  const repeatCancelData = await repeatCancelRes.json();
  console.log('Repeat cancel error message:', repeatCancelData.error);
  if (repeatCancelRes.status !== 400) throw new Error('Repeat cancellation was not rejected');

  // Verify stock is STILL initialStock and was not incremented again
  const afterRepeatProd = await pool.query("SELECT stock FROM products WHERE id = 'fwn_prd_1791571838415_6k8u'");
  if (afterRepeatProd.rows[0].stock !== initialStock) throw new Error('Repeat cancel falsely modified stock');
  console.log('Stock after repeat cancel attempt remains unchanged:', afterRepeatProd.rows[0].stock);

  // 6. Test cancellation of dispatched order (should fail with 400)
  // Place second order with a suggestion city 'Lahore'
  const order2Res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      customerName: 'Taha Ibrar',
      customerEmail: 'tahasaroya369@gmail.com',
      customerPhone: '+92 300 1234567',
      shippingAddress: {
        fullName: 'Taha Ibrar',
        phone: '+92 300 1234567',
        addressLine1: 'Main Gulberg',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000'
      },
      items: [{ productId: 'fwn_prd_1791571838415_6k8u', quantity: 1 }],
      paymentMethod: 'cod',
      notes: 'Automated Test Order 2 (Dispatched)'
    })
  });
  const order2Data = await order2Res.json();
  const testOrderId2 = order2Data.order.id;
  console.log('--- TEST 7 PASSED: Order 2 placed with suggestion city Lahore:', order2Data.order.shippingAddress.city);

  // Mark order as dispatched via admin status update
  await fetch(`http://localhost:3000/api/admin/orders/${testOrderId2}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'dispatched' })
  });

  // Try to cancel the dispatched order
  const cancelDispatchedRes = await fetch(`http://localhost:3000/api/customer/orders/${testOrderId2}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Try to cancel dispatched' })
  });
  console.log('--- TEST 4 PASSED: Cancel dispatched order status:', cancelDispatchedRes.status, '(expected 400)');
  const cancelDispatchedData = await cancelDispatchedRes.json();
  console.log('Dispatched rejection error message:', cancelDispatchedData.error);
  if (cancelDispatchedRes.status !== 400) throw new Error('Dispatched order was allowed to be cancelled');

  // Clean up test orders from Neon
  await pool.query('DELETE FROM orders WHERE id = $1 OR id = $2', [testOrderId, testOrderId2]);
  // Restore stock for order 2
  await pool.query("UPDATE products SET stock = $1 WHERE id = 'fwn_prd_1791571838415_6k8u'", [initialStock]);
  console.log('--- ALL TESTS COMPLETED AND PASSED WITH FLYING COLORS! Test orders cleaned up.');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
