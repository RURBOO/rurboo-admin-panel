const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'rurboo-app' });
const db = admin.firestore();
async function check() {
  const doc = await db.collection('config').doc('rates').get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
check().catch(console.error);
