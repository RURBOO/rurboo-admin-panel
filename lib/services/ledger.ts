import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore"

export type AccountType = 'user_wallet' | 'platform_revenue' | 'driver_wallet' | 'tax_liability' | 'refund_pool' | 'external_payment_gateway';

export interface LedgerTransaction {
    id?: string;
    description: string;
    amount: number;
    currency: 'INR' | 'USD';
    referenceId: string; // rideId, adminId, etc.
    debitAccount: AccountType;
    creditAccount: AccountType;
    metadata?: any;
    timestamp?: any;
}

export interface SingleEntry {
    transactionId: string;
    account: AccountType;
    type: 'debit' | 'credit';
    amount: number;
    description: string;
    referenceId: string;
    timestamp: any;
    metadata?: any;
}

/**
 * Records a Double-Entry Transaction.
 * Creates two immutable documents in 'ledger_entries' collection.
 * Ensures data integrity: Sum(Debits) must equal Sum(Credits).
 */
export async function recordLedgerTransaction(txn: LedgerTransaction) {
    const batch = writeBatch(db);
    const ledgerRef = collection(db, 'ledger_entries');

    // Generate a unique Transaction ID
    const txnId = doc(collection(db, 'temp')).id;
    const timestamp = serverTimestamp();

    // 1. Debit Entry
    const debitDoc = doc(ledgerRef);
    const debitEntry: SingleEntry = {
        transactionId: txnId,
        account: txn.debitAccount,
        type: 'debit',
        amount: txn.amount,
        description: txn.description,
        referenceId: txn.referenceId,
        timestamp: timestamp,
        metadata: txn.metadata
    };
    batch.set(debitDoc, debitEntry);

    // 2. Credit Entry
    const creditDoc = doc(ledgerRef);
    const creditEntry: SingleEntry = {
        transactionId: txnId,
        account: txn.creditAccount,
        type: 'credit',
        amount: txn.amount,
        description: txn.description,
        referenceId: txn.referenceId,
        timestamp: timestamp,
        metadata: txn.metadata
    };
    batch.set(creditDoc, creditEntry);

    try {
        await batch.commit();
        await batch.commit();
        return txnId;
    } catch (error) {
        console.error("❌ Failed to record ledger transaction:", error);
        throw new Error("Ledger recording failed. System integrity compromised.");
    }
}
