# Deployment Guide

This guide provides step-by-step instructions for deploying the Store Rating Application to Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- Project pushed to GitHub repository

## Backend Deployment on Render

### 1. Create a New Web Service

1. Log in to [Render](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the `store-rating-app` repository

### 2. Configure the Service

- **Name**: `store-rating-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Set Environment Variables

Add the following environment variables in Render:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

**Important Notes:**
- Replace `your_database_connection_string` with your actual database URL
- Generate a secure JWT secret (recommended: 64+ character random string)
- Update `CORS_ORIGIN` with your actual Vercel app URL after frontend deployment

### 4. Database Setup

1. Create a PostgreSQL database (Render offers free PostgreSQL)
2. Copy the database connection string
3. Update the `DATABASE_URL` environment variable
4. The database tables will be created automatically on first run

### 5. Deploy

1. Click "Create Web Service"
2. Wait for the build and deployment to complete
3. Note your backend URL: `https://your-backend-app-name.onrender.com`

## Frontend Deployment on Vercel

### 1. Prepare Environment Variables

1. Update `frontend/.env.production` with your actual backend URL:
   ```
   VITE_API_URL=https://your-backend-app-name.onrender.com/api
   ```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

#### Option B: Vercel Dashboard

1. Log in to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add environment variables:
   - `VITE_API_URL`: `https://your-backend-app-name.onrender.com/api`

6. Click "Deploy"

### 3. Update CORS Configuration

After frontend deployment:

1. Note your Vercel app URL: `https://your-app-name.vercel.app`
2. Update the `CORS_ORIGIN` environment variable in Render with this URL
3. Redeploy the backend service

## Post-Deployment Steps

### 1. Test the Application

1. Visit your Vercel app URL
2. Test user registration and login
3. Test store creation and rating functionality
4. Verify admin dashboard functionality

### 2. Database Initialization

If you need to set up initial data:

1. Access your Render service logs
2. The database tables are created automatically
3. You can run the test data scripts if needed:
   - `node create-test-owner.js`
   - `node create-multiple-test-stores.js`

### 3. Monitor and Maintain

- **Render**: Monitor service health at `/api/health` endpoint
- **Vercel**: Check deployment logs and analytics
- **Database**: Monitor usage and performance

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CORS_ORIGIN` in backend matches your Vercel URL exactly
   - Check that both HTTP and HTTPS are handled correctly

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from Render

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`

4. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

### Health Checks

- Backend health: `https://your-backend-app.onrender.com/api/health`
- Frontend: Visit your Vercel URL

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **JWT Secret**: Use a strong, unique secret for production
3. **Database**: Use strong passwords and restrict access
4. **CORS**: Only allow your frontend domain

## Scaling and Performance

- **Render**: Free tier has limitations; upgrade for production use
- **Vercel**: Automatic scaling for frontend
- **Database**: Monitor usage and upgrade as needed

## Support

For issues:
1. Check service logs in Render and Vercel dashboards
2. Verify environment variables
3. Test API endpoints directly
4. Check database connectivity

---

**Note**: Replace all placeholder URLs and names with your actual deployment details.