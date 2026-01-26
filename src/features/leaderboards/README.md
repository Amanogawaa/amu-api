# Leaderboards Feature

A comprehensive leaderboards and user statistics tracking system with streak functionality.

## Features

- **User Statistics Tracking**: Automatically tracks lessons completed, courses completed, and points earned
- **Streak System**: Tracks current and longest learning streaks
- **Leaderboards**: Rankings by score, lessons completed, courses completed, or streak
- **User Rankings**: Get a specific user's rank on the leaderboard
- **Automatic Integration**: Automatically updates when users complete lessons/courses

## API Endpoints

### GET /api/leaderboards

Get the global leaderboard.

**Query Parameters:**

- `limit` (optional, default: 100) - Number of entries to return
- `sortBy` (optional, default: "score") - Sort criteria: "score", "lessons", "courses", or "streak"
- `period` (optional) - Time period filter: "all-time", "monthly", or "weekly" (not yet implemented)

**Response:**

```json
{
  "data": [
    {
      "userId": "user123",
      "userName": "John Doe",
      "photoURL": "https://...",
      "rank": 1,
      "score": 1500,
      "lessonsCompleted": 150,
      "coursesCompleted": 15,
      "currentStreak": 7,
      "longestStreak": 30,
      "lastActiveAt": "2026-01-26T10:00:00Z"
    }
  ],
  "total": 100,
  "userRank": 5,
  "message": "Leaderboards fetched successfully"
}
```

### GET /api/leaderboards/stats

Get overall leaderboard statistics.

**Response:**

```json
{
  "data": {
    "totalUsers": 1000,
    "totalLessonsCompleted": 15000,
    "totalCoursesCompleted": 1500
  },
  "message": "Leaderboard stats fetched successfully"
}
```

### GET /api/leaderboards/user/:userId?

Get statistics for a specific user (or current user if authenticated and no userId provided).

**Response:**

```json
{
  "data": {
    "totalLessonsCompleted": 150,
    "totalCoursesCompleted": 15,
    "totalPoints": 1500,
    "currentStreak": 7,
    "longestStreak": 30,
    "lastActiveAt": "2026-01-26T10:00:00Z",
    "streakStartDate": "2026-01-20T00:00:00Z",
    "rank": 5
  },
  "message": "User stats fetched successfully"
}
```

### POST /api/leaderboards/streak

Update the user's streak (requires authentication).

**Request Body:**

```json
{
  "activityDate": "2026-01-26T10:00:00Z" // optional, defaults to now
}
```

**Response:**

```json
{
  "data": {
    "currentStreak": 8,
    "longestStreak": 30,
    "lastActiveAt": "2026-01-26T10:00:00Z",
    "streakStartDate": "2026-01-19T00:00:00Z"
  },
  "message": "Streak updated successfully"
}
```

## Automatic Integration

The leaderboards feature is automatically integrated with the progress tracking system:

### Lesson Completion

When a user completes a lesson through the progress API, the system automatically:

1. Increments `totalLessonsCompleted` by 1
2. Adds 10 points to `totalPoints`
3. Updates the user's activity streak

### Course Completion

When a user completes a course (reaches 100% progress), the system automatically:

1. Increments `totalCoursesCompleted` by 1
2. Adds 100 points to `totalPoints`

## Streak Calculation Logic

The streak system works as follows:

1. **First Activity**: Sets current streak to 1, longest streak to 1
2. **Same Day Activity**: No change to streak counts
3. **Consecutive Day Activity**: Increments current streak by 1, updates longest if needed
4. **Broken Streak** (gap > 1 day): Resets current streak to 1, preserves longest streak

## Points System

- **Lesson Completion**: 50 XP
- **Course Completion**: 150 XP (bonus)
- Total points are used for the default leaderboard ranking

## Database Collections

### userStats Collection

Stores user statistics and streak data:

```typescript
{
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date;
  streakStartDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Example

### Client-Side Integration

```typescript
// Get leaderboard (top 50 by score)
const response = await fetch("/api/leaderboards?limit=50&sortBy=score");
const { data } = await response.json();

// Get user's own stats
const userStats = await fetch("/api/leaderboards/user");
const { data: stats } = await userStats.json();
console.log(`Current streak: ${stats.currentStreak} days`);

// Manually update streak (usually automatic)
await fetch("/api/leaderboards/streak", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
});
```

## Future Enhancements

- [ ] Time-based leaderboards (weekly, monthly)
- [ ] Course-specific leaderboards
- [ ] Achievement badges
- [ ] Streak freeze/protection
- [ ] Leaderboard pagination
- [ ] Custom point values per lesson/course
- [ ] Social sharing of achievements
