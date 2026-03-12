# Territory Running App - Developer Quick Reference

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Initialize database schema
npm run init-db
```

## Project URLs

| Page | URL | Auth Required |
|------|-----|---|
| Home | http://localhost:3000/ | Yes |
| Run | http://localhost:3000/run | Yes |
| Leaderboard | http://localhost:3000/leaderboard | No |
| API Health | http://localhost:3000/api/health | No |

## Key API Routes

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/profile       - Get user profile (auth required)
```

### Running Sessions
```
POST   /api/run/start                    - Start session (auth required)
POST   /api/run/:sessionId/coordinate    - Add GPS point (auth required)
POST   /api/run/:sessionId/pause         - Pause session (auth required)
POST   /api/run/:sessionId/finish        - End session (auth required)
GET    /api/run/:sessionId               - Get session details (auth required)
GET    /api/run/history/all              - Get user's history (auth required)
```

### Territories
```
GET    /api/territory/all                - Get all territories
GET    /api/territory/bounds             - Get territories in bounds
GET    /api/territory/:territoryId       - Get territory details
GET    /api/territory/user/territories   - Get my territories (auth required)
```

### Leaderboard
```
GET    /api/leaderboard/area             - Leaderboard by area
GET    /api/leaderboard/distance         - Leaderboard by distance
GET    /api/leaderboard/rank/area        - My rank by area (auth required)
GET    /api/leaderboard/rank/distance    - My rank by distance (auth required)
```

## Environment Setup

### Create `.env` file:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=territory_running_app
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
APP_URL=http://localhost:3000
```

### PostgreSQL Setup:
```sql
-- Create database
CREATE DATABASE territory_running_app;

-- Connect and run schema
\c territory_running_app
\i config/database.sql
```

## File Quick Lookup

| Functionality | File | Purpose |
|---|---|---|
| User authentication | `controllers/authController.js` | Login/register logic |
| Running session | `controllers/runController.js` | GPS tracking handling |
| Territory management | `controllers/territoryController.js` | Territory queries |
| Leaderboard | `controllers/leaderboardController.js` | Ranking logic |
| Geospatial math | `utils/geoUtils.js` | Distance/area calculations |
| Overlap handling | `utils/territoryOverlapHandler.js` | Territory conflicts |
| Run page UI | `public/js/run.js` | GPS tracker frontend |
| Home page UI | `public/js/home.js` | Dashboard logic |
| Styling | `public/css/style.css` | Main styles |

## Adding New Features

### 1. New API Endpoint

**Step 1:** Create route file in `routes/`
```javascript
// routes/newRoutes.js
const express = require('express');
const router = express.Router();
router.get('/new-endpoint', controller.handler);
module.exports = router;
```

**Step 2:** Create controller in `controllers/`
```javascript
// controllers/newController.js
exports.handler = async (req, res) => {
  // Implementation
};
```

**Step 3:** Register in `server.js`
```javascript
app.use('/api/new', require('./routes/newRoutes'));
```

### 2. New Database Table

**Step 1:** Add SQL to `config/database.sql`
```sql
CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  ...
);
```

**Step 2:** Create model in `models/`
```javascript
// models/NewTable.js
class NewTable {
  static async create(data) {
    // Implementation
  }
}
module.exports = NewTable;
```

### 3. New EJS Template

**Step 1:** Create file in `views/`
```ejs
<!-- views/newpage.ejs -->
<!DOCTYPE html>
<html>
  <body>
    <%= yourData %>
  </body>
</html>
```

**Step 2:** Add route in `server.js`
```javascript
app.get('/newpage', (req, res) => {
  res.render('newpage', { data: {} });
});
```

## Testing Quick Commands

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Territories
```bash
curl http://localhost:3000/api/territory/all | jq
```

### Get Leaderboard
```bash
curl "http://localhost:3000/api/leaderboard/area?limit=10" | jq
```

## Debugging Tips

### Enable SQL Logging
```javascript
// In config/database.js - add query logging
pool.on('query', (query) => {
  console.log('SQL:', query.text);
});
```

### Check JWT Token
```javascript
// Decode JWT in browser console
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Browser DevTools - Geolocation Mock
```javascript
// In Chrome DevTools Console
navigator.geolocation.getCurrentPosition = (success) => {
  success({
    coords: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10
    }
  });
};
```

## Performance Tips

1. **Database Indexes:** Already created on frequently queried columns
2. **JWT Caching:** Token stored in localStorage (client-side)
3. **API Response:** Use query parameters to limit data

```javascript
// Example: Limit leaderboard results
GET /api/leaderboard/area?limit=5
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No token provided" | Ensure JWT is stored in localStorage after login |
| "Invalid token" | Token expired, re-login required |
| "Database connection failed" | Check PostgreSQL is running and .env settings |
| "Geolocation not working" | Check browser permissions, HTTPS in production |
| "Map not displaying" | Verify Leaflet.js CDN is loading, map container has height |

## Node Modules

```json
{
  "express": "REST API framework",
  "ejs": "Template engine",
  "pg": "PostgreSQL client",
  "jsonwebtoken": "JWT tokens",
  "bcryptjs": "Password hashing",
  "turf": "Geospatial calculations",
  "cors": "Cross-origin requests",
  "dotenv": "Environment variables"
}
```

## Notes for Team Integration

- **Login/Signup Pages:** Implemented by another team (placeholder URLs in server.js)
- **Token Storage:** Use localStorage.setItem('token', response.token)
- **Protected Routes:** Add Authorization header with token
- **API Base:** All endpoints use `/api/` prefix
- **CORS:** Enabled for all origins (restrict in production)

### Integration Checklist
- [ ] Login page stores token in localStorage
- [ ] Routes check for token before accessing protected pages
- [ ] Logout clears localStorage
- [ ] Token refresh logic implemented (optional)
- [ ] Error handling for 401 responses

---

**Last Updated:** January 2024
**For Issues:** Check README.md, API_DOCUMENTATION.md, or IMPLEMENTATION_SUMMARY.md
