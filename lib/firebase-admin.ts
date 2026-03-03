import * as admin from "firebase-admin";

// Prevent re-initialization on hot reload in development
if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        // Decode from base64 and parse
        const serviceAccount = JSON.parse(
            Buffer.from(serviceAccountJson, "base64").toString("utf8")
        );
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        // Fallback: Use Application Default Credentials or environment config
        // This works if deployed on Google Cloud (Cloud Run, App Engine, etc.)
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
