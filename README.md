# 🌟 GoWord Academy — Modern Full-Stack English Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.23-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Admin_v14-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_1.5_%2F_2.0-8E75C2?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Deepgram](https://img.shields.io/badge/STT-Deepgram_Nova--2-13EF93?style=for-the-badge)](https://deepgram.com/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-45ba4b?style=for-the-badge&logo=playwright)](https://playwright.dev/)

An enterprise-ready, full-stack educational web platform and Progressive Web Application (PWA) engineered for language academies. **GoWord Academy** provides a unified environment for interactive English grammar learning, multi-modal quiz generation, acoustic speech assessment, real-time AI conversational tutoring, and comprehensive teacher grading.

---

## 🏛️ System Architecture & Experience Models

The platform is designed around strict separation of roles while sharing a unified, real-time cloud database:

```mermaid
graph TD
    Admin[Academy Administration] -->|Provisions Accounts| DB[(Cloud Firestore)]
    
    subgraph Security & Authentication
        TeacherAuth[Teacher Credentials: Username + PIN]
        StudentAuth[Student Credentials: Username/ID + PBKDF2 Password]
        SessionEngine[Signed HTTP-Only Session Cookies]
    end

    subgraph Teacher Experience
        TDash[Teacher Dashboard & Live Analytics]
        LBuilder[Visual Lesson Builder]
        AGen[Gemini AI Question & Audio Generator]
        ReviewEngine[Submission Evaluation & Score Override]
    end

    subgraph Student Experience
        Browse[Teacher & Lesson Browser]
        QuizRunner[Unified Quiz Runner]
        PronEng[Speech & Pronunciation Practice]
        GrammarHub[12 Interactive Grammar Modules]
    end

    Admin -.-> TeacherAuth
    Admin -.-> StudentAuth
    TeacherAuth --> TDash
    StudentAuth --> Browse
```

---

## 🔐 1. Invitation-Based Authentication System

To safeguard institutional integrity and prevent unauthorized public access, **GoWord Academy strictly disables public registration**.

* **Teacher Authentication**:
  - Teachers are provisioned exclusively by academy administrators.
  - Authenticate using their assigned username and credentials.
  - Access is restricted to teacher portals (`/teacher/*`).
* **Student Authentication**:
  - Students cannot self-register; student profiles and access codes (`studentId`) are created by administration.
  - Students log in using their **Student Identifier/Username** and **Password**.
  - **Server-Side Verification**: Passwords are securely hashed using **PBKDF2 with SHA-512** and individual cryptographically secure 128-bit salts.
  - **Session Management**: Authenticated sessions are issued via signed HTTP-only cookies (`goword_student_session`), preventing client-side session tampering and unauthorized impersonation.
  - **Firestore Security Rules**: Direct client-side creation or deletion of student documents is explicitly denied (`allow create, update, read, delete: if false;`), routing all authorization through trusted backend endpoints.

---

## 📚 2. Core Functional Modules

### A. Teacher Authoring & Review Portal
1. **Interactive Lesson Builder**: Full lifecycle management of lessons (Draft vs. Published, maximum attempt caps, immediate vs. after-review answer disclosures).
2. **Six Comprehensive Activity Types**:
   - **Options / True-False**: Multiple-choice with explanations and point weighting.
   - **Reading Comprehension**: Rich text passages bound to targeted reading queries.
   - **Writing & Speaking (Unified)**: Students choose between typing or dictating answers; AI provides multi-dimensional rubrics (Grammar, Vocabulary, Sentence Structure, Topic Relevance).
   - **AI Audio Listening**: Generates synthetic audio prompts with comprehension questions.
   - **AI Conversational Dialogue**: Turn-by-turn conversational exercises with real-time speech-to-text powered by Deepgram.
   - **Acoustic Pronunciation Practice**: Multi-word phoneme training with targeted phonetic feedback.
3. **Teacher Gradebook & Analytics**:
   - Glanceable KPI dashboard displaying active enrolled students, total attempts, and pending manual reviews.
   - Item-level grading interface with automated AI score auditing and teacher overrides.

### B. Student Learning Portal
1. **Teacher & Course Discovery**: Browse certified academy instructors and their published lesson portfolios.
2. **Unified Assessment Engine**: Seamless, autosaving quiz experience with countdown timers, client-side draft recovery, and instant feedback.
3. **12 Complete English Grammar Modules**:
   - Complete guides for all 12 tenses: *Present Simple/Continuous/Perfect/Perfect Continuous, Past Simple/Continuous/Perfect/Perfect Continuous, Future Simple/Continuous/Perfect/Perfect Continuous*.
   - Bilingual explanations (Arabic & English) with explanatory drill quizzes.
4. **Bilingual RTL / LTR User Interface**: Native RTL layout with Tajawal typography for Arabic learners and strict LTR typography for English exercise prompts.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15.5 (Turbopack) | App Router, Server Components & Dynamic Route Handlers |
| **UI Library** | React 19.1 & Tailwind CSS v4 | Dark-theme optimized design system, Lucide Icons, Drag & Drop Kit |
| **Backend** | Node.js Runtime | Secure Next.js API Routes, Cryptographic PBKDF2 Hashing |
| **Database** | Firebase Firestore & Admin SDK v14 | Cloud NoSQL with granular Role-Based Access Control (RBAC) rules |
| **Artificial Intelligence** | Google Gemini 1.5 / 2.0 | Automated question synthesis, rubric scoring, and conversation generation |
| **Speech-to-Text** | Deepgram Nova-2 API | Sub-second audio transcription for interactive speaking tests |
| **Testing** | Node Test Runner & Playwright | 180+ Unit Tests and End-to-End browser test automation suites |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ (v24 recommended)
- **Firebase Project**: With Firestore and Storage enabled
- **Google Gemini API Key**: For AI tutoring and question generation
- **Deepgram API Key**: For real-time speech recognition

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/goword-academy.git
cd goword-academy

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

Fill in the required Firebase and AI keys in `.env.local`:
```ini
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
SESSION_SECRET=your_32_character_random_secret

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
...
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Provisioning Users (Academy Administration)
To seed initial invited student and teacher accounts:
```bash
node --env-file=.env.local scripts/manage-users.ts
```

---

## 🧪 Testing & Quality Assurance

GoWord Academy maintains strict quality standards across all layers:

### Static Type Checking & Linting
```bash
# Static type verification (Strict TypeScript)
npx tsc --noEmit

# Code quality and style linting
npm run lint
```

### Unit Tests
Executes unit tests covering password cryptography, authentication contracts, pronunciation rules, scoring policies, and session state transitions:
```bash
npm run test:unit
```

### End-to-End (E2E) Browser Tests
Executes Playwright tests verifying role authorization, invalid credential rejections, authenticated student profiles, and multi-modal quiz flows:
```bash
npm run test:e2e
```

### Production Build Verification
```bash
npm run build
```

---

## 🛡️ Security & Privacy

1. **Invitation-Only Model**: Public sign-ups are disabled across all endpoints.
2. **Cryptographic Password Storage**: Uses PBKDF2 with SHA-512, 100,000 iterations, and random 128-bit per-user salts.
3. **Session Hardening**: Signed HTTP-Only, SameSite=Lax cookies for student sessions.
4. **Cloud Firestore Rules**: Enforces strict document-level permissions; students cannot view peers' submissions or modify account records.
5. **Zero Credential Leaks**: All client-side secrets are isolated behind server route handlers.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
