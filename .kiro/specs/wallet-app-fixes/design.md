# Design Document

## Overview

This design document outlines the systematic approach to fix the wallet app issues by addressing configuration problems, database schema mismatches, navigation conflicts, and API integration issues. The solution focuses on maintaining backward compatibility while enabling the new features (accounts, budgets, statistics, settings).

## Architecture

### System Components

1. **Mobile App (React Native/Expo)**
   - Tab-based navigation with 5 main screens
   - Environment-based API configuration
   - Error boundary components for graceful error handling

2. **Backend API (Express.js)**
   - RESTful endpoints for transactions, accounts, budgets, statistics
   - Database migration system for schema updates
   - Comprehensive error handling middleware

3. **Database (PostgreSQL via Neon)**
   - Four main tables: users, accounts, budgets, transactions
   - Foreign key relationships with cascade deletes
   - Migration scripts for existing data

## Components and Interfaces

### Mobile App Components

#### Environment Configuration
```javascript
// .env file structure
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk_key>
EXPO_PUBLIC_API_URL=<backend_url> 
// the url is https://wallet-api-gzef.onrender.com/api

// API configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';
```

#### Navigation Structure
```javascript
// Tab Navigation Layout
- Home (index.jsx) - Dashboard with balance and recent transactions
- Accounts (accounts.jsx) - Account management
- Budgets (budgets.jsx) - Budget tracking
- Statistics (statistics.jsx) - Analytics and charts
- Settings (settings.jsx) - User preferences and export
- Create (create.jsx) - Add transactions (floating action button)
- Add Account (add-account.jsx) - Hidden from tabs, modal-style
```

#### Error Handling Component
```javascript
// ErrorBoundary component for catching React errors
// NetworkError component for API failures
// ValidationError component for form errors
```

### Backend API Endpoints

#### Existing Endpoints (Enhanced)
- `GET /api/transactions/:userId` - Get user transactions
- `POST /api/transactions` - Create transaction (enhanced with account_id)
- `DELETE /api/transactions/:id` - Delete transaction

#### New Endpoints
- `GET /api/accounts/:userId` - Get user accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/budgets/:userId/:month` - Get monthly budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/statistics/:userId` - Get user statistics
- `GET /api/transactions/export/:userId` - Export transactions to CSV

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

#### Accounts Table
```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

#### Budgets Table
```sql
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  month VARCHAR(7) NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, category, month)
);
```

#### Transactions Table (Enhanced)
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

### Migration Strategy

#### Phase 1: Schema Updates
1. Create new tables (users, accounts, budgets)
2. Add account_id column to transactions (nullable initially)
3. Create default account for existing users

#### Phase 2: Data Migration
1. Identify unique users from existing transactions
2. Create user records in users table
3. Create default "Cash" account for each user
4. Update existing transactions with default account_id

#### Phase 3: Constraint Application
1. Make account_id NOT NULL after migration
2. Add foreign key constraints
3. Verify data integrity

## Error Handling

### Mobile App Error Handling

#### Network Errors
```javascript
// Centralized error handling for API calls
const handleApiError = (error) => {
  if (error.name === 'NetworkError') {
    return 'Please check your internet connection';
  }
  if (error.status === 404) {
    return 'Resource not found';
  }
  if (error.status >= 500) {
    return 'Server error. Please try again later';
  }
  return error.message || 'An unexpected error occurred';
};
```

#### Form Validation
```javascript
// Client-side validation before API calls
const validateAccountForm = (name, type, balance) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Account name is required';
  if (!type) errors.type = 'Account type is required';
  if (isNaN(parseFloat(balance))) errors.balance = 'Valid balance is required';
  return errors;
};
```

### Backend Error Handling

#### Middleware
```javascript
// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({ message: 'Resource already exists' });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ message: 'Invalid reference' });
  }
  
  res.status(500).json({ message: 'Internal server error' });
};
```

#### Database Transaction Handling
```javascript
// Wrap critical operations in transactions
const createAccountWithTransaction = async (accountData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const account = await client.query('INSERT INTO accounts...');
    await client.query('UPDATE users SET...');
    await client.query('COMMIT');
    return account;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

## Testing Strategy

### Unit Tests
- API endpoint testing with Jest and Supertest
- React component testing with React Testing Library
- Database operation testing with test database

### Integration Tests
- End-to-end API workflow testing
- Database migration testing
- Error scenario testing

### Manual Testing
- Cross-platform mobile app testing (iOS/Android)
- Network failure simulation
- Database constraint violation testing

## Deployment Strategy

### Development Environment
1. Update environment variables
2. Run database migrations
3. Test all features locally

### Production Environment
1. Backup existing database
2. Deploy backend with migration scripts
3. Update mobile app configuration
4. Gradual rollout with monitoring

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried columns (user_id, created_at)
- Implement pagination for large datasets
- Use database connection pooling

### Mobile App Optimization
- Implement caching for frequently accessed data
- Use lazy loading for statistics charts
- Optimize image assets and bundle size

### API Optimization
- Implement request/response compression
- Add caching headers for static data
- Use database query optimization