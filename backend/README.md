# iReport Backend API

A comprehensive RESTful API for the iReport bullying reporting and prevention system, built with Node.js, Express, and MongoDB.

## Features

- ✅ User Authentication & Authorization (JWT)
- ✅ Incident Report Management
- ✅ Live Incident Response System
- ✅ Student & Grade Level Management
- ✅ Building Management
- ✅ Role-Based Access Control
- ✅ Comprehensive Logging
- ✅ Error Handling & Validation
- ✅ CORS Configuration
- ✅ RESTful API Design

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **API Validation**: express-validator
- **Logging**: Winston
- **Language**: TypeScript

## Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB (local or MongoDB Atlas)

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. **Update Environment Variables**
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/ireport
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:8081,http://localhost:3000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Server will be running at `http://localhost:3000`

## Scripts

### Development
```bash
npm run dev          # Start with auto-reload
npm run build        # Build TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm run type-check   # Check TypeScript errors
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run all tests
npm test -- --watch # Watch mode
```

## API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST   /api/auth/login      # User login
POST   /api/auth/register   # User registration
GET    /api/auth/profile    # Get current user (requires auth)
```

### Reports
```
POST   /api/reports                     # Create report
GET    /api/reports                     # Get all reports (with filters)
GET    /api/reports/:id                 # Get specific report
PUT    /api/reports/:id/status          # Update report status
GET    /api/reports/student/my-reports  # Get user's reports
```

### Live Incidents
```
POST   /api/live-incidents              # Create live incident
GET    /api/live-incidents              # Get active incidents
POST   /api/live-incidents/:id/respond  # Mark as responding
POST   /api/live-incidents/:id/resolve  # Resolve incident
DELETE /api/live-incidents/:id/responders/:userId  # Remove responder
```

### Students
```
GET    /api/students                    # Get students (with filters)
POST   /api/students                    # Create student
PUT    /api/students/:id                # Update student
DELETE /api/students/:id                # Delete student
GET    /api/students/grade-levels       # Get grade levels
GET    /api/students/sections           # Get sections
```

### Buildings
```
GET    /api/buildings                   # Get buildings
POST   /api/buildings                   # Create building
PUT    /api/buildings/:id               # Update building
DELETE /api/buildings/:id               # Delete building
```

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Database Models

### User
- Base user model (discriminator pattern for role-based types)
- Fields: fullName, email, password, schoolEmail, role, isActive

### Student (extends User)
- Fields: gradeLevel, section, studentId, dateOfBirth, parentName, parentContact

### StaffMember
- Fields: staffId, position, department, permissions

### IncidentReport
- Fields: reporterId, incidentType, location, description, status, priority, reviewHistory

### LiveIncident
- Fields: reporterId, buildingId, floor, room, incidentType, status, responders

### GradeLevel
- Fields: name, code, order, isActive

### Section
- Fields: name, code, gradeLevelId, adviser, capacity

### Building
- Fields: name, code, floors, color, isActive

### ActivityLog
- Fields: userId, action, description, details, timestamp

### ViolationRecord
- Fields: studentId, reportId, violationType, severity, recordedBy

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication.

### Token Usage
Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Token Structure
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (if applicable)"
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Missing/invalid token)
- `404` - Not Found
- `409` - Conflict (Duplicate entry)
- `500` - Internal Server Error

## Logging

The API uses Winston logger for comprehensive logging:

- **Info**: General information (server start, successful operations)
- **Warn**: Warnings (deprecated usage)
- **Error**: Errors (failed operations, exceptions)

Logs are saved to:
- `error.log` - Error logs only
- `combined.log` - All logs
- Console - Development environment

## Database Connection

### MongoDB Local
```bash
# Start MongoDB
mongod

# Connect to database
mongosh
use ireport
```

### MongoDB Atlas (Cloud)
1. Create cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ireport
   ```

## Middleware

### authMiddleware
- Validates JWT token
- Extracts userId and user data
- Required for protected routes

### optionalAuth
- Attempts to authenticate but doesn't fail if token missing
- Used for routes that work both authenticated and unauthenticated

### errorHandler
- Catches and formats all errors
- Provides consistent error responses

### notFound
- Handles 404 requests

## Configuration

### CORS
Configure allowed origins in `.env`:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,https://yourfrontend.com
```

### JWT
```env
JWT_SECRET=your_secure_secret_key_minimum_32_characters
JWT_EXPIRE=7d
```

### File Uploads
```env
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

## Development Tips

1. **Use Postman or Thunder Client** to test API endpoints
2. **Always validate input** using express-validator
3. **Use MongoDB indexes** for frequently queried fields
4. **Follow RESTful conventions** for endpoint design
5. **Document code** with JSDoc comments
6. **Test error cases** - not just happy paths

## Deployment

### Environment Variables
Update these for production:
```env
NODE_ENV=production
JWT_SECRET=use-strong-random-secret
MONGODB_URI=your-production-mongodb-uri
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

### Build & Run
```bash
npm run build
npm start
```

### Deploy to Heroku
```bash
heroku create ireport-api
git push heroku main
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string format
- Verify IP is whitelisted (MongoDB Atlas)
- Check username and password

### CORS Errors
- Add frontend URL to `CORS_ORIGIN`
- Include protocol (http/https)
- Separate multiple URLs with commas

### Token Validation Errors
- Ensure token is included in Authorization header
- Check token hasn't expired
- Verify JWT_SECRET matches between frontend and backend

### Port Already in Use
```bash
npx kill-port 3000
npm run dev
```

## Security Considerations

1. ✅ **Password Hashing**: Uses bcryptjs with salt rounds
2. ✅ **JWT Tokens**: Short-lived (7 days default)
3. ✅ **CORS Protection**: Whitelisted origins only
4. ✅ **Input Validation**: Using express-validator
5. ✅ **Error Messages**: Don't leak sensitive information
6. ✅ **Dependencies**: Keep updated (`npm audit`)

## Performance

- **Pagination**: Use skip/limit for large datasets
- **Indexes**: Added to frequently queried fields
- **Caching**: React Query handles frontend caching
- **Compression**: Enable gzip compression

```javascript
app.use(compression());
```

## Contributing

1. Create feature branch
2. Follow code style
3. Add tests for new features
4. Update API documentation
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Review error logs
- Check environment variables
- Verify database connection

---

**Version**: 1.0.0  
**Last Updated**: March 2026
