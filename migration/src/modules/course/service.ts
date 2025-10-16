import type { CourseRepository } from './repository';
import { logger } from '../../core/utils/loggers';
import { AppError } from '../../core/utils/errors';
import { generateCoursePrompt } from '../../core/prompts/course-temp';
import { COURSESCHEMA } from './validations';
import { GenerateCourseRequest, GenerateCourseResponse } from './type';

export class CourseService {
  private repository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.repository = courseRepository;
  }

  async generateCourse(
    request: GenerateCourseRequest
  ): Promise<GenerateCourseResponse> {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new AppError('Missing GROQ_API_KEY environment variable', 500);
      }
      console.log('Key', process.env.GROQ_API_KEY);

      const coursePrompt = generateCoursePrompt(request);

      const aiResponse = await this.callGroqAPI(coursePrompt);

      const parsedCourse = this.parseAIResponse(aiResponse);
      console.log('Parse', parsedCourse);

      const courseData = {
        name: parsedCourse.course.name,
        subtitle: parsedCourse.course.subtitle,
        description: parsedCourse.course.description,
        category: request.category,
        topic: request.topic,
        level: request.level,
        language: request.language,
        prerequisites: parsedCourse.course.prerequisites || [],
        learning_outcomes: parsedCourse.course.learning_outcomes || [],
        duration: request.duration,
        no_of_chapters: request.noOfChapters,
        publish: parsedCourse.course.publish ?? false,
        include_certificate: parsedCourse.course.includeCertificate ?? false,
        banner_url: parsedCourse.course.banner_url,
        last_updated: new Date().toISOString(),
      };

      const storedCourse = await this.repository.createCourse(courseData);

      logger.info(`Course stored with ID: ${storedCourse.id}`);

      return {
        success: true,
        course: {
          ...storedCourse,
          learning_outcomes: Array.isArray(storedCourse.learning_outcomes)
            ? storedCourse.learning_outcomes
            : JSON.parse(storedCourse.learning_outcomes as string),
        },
      };
    } catch (error) {
      logger.error('Error in CourseService generateAndCreateCourse:', error);
      throw error;
    }
  }

  private async callGroqAPI(prompt: string): Promise<any> {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new AppError(
          `Groq API error: ${errorData.error?.message || response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Error calling Groq API:', error);
      throw error;
    }
  }

  private parseAIResponse(data: any): any {
    try {
      const generatedContent = data.choices[0].message.content;
      console.log('Content', generatedContent);
      const parsed = JSON.parse(generatedContent);
      return COURSESCHEMA.parse(parsed);
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new AppError('Failed to parse AI generated content', 500);
    }
  }

  async getCourse(id?: string, limit: number = 10, offset: number = 0) {
    try {
      const result = await this.repository.getCourse(id, limit, offset);
      return result;
    } catch (error) {
      logger.error('Error in CourseService:', error);
      throw error;
    }
  }
}
