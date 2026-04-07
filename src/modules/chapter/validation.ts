import type { CreateChapterDTO, UpdateChapterDTO } from "./types";

export class ChapterValidation {
  static validateCreateChapter(data: CreateChapterDTO): void {
    const errors: string[] = [];

    if (!data.courseId || data.courseId.trim() === "") {
      errors.push("Course ID is required");
    }

    if (!data.chapterName || data.chapterName.trim() === "") {
      errors.push("Chapter name is required");
    }

    if (!data.chapterDescription || data.chapterDescription.trim() === "") {
      errors.push("Chapter description is required");
    }

    if (data.chapterOrder === undefined || data.chapterOrder < 1) {
      errors.push("Chapter order must be at least 1");
    }

    if (!data.estimatedDuration || data.estimatedDuration.trim() === "") {
      errors.push("Estimated duration is required");
    }

    if (
      !Array.isArray(data.learningObjectives) ||
      data.learningObjectives.length === 0
    ) {
      errors.push("At least one learning objective is required");
    }

    if (!Array.isArray(data.keyTopics) || data.keyTopics.length === 0) {
      errors.push("At least one key topic is required");
    }

    if (!Array.isArray(data.prerequisites)) {
      errors.push("Prerequisites must be an array");
    }

    if (!data.practicalApplication || data.practicalApplication.trim() === "") {
      errors.push("Practical application is required");
    }

    if (
      data.estimatedLessonCount === undefined ||
      data.estimatedLessonCount < 1
    ) {
      errors.push("Estimated lesson count must be at least 1");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  static validateUpdateChapter(data: UpdateChapterDTO): void {
    const errors: string[] = [];

    if (data.chapterName !== undefined && data.chapterName.trim() === "") {
      errors.push("Chapter name cannot be empty");
    }

    if (
      data.chapterDescription !== undefined &&
      data.chapterDescription.trim() === ""
    ) {
      errors.push("Chapter description cannot be empty");
    }

    if (data.chapterOrder !== undefined && data.chapterOrder < 1) {
      errors.push("Chapter order must be at least 1");
    }

    if (
      data.estimatedDuration !== undefined &&
      data.estimatedDuration.trim() === ""
    ) {
      errors.push("Estimated duration cannot be empty");
    }

    if (
      data.learningObjectives !== undefined &&
      (!Array.isArray(data.learningObjectives) ||
        data.learningObjectives.length === 0)
    ) {
      errors.push("At least one learning objective is required");
    }

    if (
      data.keyTopics !== undefined &&
      (!Array.isArray(data.keyTopics) || data.keyTopics.length === 0)
    ) {
      errors.push("At least one key topic is required");
    }

    if (
      data.prerequisites !== undefined &&
      !Array.isArray(data.prerequisites)
    ) {
      errors.push("Prerequisites must be an array");
    }

    if (
      data.estimatedLessonCount !== undefined &&
      data.estimatedLessonCount < 1
    ) {
      errors.push("Estimated lesson count must be at least 1");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
