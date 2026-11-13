# AlumniLink
I built AlumniLink as a personal portfolio project using the IFQ636 MERN starter. It's a niche networking platform designed specifically for university graduates. The core workflow is straightforward: once an admin verifies a new user's graduation credentials, they unlock access to community boards to either request or offer professional help. To protect user privacy, contact details are only swapped if both parties mutually agree. This initial v1.0.0 release successfully implements these main user journeys from start to finish."

| Workflow | What happens | Roles |
| --- | --- | --- |
| **WF1 Verify a graduate** | A graduate registers, waits as Pending, and an admin approves or rejects the application with a reason. | Member, Admin |
| **WF2 Exchange help** | A verified member posts a Request or an Offer, other members respond, and the author accepts or declines each response. Emails are revealed only after acceptance. | Member |

---

## Features

**Members**
 Register with institution, degree, graduation year, student ID and a verification link, and give consent to store them
 See their application status (Pending, Verified or Not verified with the admin's reason) on their profile
 While Pending, see an anonymised overview of the boards: how many Requests and Offers are open in each field
 Once verified: browse the Requests and Offers boards (10 posts per page, newest first), open a post and respond once
 Create a Request or an Offer (title 5–80 characters, description 20–1000 characters, one of 8 fields)
 Accept or decline responses to their own posts; after accepting, both members see each other's email
 Change their name and email (graduation details are read-only once submitted, because an admin verifies them)

**Admins**
 See pending applications, oldest first, with a "Waiting N days" marker after two days
 Approve, or reject with a reason of at least 10 characters
 Every decision is written to an audit log that the app cannot edit

Admins cannot register through the app. The only way to create one is the seed script below.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 (Create React App), React Router 6, Tailwind CSS 3, Axios, Manrope font |
| Backend | Node.js, Express 4, JSON Web Tokens (24-hour tokens), bcrypt |
| Database | MongoDB Atlas, through Mongoose 6 |
| Tests | Mocha, Chai, Sinon, chai-http (72 tests) |
| Hosting | AWS EC2 (Ubuntu), Nginx as a reverse proxy, PM2 to keep the app running |

---

## How it fits together

```
Browser ──HTTP :80──> Nginx ──:5001──> Express (PM2) ──TLS──> MongoDB Atlas
                                         │
                                         ├── /api/...   → routes → middleware → controllers → models
                                         └── everything else → the built React app (frontend/build)
```

 In production, Express serves both the API and the React build, so the app and the API share one address. The frontend calls the API with relative URLs (`/api/...`), which means a new EC2 IP address does not need a rebuild.
 Every protected route runs the same access chain:
   `protect`: no token or an invalid token returns 401
   `requireRole`: the wrong role returns 403
   `requireApproved`: a member who is not yet verified returns 403
 The SysML diagrams (requirements, block definition, internal block, activity and state machine) are in the project handbook.

### Project structure

```
backend/
  config/        database connection
  controllers/   auth, admin, post and response logic
  middleware/    protect, requireRole, requireApproved
  models/        User, Post, Response, AuditLog
  routes/        /api/auth, /api/admin, /api/posts, /api/responses
  scripts/       seedAdmin.js
  test/          Mocha tests, one file per feature
  utils/         post options and validation
frontend/
  src/pages/       one file per screen
  src/components/  Navbar, BoardOverview
  tailwind.config.js   colour and font tokens
```

---

## Run it on your computer

### 1. What you need

 Node.js 22 (`node -v` should show v22.x)
 Git
 A MongoDB Atlas cluster and its connection string

### 2. Get the code and install packages

```bash
git clone https://github.com/DaisyQUT/taskmanagerv1.git
cd taskmanagerv1
npm run install-all
```

### 3. Add your settings

Copy `backend/.env.example` to `backend/.env` and fill in your own values:

| Name | What it is |
| --- | --- |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string used to sign login tokens |
| `PORT` | `5001` |
| `ADMIN_EMAIL` | The email for the admin account |
| `ADMIN_PASSWORD` | The admin's password |

Never commit `backend/.env`. It is already listed in `.gitignore`.

### 4. Create the admin account

```bash
npm run seed:admin --prefix backend
```

### 5. Start the app

```bash
npm run dev
```

The frontend opens at http://localhost:3000 and the API runs at http://localhost:5001.

### 6. Run the tests

```bash
cd backend
npm test
```

The tests stub the database, so they do not need a connection to Atlas.

---

## Deploy to AWS EC2

These steps assume an Ubuntu EC2 instance, an SSH key (`.pem`) kept **outside** the project folder, and a security group with inbound rules for HTTP (80) and SSH (22) limited to your own IP (`x.x.x.x/32`). Do not use `0.0.0.0/0`.

### First deployment

1. Connect to the server:
   ```bash
   ssh -i path/to/your-key.pem ubuntu@<EC2 public IP>
   ```
2. Install Node.js 22, Git, Nginx and PM2 (`sudo npm install -g pm2`).
3. Get the code, install packages and build the frontend:
   ```bash
   git clone https://github.com/DaisyQUT/taskmanagerv1.git alumnilink
   cd alumnilink
   npm run install-all
   nano backend/.env          
   npm run build --prefix frontend
   ```
4. Start the API with PM2, and make it start again after a reboot:
   ```bash
   cd backend
   pm2 start server.js --name alumnilink
   pm2 save
   pm2 startup               
5. Point Nginx at the app. Create `/etc/nginx/sites-available/alumnilink`:
   ```nginx
   server {
       listen 80;
       server_name _;

       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
   Then enable it:
   ```bash
   sudo ln -s /etc/nginx/sites-available/alumnilink /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```
6. Open `http://<EC2 public IP>` in a browser.

### Deploy a new version

```bash
cd ~/alumnilink
git pull
npm run install-all
npm run build --prefix frontend
pm2 restart alumnilink
```

### After the instance restarts

The public IP usually changes when an EC2 instance is stopped and started. Nothing needs rebuilding:

1. In the AWS console, copy the new **Public IPv4 address**.
2. If your own IP has also changed, add new `/32` rules for ports 80 and 22.
3. Open `http://<new IP>`. PM2 has already restarted the app.

---

## Project management

 **Jira** (project key ALN): epics, user stories with acceptance criteria and story points, two sprints, and a burndown chart for each sprint.
 **Git**: one feature branch per Jira issue (for example `feature/ALN-20-accept-decline`), commit messages that start with the Jira key, and a pull request for every merge into `main`.
 **Figma**: low-fidelity wireframes for both workflows and a clickable high-fidelity prototype of WF1 for both roles.
 **Evidence**: screenshots of every requirement running on EC2, named after their Jira issue (for example `ALN-11_decision-on-ec2.png`), are referenced in the traceability matrix in the project handbook.

---

## Known limitations (v1.0.0)

- **No HTTPS or domain name.** The app runs on plain HTTP at the EC2 public IP, so the browser shows "Not secure".
- **The address changes.** The EC2 public IP changes after each stop and start, and inbound rules allow only listed IPs.
 **Two admins at the same moment.** A decision checks that the application is still Pending and then saves it. If two admins decide the same application at exactly the same time, both can succeed (decision D10). With one or two admins this is unlikely.
**Not built yet (Should or Could priority):**
   resubmitting a rejected application (R6)
   closing or expiring a post (R13)
   extra profile fields (R14)
   an insights dashboard (R15)
   reporting a post (R16)
   account deletion (R17)
   a first-post prompt (R18)
   a screen for reading the audit log (R7)
   a limit on pending responses (R10)
 **Verification is manual.** An admin relies on the link the graduate provides; there is no certificate upload and no email notification.
 **Starter leftovers.** The starter's task files (`models/Task.js`, `routes/taskRoutes.js`, `pages/Tasks.jsx`, `TaskForm.jsx`, `TaskList.jsx`) are still in the repository. The task routes are not connected to the server, so the Tasks page does not work.

---

## Version history

| Version | Date | Notes |
| --- | --- | --- |
| 1.0.0 | November 2026 | WF1 and WF2 complete, deployed on EC2, 72 tests passing |
