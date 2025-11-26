import axios from 'axios';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/loggers';
import type {
  GitHubRepoMetadata,
  GitHubUserResponse,
  GitHubTreeResponse,
  GitHubFileContent,
} from './types';

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

  /**
   * Get repository tree (file/folder structure)
   */
  async getRepoTree(
    owner: string,
    repo: string,
    ref: string = 'HEAD',
    accessToken?: string
  ): Promise<GitHubTreeResponse> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // First, get the commit SHA for the ref
      const commitResponse = await axios.get<{ sha: string }>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${ref}`,
        { headers }
      );

      const commitSha = commitResponse.data.sha;

      // Then get the tree recursively
      const treeResponse = await axios.get<GitHubTreeResponse>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
        { headers }
      );

      return treeResponse.data;
    } catch (error: any) {
      logger.error('Error fetching GitHub repo tree:', error);

      if (error.response?.status === 404) {
        throw new AppError('Repository or branch not found', 404);
      }

      if (error.response?.status === 403) {
        throw new AppError('Access denied. Repository may be private.', 403);
      }

      throw new AppError('Failed to fetch repository tree', 500);
    }
  }

  /**
   * Get contents of a specific path (file or directory)
   */
  async getRepoContents(
    owner: string,
    repo: string,
    path: string = '',
    ref: string = 'HEAD',
    accessToken?: string
  ): Promise<GitHubFileContent | GitHubFileContent[]> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
      const params = ref !== 'HEAD' ? { ref } : {};

      const response = await axios.get<GitHubFileContent | GitHubFileContent[]>(
        url,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching GitHub repo contents:', error);

      if (error.response?.status === 404) {
        throw new AppError('File or directory not found', 404);
      }

      if (error.response?.status === 403) {
        throw new AppError('Access denied. Repository may be private.', 403);
      }

      throw new AppError('Failed to fetch repository contents', 500);
    }
  }

  /**
   * Get file content (decoded from base64)
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string = 'HEAD',
    accessToken?: string
  ): Promise<{ content: string; encoding: string; size: number }> {
    try {
      const fileData = await this.getRepoContents(
        owner,
        repo,
        path,
        ref,
        accessToken
      );

      // If it's an array, it means it's a directory
      if (Array.isArray(fileData)) {
        throw new AppError('Path is a directory, not a file', 400);
      }

      // Decode base64 content
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

      return {
        content,
        encoding: fileData.encoding,
        size: fileData.size,
      };
    } catch (error: any) {
      logger.error('Error fetching file content:', error);
      throw error;
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(
    owner: string,
    repo: string,
    accessToken?: string
  ): Promise<Array<{ name: string; commit: { sha: string; url: string } }>> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get<
        Array<{ name: string; commit: { sha: string; url: string } }>
      >(`${this.GITHUB_API_BASE}/repos/${owner}/${repo}/branches`, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching branches:', error);

      if (error.response?.status === 404) {
        throw new AppError('Repository not found', 404);
      }

      if (error.response?.status === 403) {
        throw new AppError('Access denied. Repository may be private.', 403);
      }

      throw new AppError('Failed to fetch repository branches', 500);
    }
  }
}
