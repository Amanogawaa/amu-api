import type { CreateLessonDTO, UpdateLessonDTO } from "./types";

export class LessonValidation {
  static validateCreateLesson(data: CreateLessonDTO): void {
    const errors: string[] = [];

    if (!data.chapterId || data.chapterId.trim() === "") {
      errors.push("Chapter ID is required");
    }

    if (!data.courseId || data.courseId.trim() === "") {
      errors.push("Course ID is required");
    }

    if (data.lessonOrder === undefined || data.lessonOrder < 1) {
      errors.push("Lesson order must be at least 1");
    }

    if (!data.lessonName || data.lessonName.trim() === "") {
      errors.push("Lesson name is required");
    }

    if (!data.type || data.type.trim() === "") {
      errors.push("Lesson type is required");
    }

    if (!data.duration || data.duration.trim() === "") {
      errors.push("Duration is required");
    }

    if (!data.lessonDescription || data.lessonDescription.trim() === "") {
      errors.push("Lesson description is required");
    }

    if (!data.learningOutcome || data.learningOutcome.trim() === "") {
      errors.push("Learning outcome is required");
    }

    if (!Array.isArray(data.resources)) {
      errors.push("Resources must be an array");
    }

    if (!Array.isArray(data.prerequisites)) {
      errors.push("Prerequisites must be an array");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  static validateUpdateLesson(data: UpdateLessonDTO): void {
    const errors: string[] = [];

    if (data.lessonName !== undefined && data.lessonName.trim() === "") {
      errors.push("Lesson name cannot be empty");
    }

    if (data.type !== undefined && data.type.trim() === "") {
      errors.push("Lesson type cannot be empty");
    }

    if (data.duration !== undefined && data.duration.trim() === "") {
      errors.push("Duration cannot be empty");
    }

    if (
      data.lessonDescription !== undefined &&
      data.lessonDescription.trim() === ""
    ) {
      errors.push("Lesson description cannot be empty");
    }

    if (
      data.learningOutcome !== undefined &&
      data.learningOutcome.trim() === ""
    ) {
      errors.push("Learning outcome cannot be empty");
    }

    if (data.resources !== undefined && !Array.isArray(data.resources)) {
      errors.push("Resources must be an array");
    }

    if (
      data.prerequisites !== undefined &&
      !Array.isArray(data.prerequisites)
    ) {
      errors.push("Prerequisites must be an array");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
