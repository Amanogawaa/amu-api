export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentRequest {
  courseId: string;
}

export interface EnrollmentResponse {
  data: Enrollment | Enrollment[];
  message: string;
  total?: number;
}

export interface EnrollmentStatusResponse {
  isEnrolled: boolean;
  enrollment?: Enrollment;
}

export interface EnrollmentCountResponse {
  courseId: string;
  count: number;
}

export interface EnrollmentQueryParams {
  status?: 'active' | 'completed' | 'dropped';
  courseId?: string;
  limit?: number;
  offset?: number;
}

export const enrollmentValidation = {
  enroll: {
    type: 'object',
    properties: {
      courseId: { type: 'string', minLength: 1 },
    },
    required: ['courseId'],
    additionalProperties: false,
  },
};
