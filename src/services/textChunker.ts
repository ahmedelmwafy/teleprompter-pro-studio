import { ChunkMode, ScriptChunk } from '../types';

/**
 * Clean text from excessive spaces while keeping meaningful structure
 */
export function cleanText(text: string): string {
  return text.trim().replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
}

/**
 * Counts words accurately for both Arabic and Latin characters
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  // Remove brackets/cues like [وقفة] for accurate word count
  const clean = text.replace(/\[.*?\]/g, '').trim();
  if (!clean) return 0;
  const tokens = clean.split(/\s+/).filter(Boolean);
  return tokens.length;
}

/**
 * Calculate estimated seconds to read a given word count at specified WPM
 */
export function calculateReadingTime(wordCount: number, wpm: number = 130): number {
  if (wordCount <= 0) return 1;
  const seconds = Math.round((wordCount / wpm) * 60);
  return Math.max(1, seconds);
}

/**
 * Split text into chunks based on mode
 */
export function generateChunks(
  content: string,
  mode: ChunkMode = 'sentence',
  wordsPerChunk: number = 8,
  wpm: number = 130,
  outroThreshold: number = 3
): ScriptChunk[] {
  if (!content || !content.trim()) {
    return [];
  }

  let rawChunks: string[] = [];

  if (mode === 'sentence') {
    rawChunks = splitBySentences(content);
  } else if (mode === 'half-sentence') {
    rawChunks = splitByHalfSentences(content);
  } else if (mode === 'custom-words') {
    rawChunks = splitByWordCount(content, wordsPerChunk);
  }

  // Filter out empty or whitespace only chunks
  const filtered = rawChunks.map(c => c.trim()).filter(c => c.length > 0);
  const total = filtered.length;

  return filtered.map((text, idx) => {
    const wordCount = countWords(text);
    const estimatedSeconds = calculateReadingTime(wordCount, wpm);
    const isOutro = total > outroThreshold ? (idx >= total - outroThreshold) : (idx === total - 1);
    
    // Detect cue types
    let cueType: ScriptChunk['cueType'] = 'normal';
    if (/\[.*?(وقفة|تنفس|pause).*?\]/i.test(text)) {
      cueType = 'pause';
    } else if (/\[.*?(حماس|تأكيد|نبرة|emphasis).*?\]/i.test(text)) {
      cueType = 'emphasis';
    } else if (/[a-zA-Z]/.test(text) && /[\u0600-\u06FF]/.test(text)) {
      cueType = 'bilingual';
    }

    return {
      id: `chunk-${idx}`,
      index: idx,
      text,
      wordCount,
      estimatedSeconds,
      isOutro,
      cueType
    };
  });
}

/**
 * Sentence level splitter (Arabic & English)
 */
function splitBySentences(text: string): string[] {
  // Replace newlines with sentence breaks
  const paragraphs = text.split(/\n+/);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    // Regex matches sentence terminators: . ! ؟ ? ; ؛ :
    // While preserving abbreviations if any
    const regex = /([^.!?؟؛;:\n]+[.!?؟؛;:]*)/g;
    const matches = para.match(regex);

    if (matches && matches.length > 0) {
      for (const m of matches) {
        if (m.trim()) chunks.push(m.trim());
      }
    } else {
      chunks.push(para.trim());
    }
  }

  return chunks;
}

/**
 * Half-sentence / clause level splitter (splitting also by commas, dashes)
 */
function splitByHalfSentences(text: string): string[] {
  const sentenceChunks = splitBySentences(text);
  const result: string[] = [];

  for (const sentence of sentenceChunks) {
    // Split sentence by commas (Arabic '،' and English ','), em-dash '—', and semicolons
    const subParts = sentence.split(/([،,–—\-])/g);
    
    let currentPart = '';
    for (let i = 0; i < subParts.length; i++) {
      const part = subParts[i];
      if (['،', ',', '–', '—', '-'].includes(part)) {
        currentPart += part;
        if (countWords(currentPart) >= 3) {
          result.push(currentPart.trim());
          currentPart = '';
        }
      } else {
        currentPart += (currentPart ? ' ' : '') + part.trim();
      }
    }

    if (currentPart.trim()) {
      result.push(currentPart.trim());
    }
  }

  return result.filter(c => c.trim().length > 0);
}

/**
 * Split text by approximate word count
 */
function splitByWordCount(text: string, maxWords: number = 8): string[] {
  const words = text.replace(/\n/g, ' \n ').split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let buffer: string[] = [];

  for (const word of words) {
    if (word === '\n') {
      if (buffer.length > 0) {
        chunks.push(buffer.join(' '));
        buffer = [];
      }
      continue;
    }

    buffer.push(word);

    // If we reached maxWords or if the word ends with punctuation (. ! ؟ ?)
    const hasPunctuation = /[.!?؟]$/.test(word);
    if (buffer.length >= maxWords || (buffer.length >= Math.max(3, maxWords - 2) && hasPunctuation)) {
      chunks.push(buffer.join(' '));
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    chunks.push(buffer.join(' '));
  }

  return chunks;
}

/**
 * Formats seconds into MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
