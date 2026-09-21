---
name: backend-development
description: >-
  Use this skill when designing, scaffolding, implementing, testing, or debugging backend systems, REST/GraphQL APIs, database models, authentication, middleware, and server architecture.
---

# Backend Architecture & Engineering Skill

This skill guides end-to-end backend development, API design, database modeling, and server runtime execution for the project.

## Core Capabilities & Responsibilities

1. **API Architecture & Design**
   - Design clean RESTful endpoints or GraphQL schemas with consistent naming conventions.
   - Implement robust input validation (e.g. Zod, Joi, Pydantic) and typed request/response schemas.
   - Standardize error handling and HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).

2. **Database Modeling & Migrations**
   - Support both Relational (PostgreSQL, SQLite, MySQL) and NoSQL (MongoDB) databases.
   - Utilize ORMs/ODMs effectively (Prisma, Drizzle, SQLAlchemy, Mongoose).
   - Ensure indexing, relational constraints, foreign keys, and migration tracking.

3. **Authentication & Security**
   - Secure password hashing (bcrypt, argon2).
   - Token-based authentication (JWT, refresh tokens, session cookies).
   - CORS policy configuration, rate limiting, and security headers (Helmet, etc.).
   - Input sanitization against SQL injection, XSS, and CSRF.

4. **Project Structure Best Practices**
   - Separation of concerns:
     - `controllers` / `routes`: Request routing and response dispatching.
     - `services`: Core business logic.
     - `models` / `schemas`: Data layer definitions and validation.
     - `middlewares`: Auth checks, error handling, logging.
     - `config`: Environment configuration and database connection pooling.
