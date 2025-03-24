# Expense Tracker Frontend

Angular 17 frontend for the Expense Tracker application.

## Features

- User authentication and authorization
- Expense management (CRUD operations)
- Category management
- File attachments for receipts
- Reporting and data visualization
- Budget planning and tracking
- Responsive design with Angular Material

## Technology Stack

- Angular 17
- Angular Material
- NGRX for state management
- Chart.js for visualizations
- Angular Reactive Forms
- RxJS for reactive programming

## Prerequisites

- Node.js (v18+)
- npm (v9+)
- Angular CLI (v17+)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   ng serve
   ```
4. Navigate to `http://localhost:4200` in your browser

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running Tests

- Run unit tests: `ng test`
- Run end-to-end tests: `ng e2e`

## Deployment

1. Build the application for production:
   ```bash
   ng build --configuration production
   ```
2. Deploy the contents of the `dist/` directory to your web server or hosting service

## Project Structure

- `src/app/core` - Core functionality (auth, guards, interceptors)
- `src/app/shared` - Shared components, directives, and pipes
- `src/app/features` - Feature modules (expenses, categories, reports)
- `src/app/store` - NGRX store (actions, reducers, effects, selectors)
- `src/assets` - Static assets (images, icons, etc.)
- `src/environments` - Environment configuration

## API Integration

The frontend communicates with the .NET backend API. The API URL is configured in the environment files.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License
