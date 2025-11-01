# Content Regeneration Guide

## Problem Statement

Users may want to regenerate AI-generated content (modules, chapters, lessons) if they:

- Don't understand the current content presentation
- Want alternative explanations or approaches
- Need content adjusted to their learning style

**Challenge**: The content hierarchy has dependent relationships:

```
Course → Modules → Chapters → Lessons
         (by ID)    (by ID)    (by ID)
```

Deleting and recreating would break referential integrity and lose user progress/bookmarks.

## Solution: In-Place Content Update

**Strategy**: Regenerate content while preserving all IDs and relationships.

### Key Principles

1. **ID Preservation**: Never change document IDs - they're the foreign keys
2. **Order-Based Mapping**: Use `moduleOrder`, `chapterOrder`, `lessonOrder` to map new content to existing entities
3. **Batch Updates**: Use Firestore batch writes for atomicity
4. **User Feedback**: Accept optional `userInstructions` to guide regeneration

### Flow Diagram

```
User Request → Fetch Existing Entities (with IDs)
            ↓
         Sort by Order (moduleOrder/chapterOrder/lessonOrder)
            ↓
         Generate New Content via AI (same count)
            ↓
         Map New Content to Existing IDs by Index
            ↓
         Batch Update (preserve ID, createdAt, parent references)
            ↓
         Return Updated Entities
```

## Implementation

### 1. Module Regeneration

**Endpoint**: `PUT /:courseId/modules/regenerate`

**Request Body**:

```json
{
  "courseName": "Advanced TypeScript",
  "courseDescription": "Learn advanced TS patterns",
  "learningOutcomes": ["Build type-safe apps"],
  "level": "intermediate",
  "duration": "20 hours",
  "noOfModules": 5,
  "language": "English",
  "prerequisites": "Basic JavaScript",
  "userInstructions": "Make it more beginner-friendly with examples"
}
```

**Response**:

```json
{
  "data": [
    /* Module[] */
  ],
  "message": "Successfully regenerated 5 modules",
  "updated": 5,
  "errors": []
}
```

**What Gets Updated**:

- ✅ `title`, `description`, `learningObjectives`, `keySkills`, `capstoneProject`
- ✅ `estimatedDuration`, `estimatedChapterCount`
- ❌ NOT `id`, `courseId`, `courseName`, `moduleOrder`, `createdAt`

### 2. Chapter Regeneration

**Endpoint**: `PUT /:moduleId/chapters/regenerate`

**Key Fields Updated**:

- ✅ `title`, `description`, `learningObjectives`, `keyTopics`
- ✅ `estimatedDuration`, `estimatedLessonCount`
- ❌ NOT `id`, `courseId`, `chapterOrder`, relationships to lessons

### 3. Lesson Regeneration

**Endpoint**: `PUT /:chapterId/lessons/regenerate`

**Key Fields Updated**:

- ✅ `title`, `description`, `content`, `videoSearchQuery`, `resources`
- ✅ `type`, `duration`, `prerequisiteKnowledge`
- ❌ NOT `id`, `chapterId`, `lessonOrder`

## Code Structure

### Service Layer (`service.ts`)

```typescript
public async regenerateModules(request: UpdateModuleRequest) {
  // 1. Fetch existing entities
  const existing = await repository.getModules(request.courseId);

  // 2. Sort by order
  existing.sort((a, b) => a.moduleOrder - b.moduleOrder);

  // 3. Generate new content with AI
  const result = await geminiCall(enhancedPrompt, {...});

  // 4. Map to existing IDs
  const updated = existing.map((e, i) => ({
    ...e,
    ...result.modules[i],
    id: e.id, // Preserve!
    courseId: e.courseId,
    moduleOrder: e.moduleOrder,
    createdAt: e.createdAt
  }));

  // 5. Batch update
  return await repository.updateModulesBatch(updated);
}
```

### Repository Layer (`repository.ts`)

```typescript
async updateModulesBatch(modules: Module[]): Promise<{updated, errors}> {
  const batch = firestore.batch();

  for (const module of modules) {
    const docRef = collection.doc(module.id); // Use existing ID
    const {id, ...data} = module;
    batch.update(docRef, {...data, updatedAt: new Date()});
  }

  await batch.commit();
}
```

## Advantages of This Approach

✅ **No Cascade Deletion** - Child entities unaffected  
✅ **Atomic Updates** - All-or-nothing with batch writes  
✅ **User Progress Preserved** - Bookmarks/progress tied to IDs stay valid  
✅ **Flexible** - Can regenerate at any level independently  
✅ **User-Guided** - Accepts feedback for targeted improvements  
✅ **Efficient** - No delete/recreate overhead

## Alternative Approaches (Why We Didn't Use Them)

### ❌ Delete & Recreate

**Problem**: Breaks foreign key relationships, loses user data

### ❌ Version Tracking

**Problem**: Over-engineered for this use case, complicates queries

### ❌ Soft Delete with New Records

**Problem**: Requires complex migration logic, frontend changes

## Usage Examples

### Frontend Implementation

```typescript
// React hook for module regeneration
const useRegenerateModules = () => {
  return useMutation({
    mutationFn: async (data: RegenerateRequest) => {
      return axios.put(`/api/${data.courseId}/modules/regenerate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['modules']);
      toast.success('Content regenerated successfully!');
    },
  });
};

// Component
function ModuleRegenerateButton({ courseId, courseData }) {
  const { mutate, isLoading } = useRegenerateModules();

  const handleRegenerate = () => {
    mutate({
      courseId,
      ...courseData,
      userInstructions: 'Make it simpler with more examples',
    });
  };

  return (
    <Button onClick={handleRegenerate} disabled={isLoading}>
      {isLoading ? 'Regenerating...' : 'Regenerate Modules'}
    </Button>
  );
}
```

## Testing Checklist

- [ ] Verify IDs remain unchanged after regeneration
- [ ] Check child entities still reference correct parent IDs
- [ ] Test with different module/chapter/lesson counts
- [ ] Validate user instructions are incorporated into AI prompts
- [ ] Test error handling (missing entities, AI failures)
- [ ] Verify batch update atomicity (all succeed or all fail)
- [ ] Check timestamp updates (`updatedAt` changes, `createdAt` stays)

## Future Enhancements

1. **Selective Regeneration**: Allow regenerating specific modules/chapters instead of all
2. **Version History**: Keep snapshots for undo functionality
3. **Diff Preview**: Show changes before committing regeneration
4. **A/B Testing**: Generate multiple variants for users to choose from
5. **Granular Control**: Let users specify which fields to regenerate (e.g., only descriptions)

## Migration Notes

If you have existing data before this feature:

1. **No migration needed** - This feature only affects new regeneration requests
2. Existing entities remain unchanged
3. First regeneration will establish the baseline for future updates

## Support & Troubleshooting

### Common Issues

**Issue**: "No existing modules found"  
**Solution**: Use `/modules` POST endpoint first to generate initial content

**Issue**: AI generates different count than expected  
**Solution**: Code includes fallback mapping - checks and logs warnings

**Issue**: Batch update partial failure  
**Solution**: Returns `errors` array with details, successful updates still committed

**Issue**: Content quality inconsistent  
**Solution**: Adjust `temperature` parameter (lower = more consistent, higher = more creative)
