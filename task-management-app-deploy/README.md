# Task Management Application

A comprehensive employee task management system with customer database, due date tracking, and performance reporting built with React and Express.

## Features

- **Dashboard**: Overview of tasks, employees, and key metrics
- **Employee Management**: Add, edit, and manage team members
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **Customer Database**: Manage client information and project associations
- **Performance Reports**: Comprehensive insights and analytics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Data**: In-memory storage (perfect for small teams)
- **Build Tool**: Vite
- **Validation**: Zod schemas

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the application:
```bash
npm run dev
```

3. Open http://localhost:5000 in your browser

## Deployment

This application is designed to work on any static hosting platform:

- **GitHub Pages**: Free hosting for public repositories
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **Replit**: Development and hosting platform

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend  
├── shared/          # Shared types and schemas
├── package.json     # Dependencies and scripts
└── vite.config.ts   # Build configuration
```

## Usage

1. **Add Employees**: Start by adding your team members
2. **Add Customers**: Create your client database
3. **Create Tasks**: Assign tasks to employees with due dates and priorities
4. **Track Progress**: Monitor task completion and performance metrics
5. **Generate Reports**: View comprehensive analytics and insights

## License

This project is open source and available under the MIT License.