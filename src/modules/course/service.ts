import type { CourseRepository } from './repository';
import { logger } from '../../core/utils/loggers';

export class CourseService {
  private repository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.repository = courseRepository;
  }

  async getCourse(id?: number, limit: number = 10, offset: number = 0) {
    try {
      const result = await this.repository.getCourse(id, limit, offset);
      return result;
    } catch (error) {
      logger.error('Error in CourseService:', error);
      throw error;
    }
  }
}
