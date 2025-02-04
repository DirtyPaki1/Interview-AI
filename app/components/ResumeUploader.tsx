"use client";

import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import Chat from "./Chat";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

interface FileState {
  file: File | null;
}

export default function ResumeUploader({
  isDarkMode,
  setIsDarkMode,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialText, setInitialText] = useState("");
  const [fileState, setFileState] = useState<FileState>({ file: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
        new Blob([pdfWorker], { type: "application/javascript" })
      );
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        return;
      }
      setFileState({ file });
      setInitialText(file.name);
      setError(null);
    }
  };

  const fetchOpenAIResponse = async (extractedText: string): Promise<string> => {
    try {
      const response = await fetch("/api/openai-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Here is my resume:\n------\n${extractedText}` }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const aiResponse = await response.json();
      return aiResponse.response;
    } catch (err) {
      console.error("Error fetching OpenAI response:", err);
      setError("Failed to communicate with the server.");
      throw err;
    }
  };

  const mergeTextContent = (textContent: any): string => {
    let result = "";
    if (textContent?.items?.length) {
      textContent.items.forEach((item: any) => {
        if (item.str) {
          result += item.str + (item.hasEOL ? "\n" : " ");
        }
      });
    } else {
      throw new Error("No readable text found in PDF.");
    }
    return result;
  };

  const extractTextWithOCR = async (file: File): Promise<string> => {
    const image = await readAsImage(file);
    return Tesseract.recognize(image, "eng", {
      logger: (m) => console.log(m),
    }).then(({ data: { text } }) => text);
  };

  const readAsImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!fileState.file) {
      setError("Please select a file first");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await fileState.file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      if (pdf.numPages === 0) throw new Error("No pages found in PDF");

      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();

      let extractedText = mergeTextContent(textContent);

      if (!extractedText.trim()) {
        extractedText = await extractTextWithOCR(fileState.file);
        if (!extractedText.trim()) {
          throw new Error("Failed to extract text from PDF. It may be image-based or corrupted.");
        }
      }

      const aiResponse = await fetchOpenAIResponse(extractedText);
      setInitialText(aiResponse);
      setShowChat(true);
    } catch (error) {
      console.error("Error processing resume:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <p className="instructions-text" style={{ fontSize: "18px", marginBottom: "20px" }}>
        {!showChat ? "Upload your resume to start the interview." : "Answer Bob's questions."}
      </p>
      
      {!showChat ? (
        <>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            style={{ marginBottom: "20px" }} 
          />
          
          {fileState.file && (
            <div style={{ marginTop: "20px" }}>
              <p>Selected File: {fileState.file.name}</p>
              <button
                onClick={() => setFileState({ file: null })}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#8028fe",
                  color: "#fff",
                  border: "none",
                  borderRadius: "15px",
                  cursor: "pointer",
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
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#8028fe",
              color: "#fff",
              border: "none",
              borderRadius: "15px",
              cursor: "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Processing..." : "Upload Resume"}
          </button>

          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </>
      ) : (
        <Chat initialText={initialText} />
      )}
    </div>
  );
}
