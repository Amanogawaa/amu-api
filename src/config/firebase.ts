import * as admin from "firebase-admin"
import { config } from "./environment"

admin.initializeApp(
    {
        credential: admin.credential.cert(config.firebase.serviceAccount)
    }
)

const db = admin.firestore()

export default db
