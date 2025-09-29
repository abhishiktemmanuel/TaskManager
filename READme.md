# Task Manager

## Project Overview

Task Manager is a full-stack web application designed to streamline task management and team collaboration. It provides a robust platform for team leads (Admins) to manage projects and for team members to track their progress and meet deadlines. The application features a two-tiered user system with different access levels, secure authentication, and a clean, intuitive interface.

## Key Features

- **User Roles**: Two distinct user roles: **Admins** (team leads) and **Users** (team members).
- **User Authentication**: Secure user registration and login with encrypted passwords (`bcrypt`) and JWT for API authentication.
- **Admin Privileges**: Admins can invite new users, assign tasks to any team member, and manage all tasks within their team.
- **Task Management**: All users can create, view, update, and delete their own tasks.
- **Task Filtering & Reporting**: Admins can generate and download reports on user progress and task status, providing valuable insights into team performance.
- **Protected Routes**: API routes are protected using JWT to ensure only authenticated users can access them.

---

## Tech Stack

The project is built using a modern, scalable technology stack.

**Frontend**:

- **React** + **Vite** with **TypeScript**
- **React Router DOM** for client-side routing
- **Axios** for API requests
- **Tailwind CSS** for a streamlined and responsive user interface

**Backend**:

- **Nest.js** with **TypeScript**
- **TypeORM** for database interactions
- **bcrypt** for password encryption
- **JSON Web Token (JWT)** for secure authentication

**Database**:

- **PostgreSQL**

---

## Getting Started

This project uses Docker to provide a consistent development environment. Follow these steps to get the application up and running on your local machine.

### Prerequisites

- [**Docker**](https://www.docker.com/products/docker-desktop)
- [**Docker Compose**](https://docs.docker.com/compose/)

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/abhishiktemmanuel/TaskManager.git](https://github.com/abhishiktemmanuel/TaskManager.git)
    cd TaskManager
    ```
2.  **Start the containers:** From the root of the project directory, run the following command. This will build the Docker images and start the frontend, backend, and PostgreSQL database services.
    ```bash
    docker compose up --build
    ```
3.  **Access the application:** Once the services are running, open your web browser and navigate to:
    ```
    http://localhost
    ```

### Initial Admin Setup

Upon the first run, the backend will automatically create an initial admin account. An admin invite token will be printed in the backend logs, which is valid for 24 hours. Use this token to register an admin user with the required credentials. Subsequent users can be invited by this admin.

---

## API Documentation

The backend API is accessible at **`http://localhost:3000/api`**.

Key endpoints include:

- **Authentication**: `/auth/register`, `/auth/login`
- **User Management**: `/users`, `/users/:id`
- **Task Management**: `/tasks`, `/tasks/:id`
- **Reports**: `/reports/users/export`, `/reports/tasks/export`
