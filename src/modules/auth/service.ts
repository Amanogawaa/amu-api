import bcrypt from "bcrypt";
import { convexClient, api } from "../../core/convex";
import type { CreateUserDTO, LoginUserDTO } from "./type";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: CreateUserDTO) {
    this.validateRegistrationData(data);

    try {
      // Check if user already exists
      const existingUser = await convexClient.query(
        (api as any).auth.getUserByEmail,
        {
          email: data.email,
        },
      );

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password using bcrypt
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user in Convex with hashed password
      const user = await convexClient.mutation((api as any).auth.createUser, {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        program: data.program,
        year: data.year,
        school: data.school,
      });

      return {
        success: true,
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginUserDTO) {
    this.validateLoginData(credentials);

    try {
      // Find user by email
      const user = await convexClient.query((api as any).auth.getUserByEmail, {
        email: credentials.email,
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      return {
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate registration data
   */
  private validateRegistrationData(data: CreateUserDTO): void {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (!data.firstName || !data.lastName) {
      throw new Error("First name and last name are required");
    }
  }

  /**
   * Validate login data
   */
  private validateLoginData(credentials: LoginUserDTO): void {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email and password are required");
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new Error("Invalid email format");
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    try {
      const user = await convexClient.query((api as any).auth.getUserById, {
        id: userId,
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          program: user.program,
          year: user.year,
          school: user.school,
          photoURL: user.photoURL,
          isPrivate: user.isPrivate,
          githubUsername: user.githubUsername,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      photoURL?: string;
      isPrivate?: boolean;
      githubUsername?: string;
      githubId?: string;
      githubConnectedAt?: number;
    },
  ) {
    try {
      const user = await convexClient.mutation(
        (api as any).auth.updateUserProfile,
        {
          id: userId,
          ...updates,
        },
      );

      return {
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          program: user.program,
          year: user.year,
          school: user.school,
          photoURL: user.photoURL,
          isPrivate: user.isPrivate,
          githubUsername: user.githubUsername,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
