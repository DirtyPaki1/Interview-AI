"use client";

import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import Chat from "./Chat";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs"; // Ensure worker is bundled

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
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"; // Adjusted worker path
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

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    if (pdf.numPages === 0) throw new Error("No pages found in PDF");

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    return textContent.items.map((item: any) => item.str).join(" ");
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

      if (!extractedText.trim()) {
        throw new Error("Failed to extract text from PDF.");
      }

      setInitialText(extractedText);
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
          <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ marginBottom: "20px" }} />

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
