# 🚀 Vercel Deployment Guide

## Prerequisites
- GitHub repository with your API code
- Vercel account (free tier available)
- Environment variables configured

## 📋 Deployment Steps

### 1. **Prepare Your Repository**
```bash
# Make sure these files are in your api/ directory:
- vercel.json ✅
- .vercelignore ✅
- index.js ✅
- server.js (modified) ✅
- package.json (updated) ✅
```

### 2. **Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your repository
5. **Select the `api` folder as the root directory**

### 3. **Configure Build Settings**
- **Framework Preset**: `Other`
- **Root Directory**: `api`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: Leave empty
- **Install Command**: `npm install`

### 4. **Environment Variables**
Add these in Vercel dashboard under Settings → Environment Variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=account@cleaningprofessionals.com.au
SENDGRID_BUSINESS_EMAIL=account@cleaningprofessionals.com.au

# Server
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Company
COMPANY_NAME=Cleaner Home
SENDGRID_ADMIN_BOOKING_TEMPLATE_ID=your_template_id
```

### 5. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Your API will be available at: `https://your-project.vercel.app`

## 🔧 Alternative: Railway/Render (If Vercel doesn't work)

### Railway Deployment
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Select the `api` folder
4. Railway auto-detects Node.js
5. Add environment variables in dashboard

### Render Deployment
1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Select the `api` folder
5. Add environment variables

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://your-api.vercel.app/health
```

### Test Booking
```bash
curl -X POST https://your-api.vercel.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 📝 Frontend Configuration

Update your frontend environment variables:

```env
# In your frontend .env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

## 🚨 Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node.js version compatibility
2. **Environment Variables**: Ensure all required vars are set
3. **Database Connection**: Verify Supabase credentials
4. **CORS Issues**: Update FRONTEND_URL in environment

### Logs:
- Vercel: Check Functions tab for logs
- Railway: Check Deployments tab
- Render: Check Logs section

## 🔄 Auto-Deployment

Once connected, every push to your main branch will automatically deploy!

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Check Vercel/Railway/Render documentation



