# Mentora — Learning Management System

**Mentora** is a full-stack Learning Management System (LMS) built with **Next.js, Strapi v5, and PostgreSQL**. It provides role-based access control, course and lesson management, student enrollment, persistent progress tracking, auto-graded quizzes, an admin dashboard, and a draft/publish blogging system.

The application is designed around strict backend-enforced permissions so that each user can only access the resources and actions allowed by their role.

---

## 🚀 Live Demo

### Frontend

**Vercel:**
https://mentora-iota-murex.vercel.app/

### Backend API

**Railway:**
https://mentora-production-2a27.up.railway.app

---

## 🔐 Demo Accounts

The deployed application includes pre-configured accounts for testing each role.

| Role                | Username          | Password | Access                                                 |
| ------------------- | ----------------- | -------- | ------------------------------------------------------ |
| **Admin**           | `admin`           | `123456` | Full platform access, user and role management         |
| **Content Manager** | `content_manager` | `123456` | Course, lesson, quiz and blog management               |
| **Instructor**      | `instructor`      | `123456` | Manage owned courses, lessons and quizzes              |
| **Student**         | `student`         | `123456` | Browse, enroll, learn, track progress and take quizzes |

> **Note:** These credentials are provided for demonstration purposes only.

---

# 🛠️ Tech Stack

### Frontend

* **Next.js** — App Router
* **TypeScript**
* **Tailwind CSS**
* **DaisyUI**

### Backend

* **Strapi v5** — Headless CMS & REST API
* **JWT Authentication**
* **Custom Controllers / Policies** for backend authorization

### Database

* **PostgreSQL**
* **Neon DB**

### Deployment

* **Frontend:** Vercel
* **Backend:** Railway
* **Database:** Neon

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │     Frontend        │
                    │   Vercel Hosting    │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │     Strapi v5       │
                    │   Backend / CMS     │
                    │  Railway Hosting    │
                    └──────────┬──────────┘
                               │
                               │ Database Queries
                               ▼
                    ┌─────────────────────┐
                    │    PostgreSQL       │
                    │      Neon DB        │
                    └─────────────────────┘
```

The frontend communicates with Strapi through REST APIs. Authentication and authorization are enforced on the backend, while the frontend dynamically adapts the UI based on the authenticated user's role.

---

# 👥 Role-Based Access Control

Mentora uses four roles with different permissions:

| Feature                    | Admin | Content Manager |   Instructor  | Student |
| -------------------------- | :---: | :-------------: | :-----------: | :-----: |
| Manage users & roles       |   ✅   |        ❌        |       ❌       |    ❌    |
| Create/edit/delete courses | ✅ All |      ✅ All      |     ✅ Own     |    ❌    |
| Manage lessons             | ✅ All |      ✅ All      | ✅ Own courses |    ❌    |
| Create/manage quizzes      | ✅ All |      ✅ All      | ✅ Own courses |    ❌    |
| View student progress      | ✅ All |      ✅ All      | ✅ Own courses |  ✅ Own  |
| Manage blog posts          | ✅ All |      ✅ Own      |       ❌       |    ❌    |
| Enroll in courses          |   ❌   |        ❌        |       ❌       |    ✅    |
| Take quizzes               |   ❌   |        ❌        |       ❌       |    ✅    |

### Backend Authorization

Permissions are not enforced only through frontend UI restrictions.

Restricted operations are validated on the **Strapi backend**, ensuring that a user cannot bypass permissions by directly calling the API.

For example:

* An instructor can only modify courses they own.
* Students cannot create or modify courses.
* Only admins can modify user roles.
* Draft blog posts cannot be accessed through public/student-facing endpoints.
* Students can only access their own enrollment and progress information.

---

# ✨ Features

## 1. Authentication & RBAC

* User registration and login
* JWT-based authentication
* Four application roles:

  * Admin
  * Content Manager
  * Instructor
  * Student
* Protected frontend routes
* Backend authorization using Strapi policies/controllers
* Role-based navigation and UI
* Ownership-based authorization for instructor resources

---

## 2. Course Management

### Admin & Content Manager

* Create courses
* Edit courses
* Delete courses
* Manage courses across the platform
* Add and manage lessons
* Add quizzes to courses

### Instructor

* Create courses
* Edit owned courses
* Delete owned courses
* Manage lessons belonging to owned courses
* Create and manage quizzes for owned courses
* View student progress for owned courses

### Lessons

Each course can contain multiple lessons.

Lessons support:

* Text-based content
* Video URLs
* Ordered lesson viewing

---

## 3. Student Enrollment

Students can:

* Browse available courses
* View course details
* Enroll in courses
* Access enrolled courses through **My Courses**
* View lessons in sequence

Enrollment data is persisted in the database and remains available across sessions.

---

## 4. Progress Tracking

Mentora tracks lesson completion for each student individually.

Students can:

* Mark lessons as completed
* View course completion percentage
* Continue learning after refreshing or returning later

### Progress Calculation

For example:

```text
Completed Lessons = 3
Total Lessons     = 5

