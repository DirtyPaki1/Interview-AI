'use client';

import Image from 'next/image';
import ResumeUploader from './components/ResumeUploader';

export default function Home() {
  return (
    <main className="App">
      <div className="container">
        {/* Logo Section */}
        <div className="logoBox">
          <Image
            src="/logo.png"
            alt="InterviewGPT logo"
            width={400}
            height={75}
            priority // Ensures the logo loads quickly
            className="logo"
          />
          <h1>Your AI-Powered Interview Assistant</h1>
        </div>

        {/* Resume Uploader Component */}
        <ResumeUploader />
        
      </div>
    </main>
  );
}