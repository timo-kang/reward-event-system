## System Overview

This system is a backend platform for managing user events and automating reward distribution. The goal is to increase efficiency by automating the verification of event conditions and reward distribution processes that operators are currently handling manually.

## Technology Stack

- Node.js 18 (fixed)
- NestJS (latest version)
- MongoDB (database)
- JWT (authentication)
- Docker + docker-compose (deployment/execution)
- TypeScript (language)

## System Architecture

The system is built on a Microservice Architecture (MSA) with three servers:

1. **Gateway Server**: Entry point for all API requests, authentication, permission checking, and routing
2. **Auth Server**: User information management, login, role management, JWT issuance
3. **Event Server**: Event creation, reward definition, reward request processing, distribution status storage

## Run System

```
docker-compose up --build
```

## Role Definitions

- **USER**: Can request rewards
- **OPERATOR**: Can register events and rewards
- **AUDITOR**: Can only view reward history
- **ADMIN**: Has access to all functions

## Feature Description Based on Use Cases

### 1. User Management (Auth Server)

- **User Registration**
    - Actor: All users
    - Description: Register a new user in the system
    - Flow: Enter user information → Create account → Assign default role (USER)
- **Login**
    - Actor: Registered users
    - Description: Authenticate with the system and obtain a JWT token
    - Flow: Submit authentication credentials → Verify authentication → Issue JWT token
- **Role Management**
    - Actor: ADMIN
    - Description: Change user roles to adjust permissions
    - Flow: Select user → Change role → Update permissions

### 2. Event Management (Event Server)

- **Event Registration**
    - Actor: OPERATOR, ADMIN
    - Description: Register a new event in the system
    - Flow: Enter event information (name, description, period, conditions, etc.) → Create event → Set status (active/inactive)
- **Event Lookup**
    - Actor: All users
    - Description: View a list or details of registered events
    - Flow: Request event list → Return event information according to permissions
- **Event Modification/Management**
    - Actor: OPERATOR, ADMIN
    - Description: Change information or manage the status of registered events
    - Flow: Select event → Modify information → Save changes

### 3. Reward Management (Event Server)

- **Reward Registration**
    - Actor: OPERATOR, ADMIN
    - Description: Add reward information linked to an event
    - Flow: Select event → Enter reward information (type, quantity, etc.) → Link reward
- **Reward Lookup**
    - Actor: All users
    - Description: View reward information linked to events
    - Flow: Select event → Request linked reward information → Return reward information

### 4. Reward Request and Processing (Event Server)

- **Reward Request**
    - Actor: USER
    - Description: Users request rewards for specific events
    - Flow: Select event → Request reward → Verify conditions → Record request status (success/failure)
- **Automated Reward Verification**
    - Actor: System
    - Description: Automatically verify condition fulfillment for user reward requests
    - Flow: Receive request → Check event conditions → Verify user condition fulfillment → Store result
- **Manual Reward Review**
    - Actor: OPERATOR, ADMIN
    - Description: Operators manually review reward requests when automatic verification is not possible
    - Flow: Check pending review requests → Review and decide approval/rejection → Update result

### 5. Reward Request History Management (Event Server)

- **Personal Reward Request History**
    - Actor: USER
    - Description: Users view their own reward request history
    - Flow: Request history → Retrieve user's request records → Return results
- **Complete Reward Request History**
    - Actor: OPERATOR, AUDITOR, ADMIN
    - Description: Operators or auditors view reward request history for all users
    - Flow: Request history (including filtering options) → Verify permissions → Search history → Return results

### 6. Authentication and Authorization Management (Gateway Server)

- **API Request Authentication**
    - Actor: All users
    - Description: Verify JWT tokens for all API requests
    - Flow: Receive request → Validate JWT token → Extract user information → Proceed with request
- **Permission Check**
    - Actor: System
    - Description: Check API access permissions based on user role
    - Flow: Complete authentication → Check role → Verify permissions for requested resource → Approve/deny

## Domain Models

### User

- Attributes: identifier, name, email, password (hashed), role, created date, modified date
- Functions: authentication, role management

### Event

- Attributes: identifier, name, description, start date, end date, status (active/inactive), condition information, creator, created date, modified date
- Functions: event registration, lookup, modification, management

### Reward

- Attributes: identifier, event ID, reward type (points, items, coupons, etc.), quantity, description, created date, modified date
- Functions: reward registration, lookup, linking

### RewardRequest

- Attributes: identifier, user ID, event ID, request date, status (pending/success/failure), processing date, processor, notes
- Functions: reward request, condition verification, status management, history lookup

## Example API Endpoints

### Auth Server

- POST /auth/register - User registration
- POST /auth/login - Login and token issuance
- GET /users - View user list (ADMIN)
- PATCH /users/:id/role - Change user role (ADMIN)

### Event Server

- POST /events - Register event (OPERATOR, ADMIN)
- GET /events - View event list
- GET /events/:id - View event details
- PATCH /events/:id - Modify event (OPERATOR, ADMIN)
- POST /events/:id/rewards - Register reward (OPERATOR, ADMIN)
- GET /events/:id/rewards - View event rewards
- POST /events/:id/request - Request reward (USER)
- GET /reward-requests - View reward request history (filtered by permission)
- GET /reward-requests/me - View my reward request history (USER)
- PATCH /reward-requests/:id - Update reward request status (OPERATOR, ADMIN)

## Implementation Considerations

1. Design flexible event condition verification logic (supporting various condition types)
2. Implement mechanisms to prevent duplicate reward requests
3. Thoroughly apply role-based access control
4. Design inter-service communication (MSA structure)
5. Handle transactions (e.g., rollback when reward distribution fails)
6. Implement logging and audit trail functionality