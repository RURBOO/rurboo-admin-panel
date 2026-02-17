# Rurboo Admin Panel

The centralized administrative dashboard for the Rurboo ride-hailing platform. Built with Next.js 15, React 19, and Firebase.

## 🚀 Features

### **Driver Management**
- **List & Filter**: View all drivers or filter by status (Active, Suspended, Blocked, Pending).
- **Verification**: Review and approve/reject driver documents (License, Registration, etc.).
- **Status Control**: Suspend or block drivers for policy violations.
- **Detailed Profiles**: Access comprehensive driver info, ride history, and vehicle details.

### **User Management**
- **User Directory**: Search and manage all registered users.
- **Access Control**: Block/Unblock users as needed.
- **History**: View user ride history and total spend.

### **Ride Monitoring**
- **Live Map**: Real-time tracking of active drivers and ongoing rides using Google Maps.
- **Ride History**: Detailed logs of all completed and cancelled rides with fare breakdown.

### **Communication**
- **Notification Center**: Send push notifications to specific users, drivers, or segments (e.g., "All Active Users").
- **Audit Logs**: Track important admin actions like suspensions and blocks.

### **Finance & Settings**
- **Pricing Configuration**: Manage base fares, per-km rates, and surge pricing.
- **Admin Roles**: Manage permissions for different admin users.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Db**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Functions)
- **Deployment**: Firebase Hosting & Cloud Functions

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project with Firestore and Auth enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RURBOO/rurboo-admin-panel.git
    cd rurboo-admin-panel
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Firebase and Google Maps keys:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📦 Build & Deploy

This project is configured for **Firebase Hosting** with efficient Next.js server-side rendering support.

### Build
To create a production build:
```bash
npm run build
```

### Deploy
To deploy the latest version to your live URL:
```bash
firebase deploy
```

## 📁 Project Structure

```
/app
  /dashboard       # Main dashboard routes (protected)
    /drivers       # Driver management pages
    /users         # User management pages
    /rides         # Ride history
    /map           # Live map view
    /notifications # Notification center
  /login           # Admin login page
/components
  /ui              # Reusable UI components (buttons, cards, etc.)
  /layout          # Sidebar, Header, etc.
/features          # Feature-specific hooks and logic
/lib
  firebase.ts      # Firebase initialization
  types.ts         # TypeScript interfaces
  utils.ts         # Helper functions
```

## 🛡️ Admin Access

Admin accounts must be created directly in Firebase Console or via a script. Ensure the user document in the `admins` collection (if applicable) has the correct role.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---
© 2026 Rurboo Technologies. All rights reserved.
