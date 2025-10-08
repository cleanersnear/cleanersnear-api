# Clean Home API Backend


supabase password : CleanerHome2025@@
organiation name : CleanerHome
This is the backend API for the Clean Home Services booking system.


new project pwd : CleanerHome2025@@
## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Check if API is running

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:bookingNumber` - Get booking by number

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Database Configuration (TODO: Add your database credentials)
DATABASE_URL=postgresql://username:password@localhost:5432/cleanhome

# Email Configuration (TODO: Add your email service credentials)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key

# SMS Configuration (TODO: Add your SMS service credentials)
SMS_SERVICE=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## 📁 Project Structure

```
api/
├── server.js              # Main server file
├── routes/
│   └── bookings.js        # Booking routes
├── middleware/            # Custom middleware (TODO)
├── models/               # Database models (TODO)
├── services/             # Business logic (TODO)
├── utils/                # Utility functions (TODO)
├── .env                  # Environment variables
├── package.json
└── README.md
```

## 🛠️ Development

### Adding New Features

1. **Database Integration**: Add your database models in `models/`
2. **Email Service**: Implement email sending in `services/email.js`
3. **SMS Service**: Implement SMS notifications in `services/sms.js`
4. **Authentication**: Add auth middleware in `middleware/auth.js`

### TODO List

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Email confirmation system
- [ ] SMS notifications
- [ ] Authentication & authorization
- [ ] Payment integration
- [ ] Calendar integration
- [ ] Admin dashboard API
- [ ] Booking management system

## 🔗 Frontend Integration

The frontend (Next.js app) will send requests to this API. Make sure:

1. Frontend is running on `http://localhost:3000`
2. Backend is running on `http://localhost:3001`
3. CORS is properly configured
4. Environment variables are set correctly

## 📝 API Request/Response Format

### Booking Request
```json
{
  "selectedService": "Regular Cleaning",
  "serviceDetails": {
    "frequency": "Weekly",
    "duration": "3 hours"
  },
  "customerDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "0412345678",
    "address": "123 Main St, Melbourne VIC 3000",
    "scheduleDate": "2024-01-15"
  },
  "pricing": {
    "totalPrice": 161
  }
}
```

### Booking Response
```json
{
  "success": true,
  "bookingNumber": "CH-ABC123",
  "status": "pending",
  "message": "Booking submitted successfully! You will receive a confirmation email shortly."
}
```
