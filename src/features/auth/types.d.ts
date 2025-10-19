export interface CreateUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginUser {
  email: string;
  password: string;
}
