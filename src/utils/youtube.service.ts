import axios from 'axios';
import { logger } from './loggers';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  totalResults: number;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('YouTube API key not configured');
    }
  }

  /**
   * Search for videos using the lesson's videoSearchQuery
   * @param searchQuery - The search term (e.g., "React useState hook tutorial")
   * @param maxResults - Number of results to return (default: 5)
   * @returns Array of video metadata
   */
  async searchVideos(
    searchQuery: string,
    maxResults: number = 5
  ): Promise<YouTubeSearchResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      // Step 1: Search for videos
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults,
          key: this.apiKey,
          videoEmbeddable: 'true', // Only embeddable videos
          videoSyndicated: 'true',
          order: 'relevance', // or 'viewCount', 'rating'
          relevanceLanguage: 'en', // Adjust based on course language
        },
      });

      const videoIds = searchResponse.data.items
        .map((item: any) => item.id.videoId)
        .join(',');

      if (!videoIds) {
        return { videos: [], totalResults: 0 };
      }

      // Step 2: Get detailed video information (duration, views, etc.)
      const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds,
          key: this.apiKey,
        },
      });

      const videos: YouTubeVideo[] = detailsResponse.data.items.map(
        (item: any) => ({
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: this.parseDuration(item.contentDetails.duration),
          viewCount: item.statistics.viewCount,
        })
      );

      return {
        videos,
        totalResults: searchResponse.data.pageInfo.totalResults,
      };
    } catch (error) {
      logger.error('YouTube API error:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(videoId: string): Promise<YouTubeVideo | null> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey,
        },
      });

      if (response.data.items.length === 0) return null;

      const item = response.data.items[0];
      return {
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: this.parseDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount,
      };
    } catch (error) {
      logger.error('YouTube API error:', error);
      return null;
    }
  }

  /**
   * Parse ISO 8601 duration to human-readable format
   * PT15M33S -> "15:33"
   * PT1H2M10S -> "1:02:10"
   */
  private parseDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Filter videos by duration (optional quality check)
   * E.g., only videos between 5-20 minutes
   */
  filterByDuration(
    videos: YouTubeVideo[],
    minMinutes: number,
    maxMinutes: number
  ): YouTubeVideo[] {
    return videos.filter((video) => {
      const parts = video.duration.split(':').map(Number);
      let totalMinutes = 0;

      if (parts.length === 3) {
        // Format: H:MM:SS
        totalMinutes =
          (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
      } else if (parts.length === 2) {
        // Format: M:SS
        totalMinutes = (parts[0] || 0) + (parts[1] || 0) / 60;
      }

      return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
    });
  }
}

export const youtubeService = new YouTubeService();
