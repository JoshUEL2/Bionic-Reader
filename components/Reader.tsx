import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HighlightMode, WordToken } from '../types';
import { getHighlightRange } from '../utils/textProcessor';
import { Play, Pause, RotateCcw, X, Settings2, Moon, Sun, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ReaderProps {
  words: WordToken[];
  initialWpm: number;
  onFinish: (wordsRead: number, duration: number, wpm: number) => void;
  onExit: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Reader: React.FC<ReaderProps> = ({ words, initialWpm, onFinish, onExit, isDarkMode, toggleTheme }) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(HighlightMode.ORP_OPTIMAL);
  const [showSettings, setShowSettings] = useState(false);
  
  // Stats tracking
  const sessionStartTimeRef = useRef<number | null>(null);
  const totalPauseDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  
  const timerRef = useRef<number | null>(null);

  // Derived current word
  const currentWordToken = words[index] || { word: '', originalIndex: 0, hasPunctuation: false };
  const currentWord = currentWordToken.word;

  // Calculate delay based on WPM and punctuation
  const getDelay = useCallback(() => {
    const baseDelay = 60000 / wpm;
    // Add extra time for punctuation (common RSVP technique)
    if (currentWordToken.hasPunctuation) {
      return baseDelay * 1.5; // 50% slower on punctuation
    }
    // Slight slowdown for long words
    if (currentWord.length > 10) {
      return baseDelay * 1.3;
    }
    return baseDelay;
  }, [wpm, currentWordToken, currentWord.length]);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startReading = useCallback(() => {
    if (index >= words.length) return;
    setIsPlaying(true);
    
    // Resume stats tracking
    if (pauseStartTimeRef.current) {
      totalPauseDurationRef.current += Date.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = null;
    }
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
    }

    const scheduleNext = () => {
      timerRef.current = window.setTimeout(() => {
        setIndex((prev) => {
          const next = prev + 1;
          if (next >= words.length) {
            handleFinish();
            return prev;
          }
          return next;
        });
      }, getDelay());
    };
    scheduleNext();
  }, [index, words.length, getDelay]);

  const pauseReading = useCallback(() => {
    setIsPlaying(false);
    stopTimer();
    pauseStartTimeRef.current = Date.now();
  }, []);

  const handleFinish = useCallback(() => {
    setIsPlaying(false);
    stopTimer();
    
    // Calculate final stats
    const endTime = Date.now();
    const duration = sessionStartTimeRef.current 
      ? (endTime - sessionStartTimeRef.current - totalPauseDurationRef.current) / 1000 
      : 0;
    
    onFinish(index + 1, duration, wpm);
  }, [index, onFinish, wpm]);

  // Effect to manage the play/pause timer logic when index changes
  useEffect(() => {
    if (isPlaying) {
      stopTimer();
      const delay = getDelay();
      timerRef.current = window.setTimeout(() => {
        setIndex((prev) => {
          const next = prev + 1;
          if (next >= words.length) {
            handleFinish();
            return prev;
          }
          return next;
        });
      }, delay);
    }
    return () => stopTimer();
  }, [index, isPlaying, getDelay, words.length, handleFinish]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowUp') {
        setWpm(prev => Math.min(prev + 50, 2000));
      } else if (e.code === 'ArrowDown') {
        setWpm(prev => Math.max(prev - 50, 100));
      } else if (e.code === 'ArrowLeft') {
        setIndex(prev => Math.max(prev - 10, 0));
      } else if (e.code === 'ArrowRight') {
        setIndex(prev => Math.min(prev + 10, words.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words.length]);

  // Handle Pause tracking when user manually toggles
  useEffect(() => {
    if (!isPlaying && !pauseStartTimeRef.current && sessionStartTimeRef.current) {
       pauseStartTimeRef.current = Date.now();
    }
  }, [isPlaying]);

  const progress = Math.min(((index + 1) / words.length) * 100, 100);
  const timeLeftMinutes = Math.ceil(((words.length - index) / wpm));

  // Render Word Logic
  const { start, end, alignIndex } = getHighlightRange(currentWord, highlightMode);

  const getFontSizeClass = () => {
    // Dynamic sizing to ensure letters are forefront and larger on mobile
    // while maintaining identical desktop appearance.
    // Base for mobile is bumped to text-6xl (from 5xl), scaling down only for long words.
    const len = currentWord.length;
    if (len < 10) return 'text-6xl md:text-7xl';
    if (len < 14) return 'text-5xl md:text-7xl';
    return 'text-4xl md:text-7xl'; 
  };

  const renderWord = () => {
    const chars = currentWord.split('').map((char, i) => {
      let isHighlighted = false;
      if (highlightMode !== HighlightMode.NONE) {
        if (highlightMode === HighlightMode.ORP_OPTIMAL) {
          isHighlighted = i === start; 
        } else {
          isHighlighted = i >= start && i < end;
        }
      }
      
      return (
        <span 
          key={i} 
          className={`${isHighlighted ? 'text-red-600 dark:text-red-500 font-bold' : 'text-gray-800 dark:text-gray-200'} ${i === alignIndex ? 'relative' : ''}`}
        >
          {char}
        </span>
      );
    });

    const leftChars = chars.slice(0, alignIndex);
    const centerChar = chars[alignIndex];
    const rightChars = chars.slice(alignIndex + 1);

    return (
      <div className={`flex items-baseline justify-center w-full ${getFontSizeClass()} font-mono leading-none tracking-wide transition-all duration-100 ease-out`}>
        <div className="flex-1 text-right text-gray-800 dark:text-gray-200 opacity-60 font-normal select-none">
          {leftChars}
        </div>
        <div className="mx-0.5 flex justify-center relative select-none">
           {/* The Pivot Character */}
           {centerChar}
           {/* Reticle Lines (Optional, Spritz style) */}
           <div className="absolute -top-4 left-1/2 w-0.5 h-3 bg-gray-300 dark:bg-gray-700 transform -translate-x-1/2"></div>
           <div className="absolute -bottom-4 left-1/2 w-0.5 h-3 bg-gray-300 dark:bg-gray-700 transform -translate-x-1/2"></div>
        </div>
        <div className="flex-1 text-left text-gray-800 dark:text-gray-200 font-normal select-none">
          {rightChars}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative transition-colors">
      {/* Header / Top Bar */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
            <X size={24} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Progress</span>
            <div className="w-24 md:w-48 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-blue-500 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
            <button 
               onClick={toggleTheme}
               className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
               title="Toggle Theme"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <div className="flex flex-col items-end">
                <span className="text-xl md:text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">{wpm} <span className="text-xs md:text-sm text-gray-400 font-sans font-medium">WPM</span></span>
                <span className="text-[10px] md:text-xs text-gray-400">~{timeLeftMinutes}m left</span>
             </div>
             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
             >
                <Settings2 size={24} />
             </button>
        </div>
      </div>

      {/* Settings Panel (Dropdown) */}
      {showSettings && (
        <div className="absolute top-16 md:top-20 right-4 z-20 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 p-6 w-72 md:w-80 animate-fade-in-down">
          <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-4">Reader Configuration</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Highlight Mode</label>
            <div className="space-y-2">
              {Object.values(HighlightMode).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHighlightMode(mode)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    highlightMode === mode 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Speed (WPM)</label>
             <input 
               type="range" 
               min="100" 
               max="1500" 
               step="10" 
               value={wpm} 
               onChange={(e) => setWpm(Number(e.target.value))}
               className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
             <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>100</span>
                <span>1500</span>
             </div>
          </div>
        </div>
      )}

      {/* Main Reading Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Reticle Lines (Horizontal) - Optional visual aid */}
        <div className="absolute w-full h-px bg-red-500/10 top-1/2 transform -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute h-16 w-px bg-red-500/10 left-1/2 transform -translate-x-1/2 pointer-events-none"></div>

        {renderWord()}
      </div>

      {/* Controls Bar */}
      <div className="p-4 pb-8 md:p-8 md:pb-12 flex flex-col items-center justify-center w-full">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-center w-full max-w-3xl mb-4 gap-2 md:gap-4">
          
          {/* Left Group */}
          <div className="flex items-center justify-end gap-2 md:gap-4 pr-2 md:pr-8">
            {/* Reset / Rewind 10 */}
            <button 
              onClick={() => setIndex(Math.max(0, index - 10))}
              className="p-2 md:p-4 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
              aria-label="Rewind 10 words"
              title="Rewind 10"
            >
              <RotateCcw size={20} className="md:w-6 md:h-6" />
            </button>

            {/* Back 5 */}
            <button 
              onClick={() => setIndex(prev => Math.max(0, prev - 5))}
              className="p-2 md:p-4 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
              aria-label="Back 5 words"
              title="Back 5"
            >
              <ChevronsLeft size={24} className="md:w-7 md:h-7" />
            </button>
          </div>

          {/* Center Play Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-4 md:p-6 rounded-full transition-all shadow-lg transform active:scale-95 flex-shrink-0 ${
                isPlaying 
                  ? 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200' 
                  : 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
              }`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" className="md:w-8 md:h-8" /> : <Play size={24} fill="currentColor" className="ml-1 md:w-8 md:h-8" />}
            </button>
          </div>

          {/* Right Group */}
          <div className="flex items-center justify-start gap-2 md:gap-4 pl-2 md:pl-8">
            {/* Forward 5 */}
            <button 
              onClick={() => setIndex(prev => Math.min(words.length - 1, prev + 5))}
              className="p-2 md:p-4 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
              aria-label="Forward 5 words"
              title="Forward 5"
            >
              <ChevronsRight size={24} className="md:w-7 md:h-7" />
            </button>

            {/* Quick WPM Adjust */}
            <div className="relative flex items-center justify-center pl-3 md:pl-6 border-l border-gray-200 dark:border-gray-800 h-10">
               {/* Use relative positioning to let text hang, fixing vertical alignment of slider vs icons */}
               <div className="flex flex-col items-center">
                 <input 
                   type="range" 
                   min="100" 
                   max="1500" 
                   step="25" 
                   value={wpm} 
                   onChange={(e) => setWpm(Number(e.target.value))}
                   className="w-16 md:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                   aria-label="Speed Control"
                 />
                 <span className="absolute top-7 text-[9px] md:text-[10px] text-gray-400 font-mono tabular-nums tracking-tighter">{wpm}</span>
               </div>
            </div>
          </div>

        </div>
        
        {/* Hidden on mobile to clean up UI */}
        <div className="hidden md:block w-full text-center text-sm text-gray-400 dark:text-gray-500 mt-2">
           <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">SPACE</span> to Play/Pause
        </div>
      </div>
    </div>
  );
};

export default Reader;