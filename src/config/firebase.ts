import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { config } from "./environment";

admin.initializeApp({
  credential: admin.credential.cert(
    config.firebase.serviceAccount as ServiceAccount
  ),
});

export const firebaseAuth = admin.auth();
export const firebaseFirestore = admin.firestore();

export { admin };
