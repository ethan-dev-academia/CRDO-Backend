# CRDO Backend - Gamified Running App

A comprehensive backend for CRDO, a gamified running app where users can run, earn achievements, and connect with friends.

## 🏗️ Database Schema

The app uses the following tables:

- **`runs`** - Track user running sessions with distance, duration, and speed data
- **`streaks`** - Track consecutive running days and longest streaks
- **`achievements`** - Store user achievements with points system
- **`friends`** - Manage friend relationships and requests
- **`crdo_backend`** - Aggregated user data and social state
- **`wallets`** - User coin balances
- **`daily_challenges`** - Daily running challenges

## 🚀 API Endpoints

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Start Run
**POST** `/functions/v1/startRun`

Starts a new running session.

**Response:**
```json
{
  "message": "Run started successfully",
  "runId": "uuid",
  "startedAt": "2025-07-29T20:00:00Z"
}
```

### 2. Finish Run
**POST** `/functions/v1/finishRun`

Completes a running session and processes achievements and streaks.

**Request Body:**
```json
{
  "runId": "uuid",
  "distance": 5000,
  "duration": 1800,
  "averageSpeed": 2.78,
  "peakSpeed": 3.5
}
```

**Response:**
```json
{
  "message": "Run completed successfully",
  "runId": "uuid",
  "streak": {
    "current_streak": 5,
    "longest_streak": 10,
    "last_run_date": "2025-07-29"
  },
  "achievements": ["5K Runner", "Week Warrior", "Speed Demon"]
}
```

### 3. Get User Stats
**GET** `/functions/v1/getUserStats`

Retrieves comprehensive user statistics and progress.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "stats": {
    "totalRuns": 25,
    "totalDistance": 125000,
    "totalDuration": 90000,
    "averageDistance": 5000,
    "averageDuration": 3600,
    "totalPoints": 450,
    "weeklyRuns": 5,
    "weeklyDistance": 25000,
    "weeklyDuration": 18000
  },
  "streak": {
    "current_streak": 5,
    "longest_streak": 10,
    "last_run_date": "2025-07-29",
    "freeze_count": 0
  },
  "achievements": [...],
  "friends": {
    "accepted": 5,
    "pendingRequests": 2,
    "sentRequests": 1,
    "total": 8
  },
  "recentRuns": [...]
}
```

### 4. Send Friend Request
**POST** `/functions/v1/sendFriendRequest`

Send a friend request to another user by email.

**Request Body:**
```json
{
  "friendEmail": "friend@example.com"
}
```

**Response:**
```json
{
  "message": "Friend request sent successfully",
  "friendRequest": {
    "id": "uuid",
    "user_id": "uuid",
    "friend_id": "uuid",
    "status": "pending",
    "requested_at": "2025-07-29T20:00:00Z"
  }
}
```

### 5. Respond to Friend Request
**POST** `/functions/v1/respondToFriendRequest`

Accept or reject a friend request.

**Request Body:**
```json
{
  "requestId": "uuid",
  "action": "accept" // or "reject"
}
```

**Response:**
```json
{
  "message": "Friend request accepted successfully",
  "status": "accepted"
}
```

### 6. Get Friends
**GET** `/functions/v1/getFriends`

Retrieves user's friends list and pending requests.

**Response:**
```json
{
  "friends": [
    {
      "id": "uuid",
      "email": "friend@example.com",
      "relationshipId": "uuid",
      "status": "accepted",
      "requestedAt": "2025-07-29T20:00:00Z",
      "respondedAt": "2025-07-29T20:05:00Z"
    }
  ],
  "pendingRequests": [...],
  "sentRequests": [...],
  "totalFriends": 5,
  "totalPendingRequests": 2,
  "totalSentRequests": 1
}
```

### 7. Get Dashboard
**GET** `/functions/v1/getDashboard`

Retrieves dashboard data including streaks, wallet, recent runs, and daily challenges.

**Response:**
```json
{
  "streak": {...},
  "wallet": {...},
  "recentRuns": [...],
  "todayChallenge": {...}
}
```

## 🎯 Achievement System

Users can earn achievements for:

### Distance-based:
- **5K Runner** (50 points) - Complete a 5km run
- **10K Runner** (100 points) - Complete a 10km run

### Streak-based:
- **Week Warrior** (75 points) - Maintain a 7-day streak
- **Monthly Master** (200 points) - Maintain a 30-day streak

### Speed-based:
- **Speed Demon** (150 points) - Maintain an average speed of 3 m/s

## 👥 Friends System

Users can connect with friends through a comprehensive social system:

1. **Send Friend Requests** - Send requests to other users by email
2. **Accept/Reject Requests** - Manage incoming friend requests
3. **View Friends List** - See all accepted friends
4. **Track Social Stats** - Monitor friend count and request status

## 🏃‍♂️ Streak System

- Tracks consecutive days of running
- Maintains longest streak record
- Includes freeze count for streak protection
- Resets streak if a day is missed

## 🔧 Development

### Prerequisites
- Supabase CLI
- Node.js (for local development)

### Setup
1. Clone the repository
2. Install Supabase CLI
3. Run `supabase start` to start local development
4. Apply migrations: `supabase db reset`

### Testing Functions
```bash
# Start the functions server
supabase functions serve --env-file ./supabase/.env --no-verify-jwt

# Test a function
curl -X POST http://127.0.0.1:54321/functions/v1/startRun \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

## 📊 Data Flow

1. **Start Run** → Creates run record
2. **Finish Run** → Updates run data, processes streaks, checks achievements
3. **Earn Points** → Points from achievements for social features
4. **Connect Friends** → Send/accept friend requests
5. **Track Progress** → View stats, streaks, achievements, and social connections

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- JWT authentication required for all endpoints
- Service role key used for admin operations

## 🚀 Deployment

Functions can be deployed to Supabase Edge Functions:

```bash
supabase functions deploy
```

## 📝 Environment Variables

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for client operations 