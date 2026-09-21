# Project Guidelines: Full-Stack Development (CLG-PROJECT)

## Stack & Architecture Standards

- **Full-Stack Integration**: Ensure seamless connection between Frontend UI and Backend APIs.
- **Backend Environment**: Supported runtimes include Node.js (Express, Fastify, NestJS) and Python (FastAPI, Flask, Django).
- **Environment Management**: Keep secrets, API keys, and database connection strings in `.env` (with `.env.example` committed). Never commit hardcoded credentials.
- **Error Handling**: Always return structured JSON responses for API errors (`{ "success": false, "message": "...", "error": "..." }`).
- **Database Best Practices**: Maintain clean schema definitions with migrations, indexing, and foreign key integrity.
