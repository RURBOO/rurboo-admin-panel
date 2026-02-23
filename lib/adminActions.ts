import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type AdminActionType =
    | 'block_user'
    | 'unblock_user'
    | 'suspend_driver'
    | 'approve_driver'
    | 'create_admin'
    | 'delete_admin'
    | 'update_pricing'
    | 'wallet_adjustment'
    | 'document_verify'
    | 'document_reject'

export interface AdminActionLog {
    adminId: string
    adminEmail: string
    action: AdminActionType
    targetType: 'user' | 'driver' | 'admin' | 'pricing'
    targetId: string
    targetName: string
    reason?: string
    metadata?: Record<string, any>
}

export async function logAdminAction(
    action: AdminActionLog
): Promise<void> {
    try {
        await addDoc(collection(db, "adminActions"), {
            ...action,
            timestamp: serverTimestamp()
        })
    } catch (error) {
        console.error("Error logging admin action:", error)
        // Don't throw - logging failure shouldn't break the main action
    }
}

export async function logUserBlock(
    adminId: string,
    adminEmail: string,
    userId: string,
    userName: string,
    reason?: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: 'block_user',
        targetType: 'user',
        targetId: userId,
        targetName: userName,
        reason
    })
}

export async function logUserUnblock(
    adminId: string,
    adminEmail: string,
    userId: string,
    userName: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: 'unblock_user',
        targetType: 'user',
        targetId: userId,
        targetName: userName
    })
}

export async function logDriverSuspend(
    adminId: string,
    adminEmail: string,
    driverId: string,
    driverName: string,
    reason?: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: 'suspend_driver',
        targetType: 'driver',
        targetId: driverId,
        targetName: driverName,
        reason
    })
}

export async function logDriverApprove(
    adminId: string,
    adminEmail: string,
    driverId: string,
    driverName: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: 'approve_driver',
        targetType: 'driver',
        targetId: driverId,
        targetName: driverName
    })
}

export async function logWalletAdjustment(
    adminId: string,
    adminEmail: string,
    targetType: 'user' | 'driver',
    targetId: string,
    targetName: string,
    amount: number,
    type: 'recharge' | 'deduct',
    reason?: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: 'wallet_adjustment',
        targetType,
        targetId,
        targetName,
        reason,
        metadata: {
            amount,
            type,
            adjustmentType: type
        }
    })
}

export async function logDocumentVerification(
    adminId: string,
    adminEmail: string,
    driverId: string,
    driverName: string,
    docType: string,
    status: 'verify' | 'reject',
    reason?: string
): Promise<void> {
    await logAdminAction({
        adminId,
        adminEmail,
        action: status === 'verify' ? 'document_verify' : 'document_reject',
        targetType: 'driver',
        targetId: driverId,
        targetName: driverName,
        reason,
        metadata: {
            docType,
            status
        }
    })
}
