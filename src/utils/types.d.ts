// import { z } from 'zod';

// export const CHAPTERSCHEMA = z.object({
//   chapters: z.array(
//     z.object({
//       chapterId: z.number(),
//       title: z.string(),
//       description: z.string(),
//       estimatedDuration: z.string(),
//       lessons: z.array(
//         z.object({
//           lessonId: z.string(),
//           title: z.string(),
//           type: z.string(),
//           duration: z.string(),
//           description: z.string(),
//         })
//       ),
//     })
//   ),
// });

// export const AUTHSCHEMA = z.object({
//   email: z.email({ error: 'Invalid email' }),
//   password: z
//     .string()
//     .min(8, { error: 'Password must be at least 8 characters long' })
//     .regex(/[a-zA-Z]/, { error: 'Password must contain at least one letter' })
//     .regex(/[0-9]/, { error: 'Password must contain at least one number' }),
// });

// export type AuthFormData = z.infer<typeof AUTHSCHEMA>;

// export type AuthState = {
//   data: object | null;
//   errors: { email?: string; password?: string; general?: string } | null;
// };