Progress = (3 / 5) × 100
         = 60%
```

Progress is calculated per **student + course** and persisted in PostgreSQL.

---

## 5. Quiz System & Auto-Grading

Courses can contain multiple-choice quizzes.

### Quiz Features

* MCQ questions
* Multiple answer options
* Correct answer configuration
* Automatic grading
* Immediate score calculation
* Quiz attempt persistence
* Historical results available to students

### Example

```text
Total Questions: 10
Correct Answers: 8

Score: 80%
```

The correct answers are validated on the backend rather than relying solely on client-side calculations.

---

## 6. Admin Dashboard

The admin dashboard provides platform-wide management.

### User Management

Admins can:

* View users
* Change user roles
* Promote/demote users
* Manage platform access

### Platform Statistics

The dashboard provides high-level statistics including:

* Total users
* Users by role
* Total courses
* Total enrollments

### Content Management

Admins can manage:

* All courses
* All lessons
* All quizzes
* All blog posts

---

## 7. Blog System

Mentora includes a simple content publishing workflow.

### Content Manager & Admin

Users with appropriate permissions can:

* Create blog posts
* Edit posts
* Add cover image URLs
* Save posts as drafts
* Publish posts
* Delete posts

### Draft / Published Workflow

```text
Create Post
     │
     ▼
   Draft
     │
     │ Publish
     ▼
 Published
     │
     ▼
Public / Student Blog
```

Draft posts remain hidden from public/student-facing pages.

Only published posts are available to readers.

---

# 🔄 Example Data Flow

A typical student progress update follows this flow:

```text
Student
   │
   │ Mark Lesson Complete
   ▼
Next.js Frontend
   │
   │ POST / API Request
   ▼
Strapi Backend
   │
   ├── Authenticate User
   ├── Validate Student Role
   ├── Validate Enrollment
   └── Update Progress
   │
   ▼
PostgreSQL / Neon
   │
   │ Updated Progress
   ▼
Strapi Response
   │
   ▼
Next.js
   │
   ▼
Updated Progress UI
```

This ensures progress is associated with the correct student and course and persists across sessions.

---

# 🚀 Deployment

### Frontend — Vercel

The Next.js frontend is deployed on Vercel.

The frontend uses an environment variable pointing to the deployed Strapi API.

### Backend — Railway

The Strapi backend is deployed on Railway and connected to the PostgreSQL database hosted on Neon.

Production secrets and database credentials are configured through Railway environment variables.

### Database — Neon

PostgreSQL is hosted using Neon and is accessed by the Strapi backend through the configured database connection string.

---

# 🧪 Testing the Application

For a complete demonstration, test the application using the four provided roles.

### Student Flow

```text
Login
  ↓
Browse Courses
  ↓
Enroll
  ↓
My Courses
  ↓
Open Course
  ↓
Complete Lessons
  ↓
Track Progress
  ↓
Take Quiz
  ↓
View Score
```

### Instructor / Content Manager Flow

```text
Login
  ↓
Create Course
  ↓
Add Lessons
  ↓
Create Quiz
  ↓
Manage Content
  ↓
View Student Progress
```

### Admin Flow

```text
Login
  ↓
Admin Dashboard
  ↓
View Platform Statistics
  ↓
Manage Users
  ↓
Change User Roles
  ↓
Manage Platform Content
```

### Blog Flow

```text
Create Blog Post
       ↓
      Draft
       ↓
    Publish
       ↓
Public Blog
```

---

# 📌 Project Highlights

The project focuses particularly on:

* Strict role-based authorization
* Backend-enforced permissions
* Resource ownership validation
* Persistent student progress
* Automated quiz grading
* Admin-level platform management
* Draft/publish content workflow
* REST API communication between Next.js and Strapi
* PostgreSQL data persistence
* Production deployment using Vercel and Railway

---

# 🎯 Conclusion

Mentora demonstrates a complete LMS workflow covering authentication, authorization, content management, learning progress, assessments, administration, and publishing.

The project was built with a focus on **clean separation between frontend and backend responsibilities, secure backend authorization, persistent data management, and production deployment**.
