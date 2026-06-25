# Techstack Requirement

# HR-CRM Platform Technology Stack

## Frontend

### Framework
- React.js

### Build Tool
- Vite

### Language
- JavaScript (or TypeScript)

### Styling
- Tailwind CSS

### UI Components
- shadcn/ui

### Icons
- Lucide React

### State Management
- Zustand

### API Communication
- Axios

### Form Handling
- React Hook Form

### Validation
- Zod

---

## Backend & Database

### Platform
- Supabase

Responsibilities:

- Authentication (Supabase Auth)
- Database (PostgreSQL)
- Storage (Supabase Storage)
- Complex Logic (Supabase Edge Functions)
- Row Level Security (RLS) policies

Reason:

- Native SDK integration replaces custom API layer
- Eliminates Express.js boilerplate
- Scalable, serverless architecture

---

## Authentication

### JWT Authentication

Roles:

- Admin
- Employee
- Candidate

Features:

- Login
- Logout
- Password Reset
- Role-Based Access Control (RBAC)

---

## File Storage

### Cloudinary

Stores:

- Resumes
- Certificates
- Candidate Documents

Alternative:

- AWS S3

---

## Email Service

### Resend

Used For:

- Candidate notifications
- Password resets
- Interview invitations

Alternative:

- SendGrid

---

## Search System

### Phase 1

PostgreSQL Full Text Search

Filters:

- Skills
- Experience
- Location
- Education
- Notice Period

### Phase 2

ElasticSearch

---

## Hosting

### Frontend

- Vercel

### Backend

- Render
- Railway

### Database

- Supabase PostgreSQL

### File Storage

- Cloudinary

---

## Monitoring

- Sentry
- LogRocket

---

## Security

- bcrypt Password Hashing
- JWT Refresh Tokens
- HTTPS
- API Rate Limiting

---

## Recommended Folder Structure

src/
├── assets/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── store/
├── utils/
├── routes/
├── context/
└── App.jsx

---

## Why This Stack

The HR-CRM platform requires:

- Role-based dashboards
- Large candidate databases
- Resume and document management
- Advanced search and filtering
- Reporting and analytics
- Scalable recruitment workflows

React + Vite + Express + PostgreSQL + Prisma + Cloudinary provides a modern, scalable, and production-ready foundation for the platform.
