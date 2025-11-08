export interface UpdateUserProfile {
  firstName?: string;
  lastName?: string;
  photoURL?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  data: UserProfile;
  message: string;
}
