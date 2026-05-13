
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDHZpR1Rs6e-LHIyUA7Nye4McC366kMe_U',
  authDomain: 'vision-perfumes.firebaseapp.com',
  projectId: 'vision-perfumes',
  storageBucket: 'vision-perfumes.firebasestorage.app',
  messagingSenderId: '115132444742',
  appId: '1:115132444742:web:7cbcafabca3ee6985a9a47'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getProducts() {
  const s = await getDocs(collection(db, 'products'));
  const products = s.docs.map(d => ({id: d.id, ...d.data()}));
  console.log(JSON.stringify(products));
}

getProducts();
