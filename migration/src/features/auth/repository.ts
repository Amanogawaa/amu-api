import type { UserRecord } from "firebase-admin/auth";
import { admin, firebaseFirestore } from "../../config/firebase";
import { logger } from "../../utils/loggers";
import type { CreateUser } from "./types";

export class AuthRepository {
  private auth: admin.auth.Auth;
  private db: admin.firestore.Firestore;

  constructor(auth: admin.auth.Auth) {
    this.auth = auth;
    this.db = firebaseFirestore;
  }

  async createUser(request: CreateUser): Promise<UserRecord | null> {
    try {
      const user = await this.auth.createUser({
        email: request.email,
        password: request.password,
      });

      await this.db.collection("users").add({
        uid: user.uid,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return user;
    } catch (error) {
      logger.error("Error in AuthRepository.createUser:", error);
      throw error;
    }
  }
}
