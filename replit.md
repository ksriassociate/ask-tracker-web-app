# Overview

This is a task management web application built with React and Express.js. It provides a comprehensive dashboard for managing employees, customers, and tasks with features like filtering, searching, and reporting. The application follows a modern full-stack architecture with a RESTful API backend and a responsive frontend using shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. It follows a component-based architecture with:

- **UI Framework**: Uses shadcn/ui components built on top of Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS for utility-first styling with CSS variables for theming
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Layout**: Responsive design with sidebar navigation and mobile-friendly layout

## Backend Architecture
The backend follows RESTful API principles with:

- **Framework**: Express.js server with TypeScript
- **Data Storage**: Currently using in-memory storage with an abstracted storage interface (IStorage) that can be easily swapped for database implementations
- **Validation**: Zod schemas shared between frontend and backend for type safety
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reloading with Vite integration for seamless development experience

## Data Models
The application manages three core entities:

- **Employees**: Name, email, position, department with UUID primary keys
- **Customers**: Name, email, company, phone with UUID primary keys  
- **Tasks**: Title, description, status (pending/in_progress/completed/overdue), priority (low/medium/high/urgent), assigned employee, customer association, due dates

## Database Design
Database schemas are defined using Drizzle ORM with PostgreSQL dialect, though the current implementation uses in-memory storage. The schema includes:

- UUID primary keys with auto-generation
- Proper foreign key relationships between tasks and employees/customers
- Timestamp tracking for creation and completion dates
- Strongly typed status and priority enums

## API Structure
RESTful endpoints following standard conventions:

- **GET /api/employees** - List all employees
- **POST /api/employees** - Create new employee
- **GET/PUT/DELETE /api/employees/:id** - Individual employee operations
- Similar patterns for customers and tasks
- **GET /api/stats** - Dashboard statistics endpoint

## Development Workflow
The application uses a monorepo structure with shared TypeScript types and schemas. Development features include:

- Hot reloading for both frontend and backend
- Shared validation schemas between client and server
- TypeScript throughout for type safety
- ESM modules with modern JavaScript features

## External Dependencies

- **Neon Database**: PostgreSQL serverless database (configured but not currently used)
- **Drizzle ORM**: Type-safe database toolkit for schema definition and migrations
- **Radix UI**: Unstyled, accessible UI primitives
- **TanStack React Query**: Powerful data synchronization for React
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Minimalist routing for React applications
- **date-fns**: Modern JavaScript date utility library