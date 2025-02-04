'use client';

import { useEffect, useState } from 'react';
import { useChat } from 'ai/react';
import dynamic from 'next/dynamic';
import { ThemeProvider, createTheme, CssBaseline, Switch, FormControlLabel, Box } from '@mui/material';

type ChatMessage = {
  author: {
    username: string;
    id: number;
    avatarUrl: string;
  };
  text: string;
  type: 'text';
  timestamp: number;
};

const userAuthor = {
  username: 'User',
  id: 1,
  avatarUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
};

const aiAuthor = {
  username: 'Bob The Interviewer',
  id: 2,
  avatarUrl: '/bob.jpg',
};

const Chat: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { messages, isLoading: isAiLoading } = useChat({
    api: '/api/openai-gpt',
  });

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: '#8028fe' },
    },
  });

  useEffect(() => {
    setChatMessages([
      {
        author: aiAuthor,
        text: 'Hello, I am Bob the Interviewer. How can I help you?',
        type: 'text',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setChatMessages(
        messages.map((msg) => ({
          author: msg.role === 'user' ? userAuthor : aiAuthor,
          text: msg.content,
          type: 'text' as const,
          timestamp: Date.now(),
        }))
      );
    }
  }, [messages]);

  const handleOnSendMessage = async (message: string) => {
    setChatMessages((prev) => [
      ...prev,
      { author: userAuthor, text: message, type: 'text', timestamp: Date.now() },
    ]);

    try {
      const response = await fetch('/api/openai-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { author: aiAuthor, text: data.response || 'No response from AI', type: 'text', timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while processing your message.');
    }
  };

  const ChatBoxComponent = dynamic(() => import('react-chat-plugin'), { ssr: false });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <FormControlLabel
          control={<Switch checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} color="primary" />}
          label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
          sx={{ marginBottom: '20px' }}
        />
        {isAiLoading ? <div>Loading...</div> : <ChatBoxComponent messages={chatMessages} userId={1} onSendMessage={handleOnSendMessage} width="550px" height="500px" />}
      </Box>
    </ThemeProvider>
  );
};

export default Chat;
