import React from 'react';
import { ReadingStats, ReadingSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Clock, BookOpen, Activity, ArrowLeft } from 'lucide-react';

interface StatsProps {
  stats: ReadingStats;
  onBack: () => void;
}

const Stats: React.FC<StatsProps> = ({ stats, onBack }) => {
  // Calculate Average WPM
  const totalWpm = stats.sessions.reduce((acc, sess) => acc + sess.wpm, 0);
  const avgWpm = stats.sessions.length > 0 ? Math.round(totalWpm / stats.sessions.length) : 0;

  // Format data for chart (Last 10 sessions)
  const chartData = stats.sessions.slice(-10).map((s, i) => ({
    name: `Sess ${i + 1}`,
    wpm: s.wpm,
    words: s.wordsRead
  }));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6 overflow-y-auto w-full">
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reading Statistics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
          <BookOpen className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
          <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalWords.toLocaleString()}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide font-medium">Total Words Read</span>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
          <Clock className="w-8 h-8 text-green-500 dark:text-green-400 mb-2" />
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {Math.floor(stats.totalTimeSeconds / 60)}<span className="text-lg text-gray-400 dark:text-gray-500 font-normal">m</span> {stats.totalTimeSeconds % 60}<span className="text-lg text-gray-400 dark:text-gray-500 font-normal">s</span>
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide font-medium">Time Spent Reading</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
          <Activity className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-2" />
          <span className="text-4xl font-bold text-gray-900 dark:text-white">{avgWpm}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide font-medium">Average WPM</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 min-h-[300px] transition-colors">
        <h3 className="text-lg font-semibold mb-6 text-gray-700 dark:text-gray-200">Recent Performance</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9CA3AF'}} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{fill: '#9CA3AF'}} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{fill: '#9CA3AF'}} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#1f2937',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Bar yAxisId="left" dataKey="wpm" name="WPM" fill="#8884d8" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="words" name="Words" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            No session data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;