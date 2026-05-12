import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore(app);

async function checkOrders() {
  const snapshot = await db.collection('orders')
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('No orders found.');
    return;
  }

  snapshot.forEach(doc => {
    console.log('Order ID:', doc.id);
    console.log('Data:', JSON.stringify(doc.data(), null, 2));
  });
}

checkOrders().catch(console.error);
