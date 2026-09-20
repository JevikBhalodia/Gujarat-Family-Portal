# Gujarat Family Scheme Portal (ગુજરાત કુટુંબ યોજના પોર્ટલ)

A comprehensive portal where a family (One Family ID, managed by the Head) finds government schemes it is eligible for, applies with instant 7-step checklist verification, tracks applications, consults an FAQ bot with authority escalation, and where department officers monitor analytics and revoke entitlements.

---

## Architecture & Tech Stack
- **Frontend:** React SPA (Vite), Mobile-first responsive UI (top desktop navbar, bottom mobile navigation), English + Gujarati bilingual labels (`translations.js`), Lucide icons.
- **Backend:** Spring Boot 3 (Java 21 + Maven), REST API, Spring Security + JJWT auth in `httpOnly` secure cookies & Bearer tokens, Multipart file uploads, CORS protection.
- **Database:** JPA / Hibernate entities with H2 (PostgreSQL compatibility mode) file persistence for zero-setup instant local demo execution, and seamless switch to production PostgreSQL via `application.properties`.
- **Audit:** Minimal-token `CHANGES.log` tracking modifications for fast AI and regulatory auditing.

---

## Folder Structure
```
gujarat-portal/
├── CHANGES.log                  # Compact audit log
├── README.md                    # Setup & documentation
├── package.json                 # Monorepo scripts (Spring Boot + React)
├── server/                      # Spring Boot 3 Application (Java 21 + Maven)
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/gov/gujarat/portal/
│       │   │   ├── GujaratPortalApplication.java
│       │   │   ├── config/             # SecurityConfig, WebConfig, DataInitializer
│       │   │   ├── controller/         # Auth, Me, Family, Scheme, Application, Document, Query, Admin, Health
│       │   │   ├── entity/             # 12 JPA Entities (Family, Member, Scheme, Application, Document, etc.)
│       │   │   ├── repository/         # Spring Data JPA Repositories
│       │   │   ├── security/           # JwtAuthenticationFilter, UserPrincipal
│       │   │   ├── service/            # Eligibility, ApplicationPipeline, Family, Verifier, Query, Analytics, Audit
│       │   │   └── util/               # JwtUtil
│       │   └── resources/
│       │       └── application.properties # H2 / PostgreSQL, JWT, uploads config
│       └── test/java/gov/gujarat/portal/
│           ├── GujaratPortalApplicationTests.java
│           ├── AuthAndSchemeTests.java
│           └── ApplicationPipelineTest.java
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # Protected route definitions
        ├── index.css            # Responsive design system styles
        ├── i18n/
        │   └── translations.js  # English & Gujarati dictionary
        ├── context/
        │   ├── AuthContext.jsx  # User session & permission state
        │   └── LanguageContext.jsx # Gujarati/English switcher
        ├── api/
        │   └── client.js        # Universal fetch wrapper
        ├── components/
        │   ├── Navbar.jsx       # Top desktop navbar & bottom mobile tab bar
        │   ├── SchemeCard.jsx   # Live eligibility card
        │   ├── ChecklistResult.jsx # 7-step pipeline visualizer
        │   ├── StatusBadge.jsx  # Eligible, Maybe, Not Eligible, Active, Expired, Revoked
        │   ├── ChatWidget.jsx   # Scheme bot with 'Raise to Authority'
        │   ├── MemberRow.jsx    # Member row with head controls
        │   └── ApprovalCard.jsx # Pending requests card
        └── pages/
            ├── Login.jsx        # OTP login with 1-click demo role selector
            ├── family/
            │   ├── SchemesPage.jsx      # Schemes list with live eligibility & search
            │   ├── ApplicationsPage.jsx # Active, expired, attempts & queries tabs
            │   ├── ManageFamilyPage.jsx # Head-only member & request management
            │   └── ProfilePage.jsx      # KYC status & document locker
            └── admin/
                ├── AdminAnalytics.jsx   # Metrics, charts, failed checks & awareness gap
                ├── AdminLookup.jsx      # Family code search & revoke with mandatory reason
                └── AdminQueries.jsx     # Escalated inquiries inbox & reply form
```

---

## Quickstart

### 1. Install & Build
```bash
# Server (Spring Boot - builds & runs tests automatically)
cd server
mvn clean test

# Client
cd ../client
npm install
```

### 2. Run Locally
In terminal 1 (Spring Boot Backend):
```bash
# Option A: From root directory
mvn -pl server spring-boot:run

# Option B: Navigate into server/
cd server
mvn spring-boot:run
```
- Runs on: `http://localhost:8080`
- Health check: `http://localhost:8080/health`
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/gujarat_portal`, User: `sa`, Password: empty)

In terminal 2 (React Client):
```bash
# From root
npm run client
# Or directly inside client/
cd client && npm run dev
# Runs on http://localhost:5173
```

---

## Pre-Seeded Demo Accounts (Mock OTP: `123456`)

| Role | Mobile | Name | Description |
|---|---|---|---|
| **Family Head** | `9876543210` | Ramesh Patel | Full control, manages members, adds daughter, applies for schemes |
| **Member (Apply)** | `9876543211` | Geeta Patel | Adult member with permission to view & apply |
| **Member (View)** | `9876543212` | Bhavesh Patel | Adult member with view-only permission (apply is blocked) |
| **Admin (Health)** | `9998887771` | Officer Sharma | Dept of Health & Family Welfare officer (Analytics, MA Scheme lookup, Revoke) |
| **Admin (Women & Child)** | `9998887772` | Officer Joshi | Dept of Women & Child Development officer (Vahali Dikri, Ganga Swarupa) |

---

## Demo Script Walkthrough
1. **Login as Head (`9876543210`)**:
   - Navigate to **Schemes** -> notice schemes dynamically tagged as *Eligible*, *Action Required*, or *Not Eligible*.
   - Open **Manage Family** -> Add a daughter under 18 -> system requires birth certificate details -> once added, return to Schemes and notice **Vahali Dikri Yojana** immediately becomes eligible!
2. **7-Step Apply Pipeline**:
   - Click **Apply Now** on a scheme -> if documents are missing, an interactive modal shows the exact failing check.
   - Go to **Profile**, upload the required certificate into the **Document Locker**, and re-apply -> all 7 checks pass and application is created!
   - Attempting to apply again immediately triggers duplicate prevention.
3. **Chatbot & Authority Escalation**:
   - Open any scheme modal -> ask a question in the assistant.
   - Click **Raise to Department Authority** -> query is officially escalated.
4. **Officer Review & Revocation**:
   - Switch account to **Health Admin (`9998887771`)**.
   - Review the **Analytics** dashboard (active vs expired, failed checks, and awareness gap).
   - Go to **Queries Inbox** and send an official response to the citizen.
   - Go to **Family Lookup**, enter `GJ-AHM-00101`, view enrolled applications, and click **Revoke Application**.
   - Input the mandatory revocation reason -> the application immediately transitions to expired (revoked).
