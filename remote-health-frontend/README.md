# Remote Health Monitoring System - Frontend

This is the frontend application for the Remote Health Monitoring System, a platform designed to help patients track their health metrics and enable healthcare providers to monitor patients remotely, manage clinical overviews, and facilitate communication.

---

## ⚡️ What's New?

- **Clinical Overview Dashboard:** A new dashboard for Doctors and Admins (`/health-records`) providing advanced patient filtering, prioritization based on alert severity, and basic analytics charts.
- **Enhanced Patient List:** Patient cards on the `/patients` page now include direct links to "View Details" and "Send Message" (using correct `user_id` for messaging).
- **Code Cleanup:** Removed numerous `console.log` statements across the application for a cleaner codebase. `console.error` and `console.warn` are preserved for debugging.
- **Backend API Dependency:** The application now strictly requires a fully working backend API for all features. Mock data has been removed.
- **Improved Error Handling:** User-friendly error messages are shown if backend endpoints are unreachable or return errors.

---

## Key Features

*   **User Authentication:** Secure login and registration for patients, doctors, and admins.
*   **Role-Based Dashboards:**
    *   **Patient View (`/dashboard`):** Displays personal health overview, latest vital signs, recent alerts, functionality to add new vitals, and links to full vitals history.
    *   **Doctor/Admin View (`/dashboard`):** Summarizes system-wide data (total patients, critical anomalies, active alerts), shows health records activity charts, lists recent system alerts, and provides a basic patient data table with links to patient details.
    *   **Clinical Overview Dashboard (`/health-records`):** Advanced dashboard for Doctors/Admins featuring:
        *   Filtering patients by alarm severity and chronic diseases.
        *   Prioritized patient list based on alert status.
        *   Visual analytics like alert distribution charts.
*   **Patient Management (Doctor/Admin):**
    *   List all patients (`/patients`) with search (name/email) and direct links to details/messaging.
    *   View detailed patient information, vital signs history, alerts, and notes (`/patients/:id`).
    *   Add medical notes for patients.
*   **Messaging:** Real-time messaging interface between users (e.g., Patient-Doctor).
*   **Alerts Management:** View all system alerts (`/alerts`, `/anomalies`) and patient-specific alerts.
*   **Profile & Settings:**
    *   Patients can view/update their profile information.
    *   General application settings.
*   **Role-Based Access Control (RBAC):** Different UI elements and routes are accessible based on user roles.
*   **Charting:** Utilizes Chart.js for visualizing health data (vital trends, activity statistics, alert distributions).

---

## Backend API Requirements

**This frontend application will not function correctly without a compatible backend.**
The backend must provide a comprehensive set of API endpoints as detailed in the services directory (`/src/services/`) and summarized in the latest **Backend Development Guidelines prompt** (provided separately to the backend team).

Key expectations include:

-   **Authentication:** All protected endpoints must require and validate a JWT token (`Authorization: Bearer <token>`).
-   **Data Fetching:** Endpoints for fetching patients (with potential for advanced filtering as per recent discussions), patient details, vital signs, alerts (patient-specific and all), messages, chat partners, and user profiles.
-   **Data Submission:** Endpoints for user login/registration, sending messages, adding patient notes, and submitting new vital signs.
-   **Error Handling:** Consistent use of HTTP status codes (e.g., `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`) and clear JSON error responses (e.g., `{"detail": "Error message"}`).
-   **Empty Data:** For requests that result in no data (e.g., a patient with no alerts), return `200 OK` with an empty array (`[]`) in the response body where applicable.

**Refer to the detailed "Backend Development Guidelines" prompt for specific endpoint paths, request/response schemas, and advanced filtering/sorting capabilities required for optimal frontend performance and functionality (especially for the Clinical Overview Dashboard).**

---

## Troubleshooting Common Issues

-   **"Patient profile not found or an issue occurred while fetching it."**
    -   The backend endpoint `/api/v1/patient-records/me` (or its equivalent for fetching the current user's patient profile) might be returning a 404 or another error. Ensure this endpoint correctly returns 404 for not found or 200 with profile data. A 422 error from a GET request usually indicates a backend logic issue.
-   **"Failed to fetch vital signs history" / "Failed to fetch alerts for patient" etc.**
    -   The respective backend endpoints (e.g., `/api/v1/patient-records/{id}/vitals`, `/api/v1/alerts/patient/{patientId}`) might be down, not implemented, or returning an unexpected error. Check backend logs.
-   **Messaging Issues (404 Not Found / 422 Unprocessable Entity):**
    *   `GET /api/v1/messaging/messages/{partner_id}` (404): Ensure `partner_id` corresponds to a valid `User.id` in the backend and that a conversation exists or is handled gracefully.
    *   `POST /api/v1/messaging/messages` (422): Check if the request body matches backend expectations (e.g., `receiver_id` vs `receiverId`). The backend should expect `receiver_id`.
-   **CORS Errors (Cross-Origin Resource Sharing):**
    -   Ensure your backend server's CORS policy is configured to accept requests from the frontend origin (default: `http://localhost:3000`). This includes allowing necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS) and headers (e.g., `Authorization`, `Content-Type`).
-   **Data Mismatches / TypeErrors (e.g., "Cannot read properties of undefined"):**
    -   Verify that the data structure returned by the backend API matches the TypeScript types defined in the frontend (`src/types/`). For instance, if the frontend expects `patient.user_id` but the backend sends `patient.userId`, this will cause issues.

---

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <your_frontend_repository_url>
    cd remote-health-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    - The application expects the backend API to be running at `http://localhost:8000/api/v1`. This is configured in `src/config.ts`. If your backend runs on a different URL, update this file.

4.  **Backend Setup & CORS:**
    - This frontend application **requires a running backend service** that implements the API endpoints detailed in the "Backend API Requirements" section and the separate "Backend Development Guidelines" prompt.
    - **CORS:** The backend server must be configured to accept requests from the frontend origin (default: `http://localhost:3000`).

---

## Project Structure Overview

```
remote-health-frontend/
├── public/             # Static assets (favicon, manifest.json, etc.)
├── src/
│   ├── api/            # (Potentially for auto-generated API clients if using OpenAPI/Swagger)
│   ├── components/     # Reusable UI components (Layout, Sidebar, Header, icons, cards, etc.)
│   ├── contexts/       # React Context providers (e.g., AuthContext for authentication state)
│   ├── pages/          # Page-level components (DashboardPage, LoginPage, ClinicalOverviewDashboardPage, etc.)
│   ├── services/       # Modules for interacting with backend APIs (authService, patientService, etc.)
│   ├── types/          # TypeScript type definitions (patient.ts, alert.ts, auth.ts, message.ts, etc.)
│   ├── App.tsx         # Main application component with routing structure
│   ├── config.ts       # Application configuration (e.g., API_URL)
│   ├── index.css       # Global CSS styles or Tailwind base styles
│   ├── index.tsx       # Entry point of the React application
│   └── ...             # Other files (setupTests for testing, reportWebVitals, etc.)
├── .env                # Environment variables (if any, typically not committed)
├── .gitignore          # Files and folders to be ignored by Git
├── package.json        # Project dependencies and npm scripts (start, build, test)
├── README.md           # This file: Project overview, setup, and guidelines
└── tsconfig.json       # TypeScript compiler configuration
```

---

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
