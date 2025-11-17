import axios from 'axios';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type { GitHubRepoMetadata, GitHubUserResponse } from './types';

export class GitHubService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  constructor() {}

  /**
   * Fetch repository metadata from GitHub
   */
  async getRepoMetadata(
    owner: string,
    repo: string,
    accessToken?: string
  ): Promise<GitHubRepoMetadata> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get<GitHubRepoMetadata>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching GitHub repo metadata:', error);

      if (error.response?.status === 404) {
        throw new AppError('GitHub repository not found', 404);
      }

      if (error.response?.status === 403) {
        throw new AppError('Access denied. Repository may be private.', 403);
      }

      throw new AppError('Failed to fetch repository information', 500);
    }
  }

  /**
   * Fetch GitHub user information
   */
  async getUserInfo(accessToken: string): Promise<GitHubUserResponse> {
    try {
      const response = await axios.get<GitHubUserResponse>(
        `${this.GITHUB_API_BASE}/user`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching GitHub user info:', error);

      if (error.response?.status === 401) {
        throw new AppError('Invalid or expired GitHub token', 401);
      }

      throw new AppError('Failed to fetch GitHub user information', 500);
    }
  }

  /**
   * Validate that a repository exists and is accessible
   */
  async validateRepo(
    owner: string,
    repo: string,
    accessToken?: string
  ): Promise<boolean> {
    try {
      await this.getRepoMetadata(owner, repo, accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get README content from a repository
   */
  async getReadme(
    owner: string,
    repo: string,
    accessToken?: string
  ): Promise<string | null> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3.raw',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get<string>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching README:', error);

      if (error.response?.status === 404) {
        return null; // README doesn't exist
      }

      throw new AppError('Failed to fetch README', 500);
    }
  }

  /**
   * Get repository languages
   */
  async getLanguages(
    owner: string,
    repo: string,
    accessToken?: string
  ): Promise<Record<string, number>> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get<Record<string, number>>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching repository languages:', error);
      throw new AppError('Failed to fetch repository languages', 500);
    }
  }

  /**
   * Exchange OAuth code for access token
   * Note: This requires GitHub OAuth app credentials
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      // This would require your GitHub OAuth app client_id and client_secret
      // You'll need to set these in your environment variables
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new AppError(
          'GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
          500
        );
      }

      const response = await axios.post<{ access_token: string }>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      logger.error('Error exchanging GitHub OAuth code:', error);
      throw new AppError('Failed to authenticate with GitHub', 500);
    }
  }
}
