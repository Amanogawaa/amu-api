export interface GitHubRepoMetadata {
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
  default_branch: string;
}

export interface GitHubUserResponse {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubConnection {
  userId: string;
  githubUsername: string;
  githubUserId: string;
  avatarUrl?: string;
  accessToken: string;
  connectedAt: Date;
  lastSync: Date;
}
