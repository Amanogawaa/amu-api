import { GoogleGenAI, MediaResolution } from '@google/genai';
import { logger } from '../../utils/loggers';
import { generateCoursePrompt } from '../../utils/prompts/course-temp';
import { CourseRepository } from './repository';
import { AppError } from '../../utils/errors';

import { geminiCall } from '../../utils/geminiCall';
import {
  type CourseQueryParams,
  type Course,
  type GenerateCourseRequest,
  courseSchema,
} from './types';

export class CourseService {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  public async getCourses(params?: CourseQueryParams): Promise<Course[]> {
    try {
      const courses = await this.courseRepository.getCourse(params);
      return courses;
    } catch (error) {
      logger.error('Error in CoursesService.getCourses:', error);
      throw error;
    }
  }

  public async getCourseById(slug: string): Promise<Course> {
    try {
      const course = await this.courseRepository.getCourseById(slug);
      return course;
    } catch (error) {
      logger.error('Error in CoursesService.getCourseById:', error);
      throw error;
    }
  }

  public async generateCourse(request: GenerateCourseRequest) {
    try {
      const prompt = this.customInstructions(request);
      const result = await geminiCall(prompt, {
        responseSchema: courseSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Course generated successfully', result);

      const courseData: Course = {
        ...result,
        uid: request.uid,
      };

      console.log('Generated course data:', courseData);

      const nameExist = await this.courseRepository.courseNameExists(
        courseData.name,
        courseData.uid
      );

      console.log('Course name exists:', nameExist);

      if (nameExist) {
        courseData.name = `${courseData.name} (${Date.now()})`;
      }

      const createdCourse = await this.courseRepository.createCourse(
        courseData
      );

      return createdCourse;
    } catch (error) {
      logger.error('Error in CoursesService.generateCourse:', error);
      throw error;
    }
  }

  private customInstructions(request: GenerateCourseRequest): string {
    const basePrompt = generateCoursePrompt({
      category: request.category,
      topic: request.topic,
      level: request.level,
      duration: request.duration,
      noOfModules: request.noOfModules,
      language: request.language,
    });

    if (request.userInstructions) {
      return `${basePrompt}\n\n**IMPORTANT USER FEEDBACK FOR REGENERATION:**\n${request.userInstructions}\n\nPlease adjust the content based on the above feedback while maintaining the same structure.`;
    }

    return basePrompt;
  }

  public async deleteCourse(courseId: string): Promise<void> {
    try {
      await this.courseRepository.deleteCourse(courseId);
    } catch (error) {
      logger.error('Error in CoursesService.deleteCourse:', error);
      throw error;
    }
  }

  public async validateCourseCompleteness(courseId: string): Promise<{
    isComplete: boolean;
    missingComponents: string[];
    details: {
      hasModules: boolean;
      modulesCount: number;
      hasChapters: boolean;
      chaptersCount: number;
      hasLessons: boolean;
      lessonsCount: number;
    };
  }> {
    try {
      const firestore = this.courseRepository['firebaseStore'];

      const modulesSnapshot = await firestore
        .collection('modules')
        .where('courseId', '==', courseId)
        .get();
      const hasModules = !modulesSnapshot.empty;
      const modulesCount = modulesSnapshot.size;

      const moduleIds = modulesSnapshot.docs.map((doc) => doc.id);

      let hasChapters = false;
      let chaptersCount = 0;
      let chapterIds: string[] = [];

      if (moduleIds.length > 0) {
        const chapterPromises = [];
        for (let i = 0; i < moduleIds.length; i += 10) {
          const batch = moduleIds.slice(i, i + 10);
          chapterPromises.push(
            firestore
              .collection('chapters')
              .where('moduleId', 'in', batch)
              .get()
          );
        }

        const chapterSnapshots = await Promise.all(chapterPromises);
        chapterSnapshots.forEach((snapshot) => {
          chaptersCount += snapshot.size;
          chapterIds.push(...snapshot.docs.map((doc) => doc.id));
        });

        hasChapters = chaptersCount > 0;
      }

      let hasLessons = false;
      let lessonsCount = 0;

      if (chapterIds.length > 0) {
        const lessonPromises = [];
        for (let i = 0; i < chapterIds.length; i += 10) {
          const batch = chapterIds.slice(i, i + 10);
          lessonPromises.push(
            firestore
              .collection('lessons')
              .where('chapterId', 'in', batch)
              .get()
          );
        }

        const lessonSnapshots = await Promise.all(lessonPromises);
        lessonSnapshots.forEach((snapshot) => {
          lessonsCount += snapshot.size;
        });

        hasLessons = lessonsCount > 0;
      }

      const missingComponents: string[] = [];
      if (!hasModules) missingComponents.push('modules');
      if (!hasChapters) missingComponents.push('chapters');
      if (!hasLessons) missingComponents.push('lessons');

      return {
        isComplete: hasModules && hasChapters && hasLessons,
        missingComponents,
        details: {
          hasModules,
          modulesCount,
          hasChapters,
          chaptersCount,
          hasLessons,
          lessonsCount,
        },
      };
    } catch (error) {
      logger.error('Error in CourseService.validateCourseCompleteness:', error);
      throw error;
    }
  }

  public async publishCourse(courseId: string): Promise<Course> {
    try {
      const validation = await this.validateCourseCompleteness(courseId);

      if (!validation.isComplete) {
        throw new AppError(
          `Cannot publish course. Missing: ${validation.missingComponents.join(
            ', '
          )}`,
          400
        );
      }

      await this.courseRepository.updateCourse(courseId, {
        publish: true,
        archive: false,
      });

      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error('Error in CourseService.publishCourse:', error);
      throw error;
    }
  }

  public async unpublishCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { publish: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error('Error in CourseService.unpublishCourse:', error);
      throw error;
    }
  }

  public async archiveCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, {
        archive: true,
        publish: false,
      });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error('Error in CourseService.archiveCourse:', error);
      throw error;
    }
  }

  public async unarchiveCourse(courseId: string): Promise<Course> {
    try {
      await this.courseRepository.updateCourse(courseId, { archive: false });
      return await this.courseRepository.getCourseById(courseId);
    } catch (error) {
      logger.error('Error in CourseService.unarchiveCourse:', error);
      throw error;
    }
  }
}
