import { YoutubeTranscript } from 'youtube-transcript';
import { logger } from './loggers';

interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
}

interface TranscriptResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
}

export class YouTubeTranscriptService {
  /**
   * Fetch transcript for a YouTube video
   * @param videoId - YouTube video ID (e.g., "dQw4w9WgXcQ")
   * @param language - Preferred language code (default: 'en')
   * @returns Transcript text and segments
   */
  async getTranscript(
    videoId: string,
    language: string = 'en'
  ): Promise<TranscriptResult | null> {
    try {
      // Fetch transcript segments
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: language,
      });

      if (!transcript || transcript.length === 0) {
        logger.warn(`No transcript found for video: ${videoId}`);
        return null;
      }

      // Combine all segments into full text
      const fullText = transcript.map((segment: any) => segment.text).join(' ');

      // Format segments
      const segments: TranscriptSegment[] = transcript.map((segment: any) => ({
        text: segment.text,
        duration: segment.duration,
        offset: segment.offset,
      }));

      return {
        fullText: this.cleanTranscript(fullText),
        segments,
        language,
      };
    } catch (error: any) {
      if (error.message?.includes('Transcript is disabled')) {
        logger.warn(`Transcripts disabled for video: ${videoId}`);
      } else if (error.message?.includes('No transcripts available')) {
        logger.warn(`No transcripts available for video: ${videoId}`);
      } else if (error.message?.includes('Could not find')) {
        logger.warn(`Could not find transcript for video: ${videoId}`);
      } else {
        logger.error(`Error fetching transcript for ${videoId}:`, error);
      }
      return null;
    }
  }

  /**
   * Clean transcript text (remove artifacts, fix formatting)
   */
  private cleanTranscript(text: string): string {
    return text
      .replace(/\[Music\]/gi, '') // Remove [Music] markers
      .replace(/\[Applause\]/gi, '')
      .replace(/\[Laughter\]/gi, '')
      .replace(/\[.*?\]/g, '') // Remove any other bracketed content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get transcript with timestamps (useful for interactive features)
   */
  async getTranscriptWithTimestamps(
    videoId: string,
    language: string = 'en'
  ): Promise<TranscriptSegment[] | null> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: language,
      });

      if (!transcript || transcript.length === 0) {
        return null;
      }

      return transcript.map((segment: any) => ({
        text: this.cleanTranscript(segment.text),
        duration: segment.duration,
        offset: segment.offset, // Timestamp in seconds
      }));
    } catch (error) {
      logger.error('Error fetching transcript with timestamps:', error);
      return null;
    }
  }

  /**
   * Get transcript in multiple languages (if available)
   */
  async getTranscriptMultiLang(
    videoId: string,
    languages: string[] = ['en', 'es', 'fr']
  ): Promise<Record<string, string>> {
    const transcripts: Record<string, string> = {};

    for (const lang of languages) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
          lang,
        });
        if (transcript && transcript.length > 0) {
          const fullText = transcript.map((s: any) => s.text).join(' ');
          transcripts[lang] = this.cleanTranscript(fullText);
        }
      } catch (error) {
        logger.debug(`No ${lang} transcript for video ${videoId}`);
      }
    }

    return transcripts;
  }

  /**
   * Format transcript with timestamps for display
   * Useful for showing transcript alongside video
   */
  formatTranscriptWithTime(segments: TranscriptSegment[]): string {
    return segments
      .map((segment) => {
        const minutes = Math.floor(segment.offset / 60);
        const seconds = Math.floor(segment.offset % 60);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `[${timestamp}] ${segment.text}`;
      })
      .join('\n');
  }

  /**
   * Get summary statistics about a transcript
   */
  getTranscriptStats(transcript: TranscriptResult): {
    wordCount: number;
    duration: number;
    segmentCount: number;
    averageWordsPerMinute: number;
  } {
    const wordCount = transcript.fullText.split(/\s+/).length;
    const lastSegment = transcript.segments[transcript.segments.length - 1];
    const duration =
      transcript.segments.length > 0 && lastSegment
        ? lastSegment.offset + lastSegment.duration
        : 0;
    const durationMinutes = duration / 60;
    const averageWordsPerMinute =
      durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

    return {
      wordCount,
      duration: Math.round(duration),
      segmentCount: transcript.segments.length,
      averageWordsPerMinute,
    };
  }
}

export const youtubeTranscriptService = new YouTubeTranscriptService();
