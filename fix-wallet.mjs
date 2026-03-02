import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBf9BPX-iiSdLVgRCH_H-LZ91vgVx5ar9w",
    authDomain: "rurboo-prod.firebaseapp.com",
    projectId: "rurboo-prod",
    storageBucket: "rurboo-prod.firebasestorage.app",
    messagingSenderId: "417302943554",
    appId: "1:417302943554:android:3b318b6f80b47877425adb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Fetching drivers to check wallet history...");
    const driversCol = collection(db, "drivers");
    const snap = await getDocs(driversCol);

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.walletBalance > 0) {
            console.log(`\nDriver: ${data.name} (Bal: ${data.walletBalance})`);
            const historyCol = collection(doc(db, "drivers", docSnap.id), "walletHistory");
            const historySnap = await getDocs(historyCol);

            if (historySnap.empty) {
                console.log(`->  Missing history! Creating manual Admin Top-Up entry for ₹${data.walletBalance}...`);
                const newDoc = doc(historyCol);
                await setDoc(newDoc, {
                    amount: data.walletBalance,
                    type: "credit",
                    description: "Manual Add (Firebase Console)",
                    createdAt: serverTimestamp()
                });
                console.log(`->  Done.`);
            } else {
                console.log(`->  History already exists (${historySnap.size} entries). Skipping.`);
            }
        }
    }
    console.log("\nComplete.");
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
