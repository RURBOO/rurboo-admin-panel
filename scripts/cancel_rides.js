const admin = require('firebase-admin');

// Read the credentials safely. The app uses GOOGLE_APPLICATION_CREDENTIALS if available.
// If it fails, fallback to simple projectId if testing locally against emulator or generic DB
try {
  admin.initializeApp({
      credential: admin.credential.applicationDefault()
  });
} catch (e) {
  admin.initializeApp({ projectId: 'rurboo-app' }); // Replace if project name is different
}

async function cancelStaleRides() {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('rideRequests')
            .where('status', 'in', ['pending', 'accepted', 'arrived', 'in_progress'])
            .get();

        if (snapshot.empty) {
            console.log('No stale rides found.');
            return;
        }

        const batch = db.batch();
        let count = 0;
        snapshot.forEach(doc => {
            console.log('Cancelling ride:', doc.id);
            batch.update(doc.ref, { status: 'cancelled' });
            count++;
        });

        await batch.commit();
        console.log(`Cancelled ${count} stale rides.`);
    } catch (e) {
        console.error('Error fetching/canceling rides:', e);
    }
}

cancelStaleRides().catch(console.error);
