# Store Rating Platform

## My Development Journey

Started this project last week after getting frustrated with existing store review platforms. Wanted to build something clean and functional from scratch. Here's how I built it step by step (and all the struggles along the way!).

## What It Does

A full-stack store rating platform where:
- **Users** can browse stores, leave ratings and reviews
- **Store Owners** can manage their stores and respond to reviews  
- **Admins** can oversee everything and manage users/stores

## 🚀 Quick Start

**Try the live application**: https://store-rating-app-inc.vercel.app/

Use the [test accounts](#test-accounts) below to explore different user roles and features without setting up anything locally.

## Tech Stack

- **Frontend**: React + Vite (love the fast refresh!)
- **Backend**: Express.js + Node.js
- **Database**: NeonDB (PostgreSQL) - took me forever to get this working
- **Styling**: Tailwind CSS 3.4.17 with custom theme
- **Authentication**: JWT tokens
- **Deployment**: Vercel (Frontend) + Render (Backend)

## My Build Process

### Week 1: Database Struggles
- Set up NeonDB - kept getting connection timeouts at first
- Designed the schema after several iterations
- Finally got the connection working after reading docs for hours

### Week 2: Backend Development  
- Built Express server with proper middleware
- Authentication was tricky - had to debug token verification
- Created separate route files for admin, owner, user endpoints
- SQL queries for rating aggregation took several attempts

### Week 3: Frontend Magic
- React setup with Vite (much faster than Create React App!)
- Tailwind configuration with custom purple-blue-orange theme
- Component structure took some planning
- Rating stars component was surprisingly difficult

### Week 4: Polish & Fixes
- Fixed rating bar proportions (was calculating wrong percentages)
- Solved infinite rerender issues in admin dashboard
- Added proper error handling and loading states
- Pagination math confused me initially but got it working

## Features That Work

✅ **User Authentication** - Login/signup with role-based access  
✅ **Store Management** - CRUD operations for stores  
✅ **Rating System** - 5-star ratings with comments  
✅ **Search & Filter** - Find stores by name, rating, etc.  
✅ **Admin Dashboard** - User/store management with stats  
✅ **Owner Dashboard** - Store analytics and rating responses  
✅ **Responsive Design** - Works on mobile and desktop

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- NeonDB account (free at https://neon.tech)
- npm or yarn

### Database Setup

1. **Create NeonDB Account**:
   - Go to [https://neon.tech](https://neon.tech) and create a free account
   - Create a new project
   - Copy the connection string from your project dashboard

2. **Set up Database Schema**:
   ```bash
   cd backend
   npm run setup
   ```

### Backend Setup (Development)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and update with your NeonDB connection string:
```env
# Database Configuration
# Replace with your actual NeonDB connection string
# Example: postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL=your_actual_neondb_connection_string_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for development)
CORS_ORIGIN=http://localhost:5173
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

**Note**: For production deployment, see the [Deployment](#deployment) section below.

### Frontend Setup (Development)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file for development (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

**Note**: For production deployment, see the [Deployment](#deployment) section below.

## Test Accounts

### Live Application Test Accounts
You can test the live application at https://store-rating-app-inc.vercel.app/ using these accounts:

**Admin Account**:
- **Email**: admin@storerating.com
- **Password**: Admin123!
- **Access**: Full admin dashboard, user management, store management

**Store Owner Account**:
- **Email**: owner@teststore.com
- **Password**: Owner123!
- **Access**: Store management, rating analytics, owner dashboard

**Regular User Account**:
- **Email**: user@test.com
- **Password**: User123!
- **Access**: Browse stores, submit ratings, user profile

### Default Admin Account (Development)
The database schema includes a default admin account for development:
- **Email**: admin@storerating.com
- **Password**: Admin123!

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify JWT token

### Admin Routes
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Add new user
- `GET /api/admin/stores` - List all stores
- `POST /api/admin/stores` - Add new store
- `GET /api/admin/users/:id` - Get user details

### User Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/update-password` - Update password

### Store Routes
- `GET /api/stores` - List all stores (with search/filter)
- `GET /api/stores/:id` - Get store details

### Rating Routes
- `POST /api/ratings` - Submit rating
- `PUT /api/ratings` - Update rating
- `DELETE /api/ratings` - Delete rating
- `GET /api/ratings/my-ratings` - Get user's ratings

### Owner Routes
- `GET /api/owner/dashboard` - Owner dashboard
- `GET /api/owner/store` - Get store info
- `GET /api/owner/ratings` - Get store ratings
- `GET /api/owner/analytics` - Get rating analytics

## Form Validations

- **Name**: 20-60 characters
- **Address**: Maximum 400 characters
- **Password**: 8-16 characters, one uppercase, one special character
- **Email**: Standard email validation
- **Rating**: Integer between 1-5

## Project Structure

```
store-rating-platform/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   └── schema.sql
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── owner.js
│   │   ├── ratings.js
│   │   ├── stores.js
│   │   └── user.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── StoreCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── UserStores.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Development

### Running Tests
```bash
# Backend tests (if implemented)
cd backend && npm test

# Frontend tests (if implemented)
cd frontend && npm test
```

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Backend is ready for production with NODE_ENV=production
```

## Deployment

### Live Application
- **Frontend**: https://store-rating-app-inc.vercel.app/
- **Backend**: https://store-rating-backend-sweo.onrender.com
- **Database**: NeonDB (PostgreSQL)

### Backend Deployment (Render)

1. **Create NeonDB Database**:
   - Go to [https://neon.tech](https://neon.tech) and create a free account
   - Create a new project and database
   - Copy the connection string (format: `postgresql://username:password@host/database?sslmode=require`)

2. **Deploy to Render**:
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Configure the following environment variables:

   ```env
   DATABASE_URL=your_neondb_connection_string
   JWT_SECRET=your_secure_128_character_jwt_secret
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://store-rating-app-inc.vercel.app
   ```

3. **Generate JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set root directory to `frontend`
   - Vercel will automatically detect Vite configuration
   - The `vercel.json` file is pre-configured with the production API URL

2. **Configuration Files**:
   - `frontend/vercel.json` - Contains deployment settings and environment variables
   - `frontend/.env.production` - Production environment configuration

### Environment Variables Reference

#### Backend (Render)
| Variable | Description | Example |
|----------|-------------|----------|
| `DATABASE_URL` | NeonDB connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | 128-character secret for JWT tokens | Generated using crypto.randomBytes(64) |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://store-rating-app-inc.vercel.app` |

#### Frontend (Vercel)
| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_API_URL` | Backend API endpoint | `https://store-rating-backend-sweo.onrender.com/api` |

### Post-Deployment Verification

1. **Backend Health Check**:
   ```bash
   curl https://store-rating-backend-sweo.onrender.com/health
   ```

2. **Frontend Verification**:
   - Visit https://store-rating-app-inc.vercel.app/
   - Test user registration and login
   - Verify API connectivity

3. **Database Connection**:
   - Backend logs should show successful database connection
   - Database schema is automatically set up on first connection

### Deployment Files

- `backend/render.yaml` - Render deployment configuration
- `frontend/vercel.json` - Vercel deployment configuration
- `DEPLOYMENT.md` - Detailed deployment documentation

### Troubleshooting

- **CORS Issues**: Ensure `CORS_ORIGIN` matches your frontend URL exactly
- **Database Connection**: Verify NeonDB connection string format and SSL requirement
- **Environment Variables**: Check all required variables are set in hosting platform
- **Build Failures**: Review build logs for missing dependencies or configuration errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

