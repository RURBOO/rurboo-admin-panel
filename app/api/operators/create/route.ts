import { NextRequest, NextResponse } from "next/server";

// This route ONLY creates the Firebase Auth user via REST API.
// No Firebase Admin SDK = No credentials needed!
// The Firestore document is written client-side using the admin's auth session.

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: email, password, name" },
                { status: 400 }
            );
        }
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "Firebase API key not configured" },
                { status: 500 }
            );
        }

        // ✅ Create Firebase Auth user via REST API (zero credentials needed)
        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    displayName: name,
                    returnSecureToken: false,
                }),
            }
        );

        const authData = await authResponse.json();

        if (!authResponse.ok || authData.error) {
            const msg = authData.error?.message || "Failed to create user";
            if (msg.includes("EMAIL_EXISTS")) {
                return NextResponse.json(
                    { success: false, error: "An account with this email already exists. Use a different email." },
                    { status: 409 }
                );
            }
            if (msg.includes("WEAK_PASSWORD")) {
                return NextResponse.json(
                    { success: false, error: "Password is too weak. Use at least 8 characters." },
                    { status: 400 }
                );
            }
            return NextResponse.json({ success: false, error: msg }, { status: 400 });
        }

        // Return the UID to the client — client will write Firestore doc
        return NextResponse.json({
            success: true,
            uid: authData.localId,
            email: authData.email,
        });
    } catch (error: any) {
        console.error("Create operator error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Server error" },
            { status: 500 }
        );
    }
}
