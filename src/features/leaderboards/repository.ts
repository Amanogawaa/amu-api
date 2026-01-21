import { firebaseFirestore } from "@config/firebase";
import type { Firestore } from "firebase-admin/firestore";

export class LeaderboardsRepository {
  private firebaseStore: Firestore;
  private readonly COLLECTION_NAME = "lessons";

  constructor(firebaseStore: Firestore = firebaseFirestore) {
    this.firebaseStore = firebaseStore;
  }

  async getLeaderboards() {
    const querySnapshot = await this.firebaseStore
      .collection(this.COLLECTION_NAME)
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}
