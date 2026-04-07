# 🔬 Lab Management System

A professional management system for research laboratories built with **React** (Frontend) and **PHP** (Backend). This platform allows researchers, team leaders, and lab directors to manage scientific productions, track workflows, and generate performance reports.

## 🚀 Features

- **Authentication System:** Secure login and registration with academic grade validation.
- **Dynamic Dashboards:** Tailored interfaces for Researchers and Team Leaders.
- **Production Management:** Full CRUD operations for Articles, Conferences, and Theses.
- **Workflow Tracking:** Real-time status updates (Pending, Validated, Rejected) with feedback from team leaders.
- **Statistics & Reports:** Visual data representation and PDF report generation.
- **ORCID Integration:** Automatic formatting and validation of ORCID iDs.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Bootstrap 5, React Router 6.
- **Backend:** PHP 8 (PDO), MySQL.
- **Styling:** Custom CSS (Glassmorphism design).

## 📁 Project Structure

```text
lab_management/
├── lab-backend/     # PHP API files & Database connection
├── lab-frontend/    # React project (Vite)


Setup

### 1. Backend Setup
1. Move the entire project folder to your local server directory (e.g., `C:/xampp/htdocs/lab_management`).
2. Open `lab-backend/db.php` and ensure the database credentials match your local MySQL settings:
   ```php
   $host = '192.227.248.68';
   $dbname = 'db_lab';
   $username = 'lab_user'; 
   $password = 'lab123';     
   ```


### 2. Frontend Setup
1. Open your terminal and navigate to the frontend folder:
   ```bash
   cd lab-frontend
   ```
2. Install the necessary dependencies (node_modules folder will be generated ) :
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application via the link provided in the terminal (usually `http://localhost:5173`).

