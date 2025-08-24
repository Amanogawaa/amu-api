import type { CourseRepository } from "./repository";

export class CourseService {
  private repository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.repository = courseRepository;
  }

  async getCourse() {
    return await this.repository.getCourse();
  }
}
