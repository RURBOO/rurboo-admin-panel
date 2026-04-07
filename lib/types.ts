import { Timestamp } from "firebase/firestore";

export interface Driver {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    phone?: string;
    photoURL?: string;
    role?: string; // 'rider', 'admin', 'driver'
    rating?: number;
    totalRides?: number;
    status: 'verified' | 'pending' | 'suspended' | 'blocked';
    verificationStatus?: 'approved' | 'pending' | 'rejected';
    verified?: boolean;
    age?: number;
    gender?: string;
    emergencyContactPhone?: string;
    vehicleDetails?: {
        model: string;
        number: string;
        type: string;
    };
    vehicleType?: string;
    vehicleNumber?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    licenseNumber?: string;
    address?: string; // Added address
    isActive?: boolean;
    isOnline?: boolean;
    walletBalance?: number;
    pendingCommission?: number;
    createdAt?: Timestamp;
    currentLocation?: {
        latitude: number;
        longitude: number;
        lastUpdated?: Timestamp;
    };
    lastLocation?: {
        latitude: number;
        longitude: number;
        lastUpdated?: Timestamp;
    };
    location?: {
        latitude: number;
        longitude: number;
    };
    updatedAt?: Timestamp;
    updatedBy?: string;
    licenseImage?: string;
    licenseStatus?: 'pending' | 'approved' | 'rejected';
    licenseRejectionReason?: string;

    rcImage?: string;
    rcStatus?: 'pending' | 'approved' | 'rejected';
    rcRejectionReason?: string;

    profileImage?: string;
    profileStatus?: 'pending' | 'approved' | 'rejected';
    profileRejectionReason?: string;

    vehicleImage?: string;
    vehicleStatus?: 'pending' | 'approved' | 'rejected';
    vehicleRejectionReason?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
    role?: string; // e.g. 'rider', 'admin'
    rating?: number;
    totalRides?: number;
    isBlocked?: boolean;
    blockedBy?: string | null;
    blockedAt?: Timestamp | null;
    blockedReason?: string | null;
    walletBalance?: number; // Added walletBalance
    address?: string;
    createdAt?: Timestamp;
    currentLocation?: {
        latitude: number;
        longitude: number;
        lastUpdated?: Timestamp;
    };
}

export interface Ride {
    id: string;
    driverId?: string;
    userId: string;
    pickupAddress?: string;
    destinationAddress?: string;
    pickupLocation?: {
        address: string;
        latitude: number;
        longitude: number;
    };
    pickupLoc?: {
        address: string;
        coordinates?: any;
    };
    dropLocation?: {
        address: string;
        latitude: number;
        longitude: number;
    };
    status: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
    fare: number;
    finalFare?: number;
    commission?: number;
    distance?: string;
    duration?: string;
    otp?: string;
    vehicleCategory?: string;
    userName?: string;
    driverName?: string;
    cancelReason?: string;
    timestamp: Timestamp | string; // Adjusting timestamp as it can be assigned a string in useRides.ts
    createdAt?: Timestamp;
}

export interface AdminUser {
    uid: string;
    email: string;
    role: 'super_admin' | 'support' | 'finance';
}
