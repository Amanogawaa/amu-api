import {
  YoutubeTranscript,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
} from 'youtube-transcript-plus';
import { logger } from '../loggers';

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
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: language,
      });

      if (!transcript || transcript.length === 0) {
        logger.warn(`No transcript found for video: ${videoId}`);
        return null;
      }

      const fullText = transcript.map((segment: any) => segment.text).join(' ');

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
      if (error instanceof YoutubeTranscriptDisabledError) {
        logger.warn(`Transcripts are disabled for video: ${videoId}`);
      } else if (error instanceof YoutubeTranscriptNotAvailableError) {
        logger.warn(`No transcripts available for video: ${videoId}`);
      } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
        logger.warn(`Video is unavailable: ${videoId}`);
      } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
        logger.warn(
          `Transcript not available in language "${language}" for video: ${videoId}`
        );
      } else if (error instanceof YoutubeTranscriptTooManyRequestError) {
        logger.error(`Too many requests to YouTube API for video: ${videoId}`);
      } else {
        logger.error(`Error fetching transcript for ${videoId}:`, error);
      }
      return null;
    }
  }

  private cleanTranscript(text: string): string {
    return text
      .replace(/\[Music\]/gi, '')
      .replace(/\[Applause\]/gi, '')
      .replace(/\[Laughter\]/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

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
        offset: segment.offset,
      }));
    } catch (error: any) {
      if (error instanceof YoutubeTranscriptDisabledError) {
        logger.warn(`Transcripts disabled for video: ${videoId}`);
      } else if (error instanceof YoutubeTranscriptNotAvailableError) {
        logger.warn(`No transcripts available for video: ${videoId}`);
      } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
        logger.warn(`Video unavailable: ${videoId}`);
      } else {
        logger.error('Error fetching transcript with timestamps:', error);
      }
      return null;
    }
  }

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
      } catch (error: any) {
        if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
          logger.debug(`No ${lang} transcript for video ${videoId}`);
        } else if (
          !(error instanceof YoutubeTranscriptDisabledError) &&
          !(error instanceof YoutubeTranscriptNotAvailableError)
        ) {
          // Only log unexpected errors, not common ones
          logger.debug(`Error fetching ${lang} transcript for ${videoId}`);
        }
      }
    }

    return transcripts;
  }

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
