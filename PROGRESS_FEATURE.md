# User Progress Feature

## Overview

The user progress feature tracks learner progress through courses and lessons, providing real-time statistics and completion tracking.

## Backend API

### Endpoints

#### 1. Mark Lesson Progress

**POST** `/api/progress`

Mark a lesson as complete or incomplete.

**Request Body:**

```json
{
  "courseId": "course123",
  "lessonId": "lesson456",
  "completed": true
}
```

**Response:**

```json
{
  "data": {
    "id": "course123_user789",
    "courseId": "course123",
    "userId": "user789",
    "lessonsCompleted": ["lesson456"],
    "totalLessons": 10,
    "percentComplete": 10,
    "lastActivityAt": "2025-11-02T10:00:00Z",
    "enrolledAt": "2025-11-01T08:00:00Z"
  },
  "message": "Progress updated successfully"
}
```

#### 2. Get Progress Summary

**GET** `/api/progress/summary`

Get aggregated progress statistics for the authenticated user.

**Response:**

```json
{
  "data": {
    "totalCourses": 5,
    "coursesInProgress": 3,
    "coursesCompleted": 2,
    "totalLessonsCompleted": 45,
    "progressByCourseName": [
      {
        "courseId": "course123",
        "courseName": "TypeScript Basics",
        "percentComplete": 75,
        "lessonsCompleted": 15,
        "totalLessons": 20
      }
    ]
  },
  "message": "Progress summary retrieved successfully"
}
```

#### 3. Get All User Progress

**GET** `/api/progress/me`

Get progress for all courses the user is enrolled in.

#### 4. Get Progress for Course

**GET** `/api/progress/course/:courseId`

Get user's progress for a specific course.

#### 5. Delete Progress

**DELETE** `/api/progress/course/:courseId`

Reset progress for a specific course.

#### 6. Get Course Statistics (Admin/Owner)

**GET** `/api/progress/course/:courseId/stats`

Get enrollment and completion statistics for a course.

**Response:**

```json
{
  "data": {
    "totalEnrolled": 150,
    "averageCompletion": 65,
    "completedCount": 45
  },
  "message": "Course statistics retrieved successfully"
}
```

## Frontend Usage

### Hooks

#### useMarkLessonProgress

```tsx
import { useMarkLessonProgress } from '@/features/progress/application/useProgress';

function LessonComponent() {
  const markProgress = useMarkLessonProgress();

  const handleComplete = () => {
    markProgress.mutate({
      courseId: 'course123',
      lessonId: 'lesson456',
      completed: true,
    });
  };

  return <button onClick={handleComplete}>Mark Complete</button>;
}
```

#### useProgressSummary

```tsx
import { useProgressSummary } from '@/features/progress/application/useProgress';

function ProfilePage() {
  const { data, isLoading } = useProgressSummary();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <p>Total Courses: {data?.totalCourses}</p>
      <p>Completed: {data?.coursesCompleted}</p>
    </div>
  );
}
```

#### useProgressForCourse

```tsx
import { useProgressForCourse } from '@/features/progress/application/useProgress';

function CourseDetailPage({ courseId }: { courseId: string }) {
  const { data: progress } = useProgressForCourse(courseId);

  return (
    <div>
      <p>Progress: {progress?.percentComplete}%</p>
      <p>Lessons completed: {progress?.lessonsCompleted.length}</p>
    </div>
  );
}
```

### UI Components

#### ProgressBar

```tsx
import { ProgressBar } from '@/features/progress/presentation/ProgressBar';

<ProgressBar percent={75} showLabel size="md" />;
```

#### CourseStatusBadge

```tsx
import { CourseStatusBadge } from '@/features/progress/presentation/CourseStatusBadge';

<CourseStatusBadge percentComplete={50} />;
// Shows "In Progress" badge
```

#### ProgressCard

```tsx
import { ProgressCard } from '@/features/progress/presentation/ProgressCard';

<ProgressCard
  progress={userProgress}
  courseName="TypeScript Course"
  courseDescription="Learn TypeScript from scratch"
/>;
```

## Database Schema

### Collection: `userProgress`

```typescript
{
  id: string;                  // Composite: "courseId_userId"
  courseId: string;            // Reference to course
  userId: string;              // Reference to user
  lessonsCompleted: string[];  // Array of completed lessonIds
  totalLessons: number;        // Denormalized total for quick calc
  percentComplete: number;     // 0-100
  lastActivityAt: Date;        // Last update timestamp
  enrolledAt: Date;            // First enrollment timestamp
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes Required (Firestore)

- `userId` (for querying user's progress)
- `courseId` (for course statistics)
- Composite index: `userId + lastActivityAt` (for sorting)

## Features Implemented

✅ Track lesson completion per course
✅ Calculate completion percentage
✅ Aggregate progress summary across all courses
✅ Course statistics for instructors
✅ React Query integration with automatic cache invalidation
✅ Responsive UI components for progress visualization
✅ Profile page showing all enrolled courses
✅ Real-time progress updates with optimistic UI
✅ Swagger documentation for all endpoints

## TODO / Future Enhancements

- [ ] Add course name resolution in summary (currently shows empty courseName)
- [ ] Integrate with enrollment feature (create progress on enrollment)
- [ ] Add badges/achievements for milestones
- [ ] Track time spent per lesson
- [ ] Add progress streaks and daily goals
- [ ] Export progress reports (PDF/CSV)
- [ ] Progress notifications/reminders
- [ ] Sync totalLessons when course structure changes

## Testing

### Backend Testing

```bash
cd amu-api
bun run dev

# Test with curl
curl -X POST http://localhost:8080/api/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"test123","lessonId":"lesson1","completed":true}'
```

### Frontend Testing

```bash
cd amu
bun run dev
# Navigate to http://localhost:3000/account
```

## Authentication

All progress endpoints require authentication via `authMiddleware`. Include Firebase ID token in Authorization header or cookie.

## Error Handling

- 401: Unauthorized (missing/invalid token)
- 404: Progress not found (for GET requests on new courses)
- 400: Invalid request body
- 500: Server error

## Performance Considerations

- Progress updates use transactions for consistency
- Denormalized `totalLessons` to avoid heavy aggregation
- Consider caching course statistics (currently computed on-demand)
- React Query provides client-side caching with 5min stale time
