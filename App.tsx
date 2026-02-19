import React, { useState, useEffect } from 'react';
import { AppState, ReadingStats, WordToken } from './types';
import FileUpload from './components/FileUpload';
import Reader from './components/Reader';
import Stats from './components/Stats';
import { tokenizeText } from './utils/textProcessor';
import { BarChart2, Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'bionicflow_stats';
const THEME_KEY = 'bionicflow_theme';

const SAMPLE_TEXT = `Welcome to BionicFlow. This is a sample text designed to demonstrate the capabilities of Rapid Serial Visual Presentation (RSVP). By highlighting the Optimal Recognition Point (ORP) in each word, your eyes are guided through the text, reducing saccades and enabling you to read significantly faster while maintaining comprehension. 

Traditional reading requires your eyes to move from word to word, scanning for the unique shape that allows recognition. This process takes time. Bionic reading principles accelerate this by emphasizing the most critical part of the word, allowing your brain to complete the pattern recognition instantly.

Sit back, relax, and let the words flow. Adjust the speed using the up and down arrow keys, or press space to pause. Happy reading!`;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [words, setWords] = useState<WordToken[]>([]);
  const [stats, setStats] = useState<ReadingStats>({ totalWords: 0, totalTimeSeconds: 0, sessions: [] });
  const [lastWpm, setLastWpm] = useState(300);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load stats and theme on mount
  useEffect(() => {
    const savedStats = localStorage.getItem(STORAGE_KEY);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Failed to parse stats", e);
      }
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Default to system preference if no saved preference
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  const saveStats = (newStats: ReadingStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  const handleTextLoaded = (text: string) => {
    const tokens = tokenizeText(text);
    setWords(tokens);
    setAppState(AppState.READING);
  };

  const handleLoadSample = () => {
    handleTextLoaded(SAMPLE_TEXT);
  };

  const handleReadingFinish = (wordsRead: number, duration: number, finalWpm: number) => {
    setLastWpm(finalWpm);
    
    // Only record significant sessions (> 10 seconds or > 50 words)
    if (duration > 10 || wordsRead > 50) {
      const newSession = {
        id: Date.now().toString(),
        date: Date.now(),
        wordsRead,
        durationSeconds: Math.round(duration),
        wpm: finalWpm
      };

      const newStats = {
        totalWords: stats.totalWords + wordsRead,
        totalTimeSeconds: stats.totalTimeSeconds + Math.round(duration),
        sessions: [...stats.sessions, newSession]
      };
      
      saveStats(newStats);
    }
    
    setAppState(AppState.STATS);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return (
          <FileUpload 
            onTextLoaded={handleTextLoaded} 
            onLoadSample={handleLoadSample}
          />
        );
      
      case AppState.READING:
        return (
          <Reader 
            words={words} 
            initialWpm={lastWpm} 
            onFinish={handleReadingFinish} 
            onExit={() => setAppState(AppState.IDLE)} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleDarkMode}
          />
        );
      
      case AppState.STATS:
        return (
          <Stats 
            stats={stats} 
            onBack={() => setAppState(AppState.IDLE)} 
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`h-full flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation for Stats and Theme access when Idle */}
      {appState === AppState.IDLE && (
        <div className="absolute top-0 right-0 p-6 z-10 flex gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors shadow-sm border border-transparent hover:border-yellow-100 dark:hover:border-gray-700"
            title="Toggle Theme"
          >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => setAppState(AppState.STATS)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:shadow border border-transparent hover:border-blue-100 dark:hover:border-gray-700"
          >
            <BarChart2 size={18} />
            <span>Statistics</span>
          </button>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;