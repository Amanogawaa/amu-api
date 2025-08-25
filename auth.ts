// // ===== AUTH MIDDLEWARE =====
// // middleware/authMiddleware.ts
// import { Request, Response, NextFunction } from 'express';
// import { createClient } from '@supabase/supabase-js';
// import { logger } from '../core/utils/loggers';
// import { AppError } from '../core/utils/errors';

// export interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     email: string;
//     role?: string;
//     [key: string]: any;
//   };
// }

// export const authMiddleware = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Get token from Authorization header or cookie
//     let token = req.headers.authorization?.replace('Bearer ', '');

//     if (!token) {
//       // Check cookie as fallback
//       token = req.cookies?.['supabase-auth-token'];
//     }

//     if (!token) {
//       throw new AppError('No authentication token provided', 401);
//     }

//     // Create Supabase client with the token
//     const supabase = createClient(
//       process.env.SUPABASE_URL!,
//       process.env.SUPABASE_ANON_KEY!,
//       {
//         global: {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       }
//     );

//     // Verify the token and get user
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser(token);

//     if (error || !user) {
//       throw new AppError('Invalid or expired token', 401);
//     }

//     // Attach user to request
//     req.user = {
//       id: user.id,
//       email: user.email!,
//       role: user.user_metadata?.role || 'user',
//       ...user.user_metadata,
//     };

//     next();
//   } catch (error) {
//     logger.error('Auth middleware error:', error);
//     const status = error instanceof AppError ? error.statusCode : 401;
//     res.status(status).json({
//       error: (error as Error).message,
//       status: 'error',
//     });
//   }
// };

// // Optional: Role-based middleware
// export const requireRole = (roles: string[]) => {
//   return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ error: 'User not authenticated', status: 'error' });
//     }

//     if (!roles.includes(req.user.role || 'user')) {
//       return res
//         .status(403)
//         .json({ error: 'Insufficient permissions', status: 'error' });
//     }

//     next();
//   };
// };

// // ===== AUTH SERVICE =====
// // services/AuthService.ts
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { logger } from '../../core/utils/loggers';
// import { AppError } from '../../core/utils/errors';

// export interface SignUpRequest {
//   email: string;
//   password: string;
//   firstName?: string;
//   lastName?: string;
//   role?: string;
// }

// export interface SignInRequest {
//   email: string;
//   password: string;
// }

// export interface AuthResponse {
//   user: any;
//   session: any;
//   accessToken: string;
//   refreshToken: string;
// }

// export class AuthService {
//   private supabase: SupabaseClient;

//   constructor() {
//     this.supabase = createClient(
//       process.env.SUPABASE_URL!,
//       process.env.SUPABASE_ANON_KEY!
//     );
//   }

//   async signUp(userData: SignUpRequest): Promise<AuthResponse> {
//     try {
//       const { data, error } = await this.supabase.auth.signUp({
//         email: userData.email,
//         password: userData.password,
//         options: {
//           data: {
//             first_name: userData.firstName,
//             last_name: userData.lastName,
//             role: userData.role || 'user',
//           },
//         },
//       });

//       if (error) {
//         logger.error('Sign up error:', error);
//         throw new AppError(`Sign up failed: ${error.message}`, 400);
//       }

//       if (!data.user || !data.session) {
//         throw new AppError(
//           'Sign up succeeded but no user/session returned',
//           500
//         );
//       }

//       return {
//         user: data.user,
//         session: data.session,
//         accessToken: data.session.access_token,
//         refreshToken: data.session.refresh_token,
//       };
//     } catch (error) {
//       logger.error('Error in AuthService signUp:', error);
//       throw error;
//     }
//   }

//   async signIn(credentials: SignInRequest): Promise<AuthResponse> {
//     try {
//       const { data, error } = await this.supabase.auth.signInWithPassword({
//         email: credentials.email,
//         password: credentials.password,
//       });

//       if (error) {
//         logger.error('Sign in error:', error);
//         throw new AppError(`Sign in failed: ${error.message}`, 401);
//       }

//       if (!data.user || !data.session) {
//         throw new AppError('Invalid credentials', 401);
//       }

//       return {
//         user: data.user,
//         session: data.session,
//         accessToken: data.session.access_token,
//         refreshToken: data.session.refresh_token,
//       };
//     } catch (error) {
//       logger.error('Error in AuthService signIn:', error);
//       throw error;
//     }
//   }

