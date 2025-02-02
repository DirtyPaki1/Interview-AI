"use client";

import React from 'react';
import Image from 'next/image';
import ResumeUploader from './components/ResumeUploader';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = React.useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  React.useEffect(() => {
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
          className={`theme-toggle-btn ${isDarkMode ? 'light' : 'dark'}`}
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

        <ResumeUploader isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>
    </main>
  );
}
