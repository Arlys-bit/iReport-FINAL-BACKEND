# Backend API

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints except `/auth/login` and `/auth/register` require authentication.
Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@school.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@school.edu",
    "role": "student",
    "fullName": "John Doe"
  }
}
```

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@school.edu",
  "password": "password123",
  "fullName": "John Doe",
  "role": "student",
  "gradeLevel": "Grade 10",
  "section": "A"
}
```

#### GET /auth/profile
Get the current user's profile (requires auth).

---

### Reports

#### POST /reports
Create a new incident report.

**Request Body:**
```json
{
  "reporterRole": "student",
  "reporterName": "John Doe",
  "reporterGradeLevel": "Grade 10",
  "reporterSection": "A",
  "isAnonymous": false,
  "victimName": "Jane Doe",
  "location": "Classroom A101",
  "incidentType": "Verbal Threats",
  "incidentDate": "2024-01-15T10:30:00Z",
  "description": "Incident details here..."
}
```

#### GET /reports
Get all reports (with filters).

**Query Parameters:**
- `status` - Filter by status (under_review, accepted, declined)
- `priority` - Filter by priority (low, medium, high, urgent)
- `skip` - Pagination offset (default: 0)
- `limit` - Results per page (default: 10)

#### GET /reports/:id
Get a specific report by ID.

#### PUT /reports/:id/status
Update report status.

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Report reviewed and verified",
  "reviewedByName": "Staff Name"
}
```

#### GET /reports/student/my-reports
Get current student's reports.

---

### Live Incidents

#### POST /live-incidents
Create a new live incident report.

**Request Body:**
```json
{
  "reporterName": "John Doe",
  "reporterGradeLevelId": "g10",
  "reporterSectionId": "a",
  "buildingId": "b1",
  "buildingName": "Building A",
  "floor": "2nd",
  "room": "A101",
  "incidentType": "fighting",
  "description": "Two students fighting in the classroom"
}
```

#### GET /live-incidents
Get active live incidents.

**Query Parameters:**
- `status` - Filter by status (active, responding, resolved)
- `skip` - Pagination offset
- `limit` - Results per page

#### POST /live-incidents/:incidentId/respond
Mark staff member as responding to incident.

**Request Body:**
```json
{
  "userName": "Teacher Name"
}
```

#### POST /live-incidents/:incidentId/resolve
Resolve an incident.

**Request Body:**
```json
{
  "resolvedByName": "Teacher Name"
}
```

#### DELETE /live-incidents/:incidentId/responders/:userId
Remove a responder from an incident.

---

### Students

#### GET /students
Get list of students.

**Query Parameters:**
- `gradeLevel` - Filter by grade level
- `section` - Filter by section
- `skip` - Pagination offset
- `limit` - Results per page

#### POST /students
Create a new student (admin only).

#### PUT /students/:id
Update student information.

#### DELETE /students/:id
Soft delete a student.

#### GET /students/grade-levels
Get all grade levels.

#### GET /students/sections
Get all sections.

**Query Parameters:**
- `gradeLevelId` - Filter by grade level ID

---

### Buildings

#### GET /buildings
Get all buildings.

**Query Parameters:**
- `isActive` - Filter by active status (true/false)

#### POST /buildings
Create a new building (admin only).

#### PUT /buildings/:id
Update building information.

#### DELETE /buildings/:id
Soft delete a building.

---

## Error Responses

```json
{
  "error": "Error message",
  "details": "Additional details (if available)"
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `500` - Internal Server Error

---

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/ireport
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://localhost:3000
```
