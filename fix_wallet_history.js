const admin = require('firebase-admin');

// Ensure you have the service account key in the same directory or set GOOGLE_APPLICATION_CREDENTIALS
// We'll use the existing Rurboo-admin-panel initialization if possible, or application default credentials.
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

async function run() {
  const db = admin.firestore();
  
  // Need to ask user for the exact driver ID or find it.
  // First, let's list drivers with negative commission that might have been topped up
  const driversRef = db.collection('drivers');
  const snapshot = await driversRef.get();
  
  console.log("Found drivers. Checking wallet balances...");
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.walletBalance > 0) {
      console.log(`Driver ID: ${doc.id} - Name: ${data.name} - Phone: ${data.phone} - Wallet: ${data.walletBalance}`);
    }
  });
}

run().catch(console.error);
