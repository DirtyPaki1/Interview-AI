'use client';

import Image from 'next/image';
import ResumeUploader from './components/ResumeUploader';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <main className="App">
      <div className="container">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-btn"
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '🌙 Dark Mode' : '🌞 Light Mode'}
        </button>

        <div className="logoBox">
          <Image
            src="/logo.png"
            alt="InterviewGPT logo"
            width={400}
            height={75}
            priority
            className="logo"
          />
          <h1>Your AI-Powered Interview Assistant</h1>
        </div>

        <ResumeUploader />
      </div>
    </main>
  );
}
