# Nyxxus E-Sports Tournament Portal

## Overview

This is a full-stack Valorant-themed tournament portal for Nyxxus E-Sports' "Spike Rush Cup 2.0". The application manages team registration, payment verification, and tournament administration. Built with a modern web stack, it features user authentication, team management, and admin controls for tournament oversight.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with custom Valorant-themed design system including glass morphism effects and gaming aesthetics
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible interface elements
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with consistent error handling and response formatting
- **Middleware Stack**: Rate limiting, session management, file upload handling, and authentication middleware
- **Session Management**: Cookie-based sessions using cookie-session middleware

### Data Storage Solutions
- **Database**: SQLite with better-sqlite3 driver for local development and deployment
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Shared TypeScript schema definitions between client and server
- **File Storage**: Local file system for payment proof uploads with authentication-protected access

### Authentication and Authorization
- **User Authentication**: Email/password-based registration and login with bcrypt password hashing
- **Admin Authentication**: Simple hardcoded admin credentials (username: "callmeson", password: "callmeson")
- **Session Security**: HTTP-only cookies with configurable session duration
- **Route Protection**: Middleware-based authentication guards for protected routes
- **Role-Based Access**: Separate user and admin authentication flows with different access levels

### External Dependencies

- **Database**: Uses Neon Database serverless PostgreSQL for production (configured but currently using SQLite)
- **UI Framework**: Radix UI for accessible component primitives
- **Validation**: Zod for runtime type validation and schema definition
- **File Handling**: Multer for multipart form data and file upload processing
- **Development Tools**: Replit-specific plugins for development environment integration
- **Build System**: Vite with React plugin and ESBuild for production builds

The application follows a monorepo structure with shared TypeScript definitions, allowing for type safety across the full stack. The architecture prioritizes developer experience with hot reloading, TypeScript strict mode, and comprehensive error handling throughout the application layers.