# AlumniConnect

AlumniConnect is an alumni networking platform for a college community (built around NIT Jamshedpur). It gives students a verified way to find alumni, ask for referrals, and get AI help with their resume, career plan, and interviews. Alumni use it to post openings, respond to referral requests, mentor students, and earn recognition for contributing. Admins get user management, content moderation, and a placement analytics dashboard.

Everyone signs up with their official college email, so the network stays verified.

## What's inside

### Accounts and verification
Registration is restricted to `@nitjsr.ac.in` emails. New accounts confirm their address with a one-time code (OTP) the first time they log in; after that, logins are normal. Google sign-in is also supported and skips the code since Google already proves the email. Users are classified as Student or Alumni automatically from their graduation year, and there's a third Admin role. Sessions use JWT.

### Profiles
Students fill in their university, major, skills, GitHub/portfolio links, projects, and can upload a resume PDF. Alumni add their company, role, industry, experience, department, skills, and LinkedIn. Anyone can open anyone else's profile, so alumni can look up a student who requested a referral and students can read up on an alumnus before reaching out.

### Finding alumni
The directory supports search and filters (username, company, role, industry, department, graduation year, skills) and ranks results instead of just listing them — it weighs skill overlap with the searcher, the alumnus's referral success rate, how responsive they are, and how well their company matches. Alumni without a completed profile still show up. Students also get a "recommended alumni" list based on their own skills and career target.

### Referrals and opportunities
Alumni post opportunities with the company, role, eligibility, required skills, deadline, CTC, and an application link. The board has live (debounced) search and advanced filters, and students see opportunities recommended by their skills. When the same opening is posted by several alumni, the ones from more senior, higher-contributing, more successful referrers are shown first.

Referral requests are tracked through their whole lifecycle (Pending, Reviewed, Referred, Interviewing, Hired, Rejected). Alumni manage incoming requests from an inbox and update the outcome; students track their sent requests and see a status timeline; alumni can also manage their own postings (edit, hide, delete). Notifications link straight to the relevant posting.

### AI career assistant
This part runs on Google Gemini:
- Resume analyzer: uploads a PDF and returns an ATS score, missing keywords, a skill-gap summary, and concrete fixes.
- Resume builder: a structured editor that exports a clean PDF.
- Message writer: drafts referral requests, connection notes, and follow-ups.
- Career guidance: given a target role and company, it suggests skills to learn, certifications, learning resources, project ideas, and a month-by-month roadmap.
- Interview prep: generates likely questions by round with difficulty levels and notes on what the interviewer is looking for.

### Connections
Users can send connection requests, and the recipient accepts or ignores them, similar to LinkedIn. There's a network page for pending requests and existing connections, and both sides get notified.

### Contribution points and leaderboard
Alumni earn points for posting opportunities and for how far their referrals progress, which maps to tiers (Bronze through Diamond). The leaderboard shows the top contributors and pins your own rank at the bottom if you're not in the top list.

### Notifications
There's an in-app notification bell that refreshes on its own. Notifications are also mirrored to email — if SMTP isn't configured the email is just logged to the server console, so the feature works locally without a mail provider.

### Analytics
A placement analytics dashboard covers overview KPIs plus referral, job, alumni, company, placement, salary, and skills breakdowns, with a few AI-generated insights, filters, and CSV/print export. Sensitive numbers like headcounts and individual rosters are only shown to admins; aggregate stats are visible to everyone.

### Admin
Admins can search users, change roles, and delete accounts (which cleans up their related data), hide or remove opportunities, and see recent platform activity.

## Tech stack

Frontend is React 19 with Vite, React Router, Tailwind CSS v4, Axios, and lucide-react, plus `@react-oauth/google` for Google sign-in.

Backend is Node/Express 5 with MongoDB (Mongoose), JWT and bcrypt for auth, Multer for uploads, and Nodemailer for email. AI features call Google Gemini through `@google/generative-ai`. Resume text is pulled with `pdf-parse`.

## Project layout

```
AlumniConnect/
├── client/                 React + Vite frontend
│   └── src/
│       ├── api/            axios instance
│       ├── components/     navbar, charts, connect button, etc.
│       ├── context/        auth context
│       ├── hooks/          useAuth, useDebounce
│       └── pages/          auth, onboarding, opportunities, referrals,
│                           career, directory, profile, connections,
│                           analytics, admin, landing
└── server/                 Express + MongoDB backend
    ├── scripts/            makeAdmin.js, testEmail.js
    └── src/
        ├── config/         db connection
        ├── controllers/    request handlers
        ├── middleware/     protect (jwt), adminOnly, upload
        ├── models/         mongoose schemas
        ├── routes/         api routes
        └── services/       ai, email, notifications, contribution, pdf
```

## Running it locally

You'll need Node 18+, a MongoDB database, a Google Gemini API key, and a Google OAuth client ID. SMTP credentials are optional.

Backend:

```
cd server
npm install
npm start
```

Frontend:

```
cd client
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and expects the API on http://localhost:5000.

## Environment variables

`server/.env`:

```
MONGO_URI=...
JWT_SECRET=...
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...

# optional — leave these out to keep email in console-only mode
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=AlumniConnect <you@gmail.com>
CLIENT_URL=http://localhost:5173
```

`client/.env`:

```
VITE_GOOGLE_CLIENT_ID=...
```

## Helper scripts

From the `server` folder:

```
node scripts/makeAdmin.js you@nitjsr.ac.in   # promote a user to Admin
node scripts/testEmail.js you@example.com    # send a test email to check SMTP
```

There's no admin sign-up flow, so promoting a user with the first script is how you get access to the admin dashboard.
