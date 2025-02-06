"use client";
import { useEffect, useState } from "react";
import { useChat } from "ai/react";
import dynamic from "next/dynamic";
import { ThemeProvider, createTheme, CssBaseline, Switch, FormControlLabel, Box } from "@mui/material";

// Types
interface Author {
  username: string;
  id: number;
  avatarUrl: string;
}

interface ChatMessage {
  author: Author;
  text: string;
  type: "text";
  timestamp: number;
}

interface ChatProps {
  resumeText?: string; // Store extracted resume text for processing, but don't display it
}

// Constants
const userAuthor: Author = {
  username: "User",
  id: 1,
  avatarUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
};

const aiAuthor: Author = {
  username: "Bob The Interviewer",
  id: 2,
  avatarUrl: "/bob.jpg",
};

// Main Component
const Chat: React.FC<ChatProps> = ({ resumeText }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize chat with an introduction message
  useEffect(() => {
    setChatMessages([
      {
        author: aiAuthor,
        text: "Hello! I am Bob the Interviewer. I have processed your resume. Ask me anything!",
        type: "text",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const { messages, isLoading: isAiLoading } = useChat({
    api: "/api/openai-gpt",
  });

  // Update chat messages when AI responses arrive
  useEffect(() => {
    if (messages.length > 0) {
      setChatMessages(
        messages.map((msg) => ({
          author: msg.role === "user" ? userAuthor : aiAuthor,
          text: msg.content,
          type: "text" as const,
          timestamp: Date.now(),
        }))
      );
    }
  }, [messages]);

  // Handle sending messages
  const handleOnSendMessage = async (message: string) => {
    setChatMessages((prev) => [
      ...prev,
      { author: userAuthor, text: message, type: "text", timestamp: Date.now() },
    ]);

    try {
      const response = await fetch("/api/openai-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: message },
            ...(resumeText ? [{ role: "system", content: `Resume content: ${resumeText}` }] : []), // Send resume data to AI without displaying it
          ],
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          author: aiAuthor,
          text: data.response || "No response from AI",
          type: "text",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("An error occurred while processing your message.");
    }
  };

  // Dynamic import of ChatBoxComponent
  const ChatBoxComponent = dynamic(() => import("react-chat-plugin"), { ssr: false });

  // Create theme based on dark mode state
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? "dark" : "light",
      primary: { main: "#8028fe" },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <FormControlLabel
          control={<Switch checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} color="primary" />}
          label={isDarkMode ? "Dark Mode" : "Light Mode"}
          sx={{ marginBottom: "20px" }}
        />

        {isAiLoading ? (
          <div>Loading...</div>
        ) : (
          <ChatBoxComponent messages={chatMessages} userId={1} onSendMessage={handleOnSendMessage} width="550px" height="500px" />
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Chat;
