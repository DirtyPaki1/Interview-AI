"use client";
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
import Chat from './Chat';

interface FileState {
    file: File | null;
}

export default function ResumeUploader({ isDarkMode, setIsDarkMode }: { 
    isDarkMode: boolean; 
    setIsDarkMode: (darkMode: boolean) => void; 
}) {
    const [showChat, setShowChat] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialText, setInitialText] = useState('');
    const [fileState, setFileState] = useState<FileState>({ file: null });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Set worker source using absolute URL
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                `${window.location.origin}/pdf.worker.min.mjs`;
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileState({ file });
            setInitialText(file.name);
        }
    };

    async function fetchOpenAIResponse(extractedText: string): Promise<string> {
      try {
          const response = await fetch('/api/openai-gpt', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                  messages: [{ 
                      role: 'user', 
                      content: `Here is my resume:\n------\n${extractedText}` 
                  }] 
              }),
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.error?.message || 'Unknown error'}`);
          }
  
          const aiResponse = await response.json();
          return aiResponse.text;
      } catch (err) {
          console.error('Error fetching OpenAI response:', err);
          throw err;
      }
  }

    async function mergeTextContent(textContent: any): string {
        let result = '';
        if (textContent && textContent.items) {
            textContent.items.forEach((item: any) => {
                if (item && item.str) {
                    result += item.str + (item.hasEOL ? '\n' : '');
                }
            });
        }
        return result;
    }

    const handleUpload = async () => {
        if (!fileState.file) {
            setError('Please select a file first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const arrayBuffer = await fileState.file.arrayBuffer();
            const loadingTask = await pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            if (!pdf.numPages) {
                throw new Error('No pages found in PDF');
            }

            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const extractedText = mergeTextContent(textContent);

            // Add type checking before using substring
            if (typeof extractedText === 'string') {
                console.log('Extracted text:', extractedText.substring(0, 100));
            } else {
                console.log('Extracted text:', extractedText);
            }
            
            const aiResponse = await fetchOpenAIResponse(extractedText);
            setShowChat(true);
        } catch (error) {
            console.error('Error processing resume:', error);
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <p className="instructions-text" style={{ fontSize: '18px', marginBottom: '20px' }}>
                {!showChat ? 'Upload your resume to start the interview.' : "Answer Bob's questions."}
            </p>

            {!showChat ? (
                <>
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleFileChange}
                        style={{ marginBottom: '20px' }}
                    />
                    
                    {fileState.file && (
                        <div style={{ marginTop: '20px' }}>
                            <p>Selected File: {fileState.file.name}</p>
                            <button 
                                onClick={() => setFileState({ file: null })}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#8028fe',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '15px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!fileState.file || isLoading}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#8028fe',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        {isLoading ? 'Processing...' : 'Upload Resume'}
                    </button>

                    {error && (
                        <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
                    )}
                </>
            ) : (
                <Chat initialText={initialText} />
            )}
        </div>
    );
}

// Add this declaration to your index.d.ts file if needed:
declare module "pdfjs-dist/build/pdf.min.mjs" {
    export * from "pdfjs-dist";
}