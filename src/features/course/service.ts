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
        noOfChapters: request.noOfChapters,
        language: request.language,
      });

      const result = await geminiCall(prompt, courseSchema);
      const courseData = JSON.parse(result!);

      logger.info('Course generated successfully');

      const createdCourse = await this.courseRepository.createCourse(
        courseData.course
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

  private async geminiCall(prompt: string) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY as string,
      });
      const model = 'gemini-2.5-pro';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model,
        config: {
          thinkingConfig: {
            thinkingBudget: -1,
          },
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              course: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  subtitle: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  topic: { type: 'string' },
                  level: { type: 'string' },
                  language: { type: 'string' },
                  prerequisites: { type: 'string' },
                  learning_outcomes: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  duration: { type: 'string' },
                  no_of_chapters: { type: 'integer' },
                  publish: { type: 'boolean' },
                  include_certificate: { type: 'boolean' },
                  banner_url: { type: 'string' },
                },
                required: [
                  'name',
                  'description',
                  'category',
                  'topic',
                  'level',
                  'language',
                  'prerequisites',
                  'learning_outcomes',
                  'duration',
                  'no_of_chapters',
                ],
              },
            },
          },
        },
        contents,
      });

      return response.text;
    } catch (error) {
      logger.error('Error in CoursesService.geminiCall:', error);
      throw error;
    }
  }
}
