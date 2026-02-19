import { HighlightMode, WordToken } from '../types';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

/**
 * Extracts text from a file (txt, md, pdf, docx)
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractPdfText(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
    return extractDocxText(file);
  } else {
    return extractPlainText(file);
  }
};

const extractPlainText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const extractPdfText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + ' ';
  }

  return fullText;
};

const extractDocxText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file. Please ensure it is a valid Word document.");
  }
};

/**
 * Tokenizes text into words suitable for RSVP
 */
export const tokenizeText = (text: string): WordToken[] => {
  // Split by whitespace but keep punctuation attached for display
  // We want to detect punctuation to add slight pauses
  const rawWords = text.trim().split(/\s+/);
  
  return rawWords.map((word, index) => {
    const hasPunctuation = /[.,;?!]$/.test(word);
    return {
      word,
      originalIndex: index,
      hasPunctuation
    };
  });
};

/**
 * Determines the indices to highlight based on the mode and ORP logic
 */
export const getHighlightRange = (word: string, mode: HighlightMode): { start: number; end: number; alignIndex: number } => {
  const len = word.length;
  let start = 0;
  let end = 0; // Exclusive
  let alignIndex = 0; // The character index that should be centered

  switch (mode) {
    case HighlightMode.FIRST_LETTER:
      end = 1;
      alignIndex = 0;
      break;
    
    case HighlightMode.FIRST_TWO:
      end = Math.min(2, len);
      alignIndex = end === 2 ? 1 : 0;
      break;

    case HighlightMode.FIRST_HALF:
      end = Math.ceil(len / 2);
      alignIndex = Math.floor((end - 1) / 2);
      break;

    case HighlightMode.ORP_OPTIMAL:
      // Logic based on the provided PDF content
      // Table 1: Length 3 -> Index 1 (2nd letter)
      // Length 5 -> Index 1 or 2 (around 30-40%)
      // Length 7 -> Index 2 (3rd letter)
      // Formula approximation: 35% into the word
      const orpIndex = len <= 1 ? 0 : Math.ceil(len * 0.35) - 1;
      start = orpIndex;
      end = orpIndex + 1;
      alignIndex = orpIndex;
      break;

    case HighlightMode.NONE:
      start = -1;
      end = -1;
      alignIndex = Math.floor(len / 2);
      break;
  }

  return { start, end, alignIndex };
};