const admin = require('firebase-admin');
admin.initializeApp({ projectId: "vision-perfumes" });
const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('users').get();
  console.log("Total users:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
check().catch(console.error);
