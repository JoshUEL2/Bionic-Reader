import React, { useCallback, useState } from 'react';
import { Upload, FileText, FileType, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { extractTextFromFile } from '../utils/textProcessor';

interface FileUploadProps {
  onTextLoaded: (text: string) => void;
  onLoadSample: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onTextLoaded, onLoadSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
        throw new Error("No readable text found in file.");
      }
      onTextLoaded(text);
    } catch (err) {
      console.error(err);
      setError("Failed to process file. Please ensure it is a valid text, markdown, PDF, or Word document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in-up">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">BionicFlow</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 transition-colors">Upload any document to start speed reading with optimal focus.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative group cursor-pointer
            border-2 border-dashed rounded-2xl p-12 transition-all duration-300
            flex flex-col items-center justify-center
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102' 
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input 
            type="file" 
            accept=".txt,.md,.pdf,.docx"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {isLoading ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          ) : (
            <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          )}

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors">
            {isLoading ? 'Processing Document...' : 'Click to upload or drag and drop'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto transition-colors">
            Supports PDF, Word (.docx), Markdown (.md), and Text (.txt) files.
          </p>

          <div className="flex gap-4 mt-8 opacity-60 justify-center">
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <FileType size={14} /> PDF
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <FileText size={14} /> DOCX
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <FileText size={14} /> TXT
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <FileText size={14} /> MD
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">OR</p>
          <button
            onClick={onLoadSample}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
          >
            <Sparkles size={16} className="text-yellow-500" />
            Try with Sample Text
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;