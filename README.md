# Mentora — Learning Management System (LMS)

Mentora is a full-stack Learning Management System (LMS) built with Next.js, Strapi CMS, and PostgreSQL (Neon DB). The platform features strict role-based access control (RBAC), course content management, automated progress tracking, auto-graded MCQ quizzes, an interactive admin control panel, and a draft/publish blogging system.

---

## 🚀 Live Demo & Deployed URLs

* **Frontend (Vercel):** [https://mentora-iota-murex.vercel.app/](https://mentora-iota-murex.vercel.app/)[cite: 1]
* **Backend API (Railway):** [https://mentora-production-2a27.up.railway.app](https://mentora-production-2a27.up.railway.app)[cite: 1]

---

## 🔑 Demo Accounts

You can log into the platform using any of the following pre-configured test credentials:

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `123456` | Full platform control, user role management, system stats, content override.[cite: 1] |
| **Content Manager** | `content_manager` | `123456` | Platform-wide course & lesson creation, full blog system management (draft/publish).[cite: 1] |
| **Instructor** | `instructor` | `123456` | Create/edit/delete owned courses, manage owned lessons & quizzes, track student progress.[cite: 1] |
| **Student** | `student` | `123456` | Browse courses, enroll, watch/read lessons, track progress, take auto-graded quizzes.[cite: 1] |

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, DaisyUI[cite: 1]
* **Backend / CMS:** Strapi v5 (Headless CMS)[cite: 1]
* **Database:** PostgreSQL (Hosted on Neon DB)
* **Hosting & Infrastructure:** 
  * Frontend: Vercel[cite: 1]
  * Backend: Railway[cite: 1]

---

## ✨ Features Implemented

### 1. Authentication & Role-Based Access Control (RBAC)
* Strict JWT authentication with multi-role access (Admin, Content Manager, Instructor, Student).[cite: 1]
* Route protection at both Next.js middleware level and Strapi API Controller/Policy level.[cite: 1]
* Dynamic navigation and UI rendering based on active role permissions.[cite: 1]

### 2. Course & Content Management
* **Course Creation & Editing:** Admins and Content Managers manage all courses; Instructors manage only their owned courses.[cite: 1]
* **Lesson Builder:** Supports text-based lessons and embedded video player URLs.[cite: 1]

### 3. Student Enrollment & Progress Tracking
* **Course Enrollment:** One-click course enrollment tracked per student.[cite: 1]
* **"My Courses" Dashboard:** Displays enrolled courses alongside real-time completion percentages.[cite: 1]
* **Persisted Progress:** Lessons can be marked as complete; completion data persists across sessions.[cite: 1]

### 4. Quiz System with Auto-Grading
* Multiple-choice questions (MCQs) attached to specific courses.[cite: 1]
* Real-time automated grading upon quiz submission.[cite: 1]
* Quiz attempt history and scores stored per student.[cite: 1]

### 5. Admin Dashboard & Platform Analytics
* User management panel to change roles (Promote/Demote users dynamically).[cite: 1]
* High-level platform statistics (total users per role, course count, total enrollments).[cite: 1]
* Global management of all courses, lessons, and blog posts.[cite: 1]

### 6. Blog Engine (Draft vs. Published)
* Rich-text blog creation with cover image support.[cite: 1]
* Draft and Published state toggling (Drafts remain hidden from public/students).[cite: 1]
* Public blog reading page for published posts.[cite: 1]