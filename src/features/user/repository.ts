import type { Firestore } from "firebase-admin/firestore";
import { admin, firebaseAuth, firebaseFirestore } from "../../config/firebase";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/loggers";
import type {
  UpdateUserProfile,
  UserProfile,
  UserAnalytics,
  CourseAnalytics,
} from "./types";

export class UserRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "users";

  constructor(firestore: Firestore = firebaseFirestore) {
    this.firebaseStore = firestore;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        const userRecord = await firebaseAuth.getUser(uid);

        const newProfile = {
          uid: uid,
          email: userRecord.email || "",
          firstName: userRecord.displayName?.split(" ")[0] || "",
          lastName: userRecord.displayName?.split(" ")[1] || "",
          photoURL: userRecord.photoURL || "",
          status: "public",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await userRef.set(newProfile);
        return newProfile as UserProfile;
      }

      return {
        uid: doc.id,
        ...doc.data(),
      } as UserProfile;
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      throw new AppError("Failed to fetch user profile", 500);
    }
  }

  async updateUserProfile(
    uid: string,
    updates: UpdateUserProfile,
  ): Promise<UserProfile> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(uid)
        .update(updateData);

      if (updates.firstName || updates.lastName) {
        const user = await firebaseAuth.getUser(uid);
        const displayName = `${
          updates.firstName || user.displayName?.split(" ")[0] || ""
        } ${updates.lastName || user.displayName?.split(" ")[1] || ""}`.trim();

        await firebaseAuth.updateUser(uid, {
          displayName,
        });
      }

      if (updates.photoURL) {
        await firebaseAuth.updateUser(uid, {
          photoURL: updates.photoURL,
        });
      }

      const updatedProfile = await this.getUserProfile(uid);
      if (!updatedProfile) {
        throw new AppError("Failed to retrieve updated profile", 500);
      }

      return updatedProfile;
    } catch (error) {
      logger.error("Error updating user profile:", error);
      throw new AppError("Failed to update user profile", 500);
    }
  }

  async createUserProfile(
    uid: string,
    email: string,
    additionalData?: Partial<UpdateUserProfile>,
  ): Promise<void> {
    try {
      await this.firebaseStore
        .collection(this.COLLECTION_NAME)
        .doc(uid)
        .set({
          email,
          ...additionalData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error("Error creating user profile:", error);
      throw new AppError("Failed to create user profile", 500);
    }
  }

  async getUserAnalytics(uid: string): Promise<UserAnalytics> {
    try {
      const coursesSnapshot = await this.firebaseStore
        .collection("courses")
        .where("uid", "==", uid)
        .where("publish", "==", true)
        .get();

      const courseAnalytics: CourseAnalytics[] = [];
      let totalLikesReceived = 0;
      let totalEnrollments = 0;
      let totalComments = 0;

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();
        const courseId = courseDoc.id;

        // Get likes count for this course
        const likesSnapshot = await this.firebaseStore
          .collection("likes")
          .where("courseId", "==", courseId)
          .get();
        const likesCount = likesSnapshot.size;

        // Get enrollments count for this course
        const enrollmentsSnapshot = await this.firebaseStore
          .collection("enrollments")
          .where("courseId", "==", courseId)
          .where("status", "==", "active")
          .get();
        const enrollmentsCount = enrollmentsSnapshot.size;

        // Get comments count for this course
        const commentsSnapshot = await this.firebaseStore
          .collection("comments")
          .where("courseId", "==", courseId)
          .get();
        const commentsCount = commentsSnapshot.size;

        courseAnalytics.push({
          courseId,
          courseName: courseData.name || "Untitled Course",
          likesCount,
          enrollmentsCount,
          commentsCount,
          createdAt: courseData.createdAt?.toDate() || new Date(),
        });

        totalLikesReceived += likesCount;
        totalEnrollments += enrollmentsCount;
        totalComments += commentsCount;
      }

      return {
        totalCoursesCreated: coursesSnapshot.size,
        totalLikesReceived,
        totalEnrollments,
        totalComments,
        courses: courseAnalytics,
      };
    } catch (error) {
      logger.error("Error fetching user analytics:", error);
      throw new AppError("Failed to fetch user analytics", 500);
    }
  }
}
