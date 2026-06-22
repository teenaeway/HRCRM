# HR-CRM Project Analysis & Memory Bank

## Overview
HR-CRM is a recruitment and workforce management platform designed to connect four major stakeholders: Admin (HR Company), Employees (Recruiters), Clients (Companies hiring candidates), and Candidates (Job Seekers). The goal is to centralize recruitment operations, eliminating the need for scattered spreadsheets and emails.

## Technology Stack
- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS (with predefined tokens/variables in `index.css` and `style.css`)
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Node.js + Express.js
- **Database**: Prisma ORM (currently mapped to SQLite `dev.db`, although PostgreSQL is requested in PRD)
- **Authentication**: JWT & bcryptjs
- **File Uploads**: Multer (configured for local or Cloudinary as per PRD)

## Project Architecture

### 1. Frontend (`/frontend`)
The frontend is a Vite-powered React application with the following core directories inside `src/`:
- **`components/`**: Reusable UI elements (likely including shadcn/ui components).
- **`layouts/`**: Core layouts (e.g., Sidebar, Navbar for different roles).
- **`pages/`**: Contains the main views segmented by role:
  - `admin/`: Admin views (`Dashboard.jsx`, `Clients.jsx`, `Employees.jsx`, `Notices.jsx`, `Reports.jsx`, `Settings.jsx`)
  - `public/`: Publicly accessible pages (`UnifiedLogin.jsx`, etc.)
- **`routes/`**: Handles application routing (`AppRoutes.jsx`).
- **`services/`**: API handlers, typically using Axios (`api.js`).
- **`store/`**: Global state management with Zustand (`authStore.js`).

### 2. Backend (`/backend`)
The backend is an Express application structured with the following:
- **`src/app.js` & `src/index.js`**: Application entry points and Express configuration.
- **`src/controllers/`**: Business logic layer (e.g., `client.controller.js`, `auth.controller.js`, `candidate.controller.js`, `employee.controller.js`).
- **`src/routes/`**: API route definitions mapping to controllers.
- **`src/middleware/`**: Custom middleware (e.g., JWT authentication in `auth.middleware.js`).
- **`src/utils/`**: Utility functions and Prisma client instantiations.
- **`prisma/`**: Contains `schema.prisma` mapping out `Admin`, `Employee`, `Candidate`, `Client`, `CandidateDocument`, `ActivityLog`, and `Notice`.

## Core Features
1. **Role-Based Authentication**: Admin, Employee, Candidate logins handled via JWT.
2. **Client Management (Admin)**: Add, edit, assign recruiters to clients. *Note: We recently updated the `industry` field to `recruitmentPositionRequired`*.
3. **Employee Management (Admin)**: Creating recruiter accounts and monitoring their activities.
4. **Candidate Pipeline**: Tracking candidates from Registration to Joined/Closed. Resumes and documents can be managed.
5. **Notice/Announcement Board**: Admins can broadcast notices to employees.

## Recent Changes Logged in Memory
- Replaced the `industry` column in `schema.prisma` (Client model) with `recruitmentPositionRequired`.
- Re-generated Prisma Client and verified changes across `client.controller.js` and frontend `Clients.jsx`.

> [!NOTE]
> This file serves as a persistent memory map. By reading this artifact, the system understands the overall architecture without needing to manually `list_dir` or read the PRDs again.
