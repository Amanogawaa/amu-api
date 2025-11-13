import { EnrollmentController } from './controller';
import { EnrollmentRepository } from './repository';
import { EnrollmentRoute } from './route';
import { EnrollmentService } from './service';
import { firebaseFirestore } from '../../config/firebase';
import type { CourseRepository } from '../course/repository';
import type { ProgressRepository } from '../progress/repository';

export class EnrollmentContainer {
  public route: EnrollmentRoute;

  constructor(
    courseRepository: CourseRepository,
    progressRepository: ProgressRepository
  ) {
    const enrollmentRepository = new EnrollmentRepository(firebaseFirestore);
    const enrollmentService = new EnrollmentService(
      enrollmentRepository,
      courseRepository,
      progressRepository
    );
    const enrollmentController = new EnrollmentController(enrollmentService);
    this.route = new EnrollmentRoute(enrollmentController);
  }
}
