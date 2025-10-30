import { GoogleGenAI, MediaResolution } from '@google/genai';
import { logger } from '../../utils/loggers';
import { generateCoursePrompt } from '../../utils/prompts/course-temp';
import { CourseRepository } from './repository';

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
      const prompt = generateCoursePrompt({
        category: request.category,
        topic: request.topic,
        level: request.level,
        duration: request.duration,
        noOfModules: request.noOfModules,
        language: request.language,
      });

      const result = await geminiCall(prompt, {
        responseSchema: courseSchema,
        temperature: 0.7,
        maxRetries: 3,
      });

      logger.info('Course generated successfully', result);

      const courseData = {
        ...result,
        uid: request.uid,
      };

      const createdCourse = await this.courseRepository.createCourse(
        courseData
      );

      return createdCourse;
    } catch (error) {
      logger.error('Error in CoursesService.generateCourse:', error);
      throw error;
    }
  }

  public async deleteCourse(slug: string): Promise<void> {
    try {
      await this.courseRepository.deleteCourse(slug);
    } catch (error) {
      logger.error('Error in CoursesService.deleteCourse:', error);
      throw error;
    }
  }
}
