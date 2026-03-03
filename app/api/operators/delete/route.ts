import { NextRequest, NextResponse } from "next/server";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";

function getAdminApp() {
    if (getApps().length > 0) return getApps()[0];

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(
            Buffer.from(serviceAccountJson, "base64").toString("utf8")
        );
        return initializeApp({ credential: cert(serviceAccount) });
    }
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { operatorId, requestingAdminId } = body;

        if (!operatorId) {
            return NextResponse.json(
                { success: false, error: "Missing operatorId" },
                { status: 400 }
            );
        }

        // Prevent deleting yourself
        if (operatorId === requestingAdminId) {
            return NextResponse.json(
                { success: false, error: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        const adminApp = getAdminApp();
        const adminDb = getFirestore(adminApp);

        // Get operator info for audit log before deleting
        const operatorDoc = await adminDb.collection("admins").doc(operatorId).get();
        const operatorData = operatorDoc.data();

        // Prevent deleting another super_admin
        if (operatorData?.role === "super_admin") {
            return NextResponse.json(
                { success: false, error: "Cannot delete a super admin account" },
                { status: 403 }
            );
        }

        // ✅ Delete Firestore document — this removes panel access immediately
        await adminDb.collection("admins").doc(operatorId).delete();

        // ✅ Try to delete Firebase Auth user if service account is configured
        // If not configured, the Firestore delete is sufficient since panel access
        // is gated on the admins collection.
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            try {
                const { getAuth } = await import("firebase-admin/auth");
                await getAuth(adminApp).deleteUser(operatorId);
            } catch (authError: any) {
                // Log but don't fail — document is already deleted
                console.warn("Could not delete Firebase Auth user:", authError.message);
            }
        }

        // Log admin action
        await adminDb.collection("adminActions").add({
            adminId: requestingAdminId || "system",
            action: "delete_admin",
            targetType: "admin",
            targetId: operatorId,
            targetName: operatorData?.name || "Unknown",
            metadata: { email: operatorData?.email, role: operatorData?.role },
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            message: "Operator deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete operator error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete operator" },
            { status: 500 }
        );
    }
}
