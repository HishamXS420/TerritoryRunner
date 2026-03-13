# Territory-Based Running and Fitness Tracking Application

A gamified running and fitness tracking application where users capture geographic territories through running activities.

## Features

- **GPS-based running tracker** with route visualization
- **Territory capture** when completing a closed running loop
- **Map display** showing owned territories
- **Territory challenge/takeover** functionality
- **Leaderboard** based on captured area or distance
- **Running statistics** (time, calories, distance)
- **Activity history** tracking
- **JWT-based authentication** system

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Leaflet.js, OpenStreetMap
- **Database**: PostgreSQL
- **Geo Processing**: Turf.js
- **Authentication**: JWT

## Deploy Full App (Login + API + Database)

If you want `/login`, `/signup`, and all `/api/*` routes to work online, deploy this as a **Node.js server** (not GitHub Pages).

### Recommended: Render (with PostgreSQL)

This repository now includes `render.yaml` for Blueprint deployment.

1. Push code to your GitHub repo (`HishamXS420/Territory-Runner`)
2. In Render dashboard, click **New +** → **Blueprint**
3. Select this repository and deploy
4. After first deploy, open Render Shell for the web service and run:

```bash
node init-db.js
```

5. Open your live URL:
	- `https://<your-service>.onrender.com/login`
	- `https://<your-service>.onrender.com/signup`
	- `https://<your-service>.onrender.com/`

### Important Notes

- GitHub Pages only serves static files, so it cannot run this Express + PostgreSQL app.
- Use `init-db.js` in hosted environments to create tables only.
- Avoid `setup-db.js` in production, because it drops and recreates the database.

## Project Structure

```
├── config/
│   ├── database.js          # Database connection configuration
│   └── database.sql         # SQL schema for database setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── runController.js     # Running session logic
│   ├── territoryController.js # Territory management logic
│   └── leaderboardController.js # Leaderboard logic
├── models/
│   ├── User.js              # User model
│   ├── RunningSession.js    # Running session model
│   ├── RouteCoordinate.js   # Route coordinates model
│   ├── Territory.js         # Territory model
│   └── UserStatistics.js    # User statistics model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── runRoutes.js         # Running session routes
│   ├── territoryRoutes.js   # Territory routes
│   └── leaderboardRoutes.js # Leaderboard routes
├── middleware/
│   └── authMiddleware.js    # JWT authentication middleware
├── utils/
│   └── geoUtils.js          # Geospatial utility functions
├── views/
│   ├── home.ejs             # Home page template
│   ├── run.ejs              # Run page template
│   └── leaderboard.ejs      # Leaderboard page template
├── public/
│   ├── css/
│   │   ├── style.css        # Main stylesheet
│   │   ├── run.css          # Run page styles
│   │   └── leaderboard.css  # Leaderboard styles
│   └── js/
│       ├── home.js          # Home page script
│       ├── run.js           # Run page script
│       └── leaderboard.js   # Leaderboard script
├── server.js                # Main Express server
├── package.json             # Project dependencies
├── .env                     # Environment variables (configure these)
└── README.md                # This file
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Git

### 1. Clone and Setup

```bash
cd "d:\Study\4.1\Attachment\Territory App\Test4"
npm install
```

### 2. Database Setup

**Option A: Using PostgreSQL Command Line**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE territory_running_app;

# Connect to the new database
\c territory_running_app

# Run the schema setup
\i config/database.sql
```

**Option B: Using Node.js Script** (Coming soon)

### 3. Configure Environment Variables

Edit `.env` file and set your configuration:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=territory_running_app
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d

# Application URL
APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will be running at: `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Running Sessions

- `POST /api/run/start` - Start a running session (Protected)
- `POST /api/run/:sessionId/coordinate` - Add GPS coordinate (Protected)
- `POST /api/run/:sessionId/pause` - Pause session (Protected)
- `POST /api/run/:sessionId/finish` - Finish session (Protected)
- `GET /api/run/:sessionId` - Get session details (Protected)
- `GET /api/run/history/all` - Get user's run history (Protected)

### Territories

- `GET /api/territory/all` - Get all territories
- `GET /api/territory/bounds` - Get territories in bounding box
- `GET /api/territory/:territoryId` - Get territory details
- `GET /api/territory/user/territories` - Get user's territories (Protected)

### Leaderboard

- `GET /api/leaderboard/area` - Get leaderboard by territory area
- `GET /api/leaderboard/distance` - Get leaderboard by distance
- `GET /api/leaderboard/rank/area` - Get user's rank by area (Protected)
- `GET /api/leaderboard/rank/distance` - Get user's rank by distance (Protected)

## Key Features Implemented

### 1. GPS Tracking
- Continuous location tracking every 5 seconds
- High accuracy geolocation enabled
- Route visualization on Leaflet map

### 2. Territory Capture
- Closed loop detection (start and end within 50 meters)
- Polygon conversion and area calculation
- Territory ownership and visualization

### 3. Statistics Tracking
- Distance calculation
- Calorie estimation (based on average user weight)
- Running time tracking
- Area captured tracking

### 4. Database Storage
- User authentication with bcrypt password hashing
- Running session history
- Route coordinate storage
- Territory polygon storage with ownership

### 5. Leaderboard System
- Rank users by total territory area
- Rank users by total running distance
- User rank calculation

## Usage

### Starting a Run

1. Click "Start Running" on the home page
2. The app will request GPS permission
3. Map will center on current location
4. Run your route and complete a closed loop
5. Click "Finish" to end the session
6. If valid closed loop detected, territory is captured

### Viewing Territories

- All territories are displayed on the map as colored polygons
- Markers at center of each territory show owner username
- Home page shows recent running sessions

### Checking Leaderboard

- View top runners by territory area or distance
- See your current rank based on criteria

## Technical Details

### Closed Loop Detection

A running route is considered a closed loop when:
- The distance between the start point and end point is ≤ 50 meters
- At least 2 coordinate points are recorded

### Area Calculation

- Uses Turf.js for polygon area calculation
- Polygon is created from running coordinates
- Area stored in square meters

### Distance Calculation

- Uses Haversine formula for geographic distance calculation
- Accumulates distance between all consecutive coordinate points
- Result stored in kilometers

### Calorie Estimation

- Formula: `distance (km) × weight (kg) × 0.63`
- Assumes average user weight of 70 kg
- Adjusted based on running speed and terrain

## Integration Notes

This application integrates with existing login/signup pages. The pages are implemented using:
- EJS templates for rendering
- Client-side JWT token storage in localStorage
- Token-based API authentication

Login and signup pages should:
1. Store JWT token in localStorage
2. Redirect authenticated users to home page
3. Handle token validation and refresh

## Future Enhancements

- [ ] Territory conflict handling with automatic boundary adjustment
- [ ] Google/Apple login integration
- [ ] Real-time territory challenges
- [ ] Social features (friends, competitions)
- [ ] Advanced statistics and analytics
- [ ] Mobile app development
- [ ] Offline mode support
- [ ] Territory trading/purchasing

## Troubleshooting

### Database Connection Issues

Check `.env` file settings and ensure PostgreSQL service is running.

### GPS Not Working

- Check browser's location permission settings
- Ensure HTTPS is used in production
- Some browsers require user interaction to enable geolocation

### Map Not Displaying

- Verify Leaflet.js and OpenStreetMap CDN links are loading
- Check browser console for errors
- Ensure map container has proper CSS styling

## Support

For issues or questions, please refer to the documentation or contact the development team.

## License

MIT
