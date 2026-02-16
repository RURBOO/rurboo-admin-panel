import { Timestamp } from "firebase/firestore";

export interface Driver {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role?: string; // 'rider', 'admin', 'driver'
    rating?: number;
    totalRides?: number;
    status: 'active' | 'pending' | 'suspended' | 'blocked';
    verificationStatus?: 'approved' | 'pending' | 'rejected';
    vehicleDetails?: {
        model: string;
        number: string;
        type: string;
    };
    isActive?: boolean;
    walletBalance?: number;
    createdAt?: Timestamp;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role?: string; // e.g. 'rider', 'admin'
    rating?: number;
    totalRides?: number;
    isBlocked?: boolean;
    createdAt?: Timestamp;
}

export interface Ride {
    id: string;
    driverId?: string;
    userId: string;
    pickupLocation: {
        address: string;
        latitude: number;
        longitude: number;
    };
    dropLocation: {
        address: string;
        latitude: number;
        longitude: number;
    };
    status: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
    fare: number;
    distance?: string;
    duration?: string;
    otp?: string;
    timestamp: Timestamp;
}

export interface AdminUser {
    uid: string;
    email: string;
    role: 'super_admin' | 'support' | 'finance';
}