//   async signOut(accessToken: string): Promise<void> {
//     try {
//       const { error } = await this.supabase.auth.admin.signOut(accessToken);

//    if (error) {
//         logger.error('Sign out error:', error);
//         throw    new AppError(`Sign out failed: ${error.message}`, 400);
//       }
//     } catch (error) {
//       logger.error('Error in AuthService signOut:', error);
//       throw error;
//     }
//   }

//   async refreshToken(refreshToken: string): Promise<AuthResponse> {
//     try {
//       const { data, error } = await this.supabase.auth.refreshSession({
//         refresh_token: refreshToken,
//       });

//       if (error || !data.session) {
//         logger.error('Token refresh error:', error);
//         throw new AppError('Token refresh failed', 401);
//       }

//       return {
//         user: data.user,
//         session: data.session,
//         accessToken: data.session.access_token,
//         refreshToken: data.session.refresh_token,
//       };
//     } catch (error) {
//       logger.error('Error in AuthService refreshToken:', error);
//       throw error;
//     }
//   }

//   async getUserProfile(userId: string): Promise<any> {
//     try {
//       const { data, error } = await this.supabase
//         .from('profiles') // Assuming you have a profiles table
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         logger.error('Get user profile error:', error);
//         throw new AppError(`Failed to get user profile: ${error.message}`, 404);
//       }

//       return data;
//     } catch (error) {
//       logger.error('Error in AuthService getUserProfile:', error);
//       throw error;
//     }
//   }
// }

// // ===== AUTH CONTROLLER =====
// // controllers/AuthController.ts
// import { AuthService, SignUpRequest, SignInRequest } from './AuthService';
// import { type Request, type Response } from 'express';
// import { logger } from '../../core/utils/loggers';
// import { AppError } from '../../core/utils/errors';
// import { AuthenticatedRequest } from '../middleware/authMiddleware';

// export class AuthController {
//   private authService: AuthService;

//   constructor() {
//     this.authService = new AuthService();
//   }

//   async signUp(req: Request, res: Response) {
//     try {
//       const { email, password, firstName, lastName, role } =
//         req.body as SignUpRequest;

//       // Validation
//       if (!email || !password) {
//         throw new AppError('Email and password are required', 400);
//       }

//       if (password.length < 6) {
//         throw new AppError('Password must be at least 6 characters long', 400);
//       }

//       const result = await this.authService.signUp({
//         email,
//         password,
//         firstName,
//         lastName,
//         role,
//       });

//       // Set HTTP-only cookies
//       this.setAuthCookies(res, result.accessToken, result.refreshToken);

//       res.status(201).json({
//         data: {
//           user: result.user,
//           message: 'Account created successfully',
//         },
//         status: 'success',
//       });
//     } catch (error) {
//       logger.error('Error in AuthController signUp:', error);
//       const status = error instanceof AppError ? error.statusCode : 500;
//       res.status(status).json({
//         error: (error as Error).message,
//         status: 'error',
//       });
//     }
//   }

//   async signIn(req: Request, res: Response) {
//     try {
//       const { email, password } = req.body as SignInRequest;

//       // Validation
//       if (!email || !password) {
//         throw new AppError('Email and password are required', 400);
//       }

//       const result = await this.authService.signIn({ email, password });

//       // Set HTTP-only cookies
//       this.setAuthCookies(res, result.accessToken, result.refreshToken);

//       res.json({
//         data: {
//           user: result.user,
//           message: 'Signed in successfully',
//         },
//         status: 'success',
//       });
//     } catch (error) {
//       logger.error('Error in AuthController signIn:', error);
//       const status = error instanceof AppError ? error.statusCode : 500;
//       res.status(status).json({
//         error: (error as Error).message,
//         status: 'error',
//       });
//     }
//   }

//   async signOut(req: AuthenticatedRequest, res: Response) {
//     try {
//       const token =
//         req.headers.authorization?.replace('Bearer ', '') ||
//         req.cookies?.['supabase-auth-token'];

//       if (token) {
//         await this.authService.signOut(token);
//       }

//       // Clear cookies
//       this.clearAuthCookies(res);

//       res.json({
//         data: { message: 'Signed out successfully' },
//         status: 'success',
//       });
//     } catch (error) {
//       logger.error('Error in AuthController signOut:', error);
//       const status = error instanceof AppError ? error.statusCode : 500;
//       res.status(status).json({
//         error: (error as Error).message,
//         status: 'error',
//       });
//     }
//   }

