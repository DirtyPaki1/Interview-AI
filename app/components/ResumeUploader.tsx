"use client";

import React, { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs"; // Ensure worker is bundled
import Chat from "./Chat";

interface FileState {
  file: File | null;
}

export default function ResumeUploader({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean; setIsDarkMode: (darkMode: boolean) => void }) {
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState<string | undefined>(undefined);

  const [fileState, setFileState] = useState<FileState>({ file: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
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
      setError(null);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map((item: any) => item.str).join(" ") + " ";
    }

    return extractedText.trim();
  };

  const handleUpload = async () => {
    if (!fileState.file) {
      setError("Please select a file first");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const extractedText = await extractTextFromPDF(fileState.file);
      if (!extractedText) throw new Error("Failed to extract text from PDF.");
      setResumeText(extractedText);
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
      {!showChat ? (
        <>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={!fileState.file || isLoading}> {isLoading ? "Processing..." : "Upload Resume"} </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      ) : (
        <Chat resumeText={resumeText ?? undefined} />

      )}
    </div>
  );
}
