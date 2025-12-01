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

// Repository Tree/File Viewer Types
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file";
  content: string; // Base64 encoded
  encoding: "base64";
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubRepoContentsParams {
  owner: string;
  repo: string;
  path?: string;
  ref?: string; // branch, tag, or commit SHA
  accessToken?: string;
}
