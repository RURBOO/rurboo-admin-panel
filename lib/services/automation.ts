import { db } from "@/lib/firebase"
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"

export interface AutomationRule {
    id: string;
    name: string;
    trigger: 'high_risk_score';
    threshold: number;
    action: 'suspend_driver' | 'flag_review';
}

const ACTIVE_RULES: AutomationRule[] = [
    {
        id: 'RULE-001',
        name: 'Auto-Suspend High Risk',
        trigger: 'high_risk_score',
        threshold: 50, // User defined > 50
        action: 'suspend_driver'
    }
];

/**
 * Evaluates rules against a specific entity.
 * Returns true if an action was taken.
 */
export async function evaluateAutomationRules(entityId: string, entityType: 'driver' | 'user', metrics: { riskScore: number }) {

    for (const rule of ACTIVE_RULES) {
        if (rule.trigger === 'high_risk_score' && metrics.riskScore > rule.threshold) {
            if (rule.action === 'suspend_driver' && entityType === 'driver') {
                await executeSuspendAction(entityId, rule.name);
                return true;
            }
        }
    }
    return false;
}

async function executeSuspendAction(driverId: string, ruleName: string) {
    try {
        // 1. Suspend Driver
        await updateDoc(doc(db, "drivers", driverId), {
            status: 'suspended',
            suspensionReason: `Automated: ${ruleName}`,
            updatedAt: serverTimestamp()
        });

        // 2. Create Audit Log (System Action)
        await addDoc(collection(db, "admin_audit_logs"), {
            action: 'AUTO_SUSPEND',
            targetId: driverId,
            actor: 'SYSTEM_AUTOMATION',
            timestamp: serverTimestamp(),
            metadata: { rule: ruleName }
        });
    } catch (error) {
        console.error("Failed to execute automation:", error);
    }
}
