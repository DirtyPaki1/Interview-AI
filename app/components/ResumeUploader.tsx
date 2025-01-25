import React, { useState, useRef } from 'react';
import Chat from './Chat';

const ResumeUploader = () => {
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialText, setInitialText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      console.error('No file selected');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { text: extractedText } = await response.json();

      setInitialText(extractedText);
      setShowChat(true);
    } catch (error) {
      console.error('Error processing resume:', error);
      alert('An error occurred while processing your resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div>
      <p className="instructions-text">{!showChat ? 'Upload your resume to start the interview.' : 'Answer Bob\'s questions.'}</p>
      {!showChat ? (
        <>
          <button onClick={handleFileInput}>Select Resume File</button>
          <input 
            type="file" 
            id="file-upload" 
            onChange={handleResumeUpload} 
            accept="application/pdf"
            ref={inputRef}
            style={{ display: 'none' }}
          />
          {isLoading && <div className="loading-spinner"></div>}
        </>
      ) : (
        <Chat initialText={initialText} />
      )}
    </div>
  );
};

export default ResumeUploader;