//   async refreshToken(req: Request, res: Response) {
//     try {
//       const refreshToken =
//         req.cookies?.['supabase-refresh-token'] || req.body.refreshToken;

//       if (!refreshToken) {
//         throw new AppError('Refresh token not provided', 400);
//       }

//       const result = await this.authService.refreshToken(refreshToken);

//       // Update cookies with new tokens
//       this.setAuthCookies(res, result.accessToken, result.refreshToken);

//       res.json({
//         data: {
//           user: result.user,
//           message: 'Token refreshed successfully',
//         },
//         status: 'success',
//       });
//     } catch (error) {
//       logger.error('Error in AuthController refreshToken:', error);
//       const status = error instanceof AppError ? error.statusCode : 500;
//       res.status(status).json({
//         error: (error as Error).message,
//         status: 'error',
//       });
//     }
//   }

//   async getProfile(req: AuthenticatedRequest, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const profile = await this.authService.getUserProfile(userId);

//       res.json({
//         data: profile,
//         status: 'success',
//       });
//     } catch (error) {
//       logger.error('Error in AuthController getProfile:', error);
//       const status = error instanceof AppError ? error.statusCode : 500;
//       res.status(status).json({
//         error: (error as Error).message,
//         status: 'error',
//       });
//     }
//   }

//   private setAuthCookies(
//     res: Response,
//     accessToken: string,
//     refreshToken: string
//   ) {
//     const cookieOptions = {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict' as const,
//       path: '/',
//     };

//     res.cookie('supabase-auth-token', accessToken, {
//       ...cookieOptions,
//       maxAge: 60 * 60 * 1000, // 1 hour
//     });

//     res.cookie('supabase-refresh-token', refreshToken, {
//       ...cookieOptions,
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });
//   }

//   private clearAuthCookies(res: Response) {
//     const cookieOptions = {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict' as const,
//       path: '/',
//     };

//     res.clearCookie('supabase-auth-token', cookieOptions);
//     res.clearCookie('supabase-refresh-token', cookieOptions);
//   }
// }

// // ===== AUTH ROUTES =====
// // routes/AuthRoute.ts
// import { Router } from 'express';
// import { AuthController } from './AuthController';
// import { authMiddleware } from '../middleware/authMiddleware';

// export class AuthRoute {
//   public router: Router;
//   private controller: AuthController;

//   constructor() {
//     this.router = Router();
//     this.controller = new AuthController();
//     this.initializeRoutes();
//   }

//   private initializeRoutes(): void {
//     // Public routes
//     this.router.post(
//       '/auth/signup',
//       this.controller.signUp.bind(this.controller)
//     );
//     this.router.post(
//       '/auth/signin',
//       this.controller.signIn.bind(this.controller)
//     );
//     this.router.post(
//       '/auth/refresh',
//       this.controller.refreshToken.bind(this.controller)
//     );

//     // Protected routes
//     this.router.post(
//       '/auth/signout',
//       authMiddleware,
//       this.controller.signOut.bind(this.controller)
//     );
//     this.router.get(
//       '/auth/profile',
//       authMiddleware,
//       this.controller.getProfile.bind(this.controller)
//     );
//   }

//   public getRouter(): Router {
//     return this.router;
//   }
// }

// // ===== UPDATED COURSE ROUTES WITH AUTH =====
// // Example: Protected Course Routes
// export class CourseRoute {
//   public router: Router;
//   private controller: CourseController;

//   constructor(controller: CourseController) {
//     this.router = Router();
//     this.controller = controller;
//     this.initializeRoutes();
//   }

//   private initializeRoutes(): void {
//     // Public routes (if any)
//     this.router.get(
//       '/courses',
//       this.controller.getCourses.bind(this.controller)
//     );

//     // Protected routes - require authentication
//     this.router.post(
//       '/courses/generate',
//       authMiddleware,
//       this.controller.generateCourse.bind(this.controller)
//     );

//     // Admin only routes - require specific role
//     this.router.delete(
//       '/courses/:id',
//       authMiddleware,
//       requireRole(['admin']),
//       this.controller.deleteCourse.bind(this.controller)
//     );
//   }

//   public getRouter(): Router {
//     return this.router;
//   }
// }
