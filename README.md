# Event/Reward Management Platform

# Project Overview

Build an event and reward management platform using NestJS, microservices, and MongoDB.

# Technical Stack

- **Node.js:** v18
- **NestJS:** Latest version
- **Database:** MongoDB
- **Authentication:** JWT
- **Deployment & Execution:** Docker, docker-compose
- **Language:** TypeScript

# Server Configuration

- **Gateway Server:**
  - Entry point for all API requests.
  - Handles routing, authentication (JWT), and authorization.
  - Uses `@nestjs/passport`, `AuthGuard`, and `RolesGuard`.
- **Auth Server:**
  - Manages user information, login processing, role management, and JWT issuance.
  - **Roles:**
    - `USER`: Can request rewards.
    - `OPERATOR`: Can register events and rewards.
    - `AUDITOR`: Can only view reward history.
    - `ADMIN`: Full access to all features.
- **Event Server:**
  - Manages event creation/lookup and reward definition/processing.
  - Handles condition validation, prevents duplicate requests, and records request status.

# Required Features

- **Event Registration and Lookup:**
  - Operators/Admins can create events.
  - Manages conditions (e.g., 3 consecutive logins, invite a friend), duration, and active status.
- **Reward Registration and Lookup:**
  - Rewards can be linked to events (points, items, coupons, etc.).
  - Clearly indicates which event each reward is linked to.
- **User Reward Request Processing:**
  - Users can request rewards for specific events.
  - Validates conditions and prevents duplicate requests.
  - Records request status (success/failure, etc.).
- **Reward Request History Lookup:**
  - Users can view their own request history.
  - Operators/Admins/Auditors can view the overall request history.
  - (Optional) Implement filtering capabilities.

# Authentication and Authorization

- Mandatory JWT-based authentication.
- Role-based Access Control (RBAC).

# Submission Instructions

- Submit via a public GitHub repository.
- Detail how to run the project using Docker Compose in this README.md.
- Feel free to include your design decisions and additional explanations in this README.md.

# Optional Additions (Bonus Points)

- Write simple unit and integration tests.
- Implement tests that clearly demonstrate the separation of concerns between services.

# Other Considerations

- You are free to design API paths, HTTP methods (GET, POST, etc.), and request/response structures.
- Front-end development is not required.
- Event types and reward items can be freely defined.

# Running with Docker Compose

1. Ensure you have Docker and Docker Compose installed.
2. Build and run the services:

```sh
npm run dev
```