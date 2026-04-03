import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errors";
import type { UserService } from "./service";
import type { UpdateUserProfile } from "./types";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  getUserProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        throw new AppError("Unauthorized", 401);
      }

      const profile = await this.userService.getUserProfile(uid);

      res.status(200).send(profile);
    } catch (error) {
      next(error);
    }
  };

  getOtherUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError("User ID is required", 400);
      }

      const profile = await this.userService.getPublicUserProfile(userId);

      res.status(200).send(profile);
    } catch (error) {
      next(error);
    }
  };

  getOtherUserAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError("User ID is required", 400);
      }

      const analytics = await this.userService.getUserAnalytics(userId);

      res.status(200).send(analytics);
    } catch (error) {
      next(error);
    }
  };

  updateUserProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        throw new AppError("Unauthorized", 401);
      }

      const updates: UpdateUserProfile = req.body;
      const updatedProfile = await this.userService.updateUserProfile(
        uid,
        updates,
      );

      res.status(200).json({
        data: updatedProfile,
        message: "User profile updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  uploadProfilePicture = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        throw new AppError("Unauthorized", 401);
      }

      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      // Validate file type
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new AppError(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
          400,
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new AppError("File size too large. Maximum size is 5MB", 400);
      }

      const photoURL = await this.userService.uploadProfilePicture(
        uid,
        req.file,
      );

      res.status(200).json({
        data: { photoURL },
        message: "Profile picture uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAnalytics = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = req.user?.uid;

      if (!uid) {
        throw new AppError("Unauthorized", 401);
      }

      const analytics = await this.userService.getUserAnalytics(uid);

      res.status(200).send(analytics);
    } catch (error) {
      next(error);
    }
  };
}
