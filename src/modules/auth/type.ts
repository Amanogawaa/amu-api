export interface User {
  _id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  isPrivate?: boolean;
  githubUsername?: string;
  githubId?: string;
  githubConnectedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  program: string;
  year: number;
  school: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}
