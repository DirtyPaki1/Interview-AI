'use client';

import { useEffect, useState } from 'react';
import { useChat } from 'ai/react';
import dynamic from 'next/dynamic';
import { ThemeProvider, createTheme, CssBaseline, Switch, FormControlLabel, Box } from '@mui/material';

// Import the actual ChatBoxProps from react-chat-plugin
import { ChatBoxProps } from 'react-chat-plugin';

// Define the ChatMessage type
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

// Define the ChatProps type
type ChatProps = {
  initialText?: string;
};

// Define the user and AI authors
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

const Chat: React.FC<ChatProps> = ({ initialText }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { append, messages, isLoading: isAiLoading } = useChat({
    api: '/api/openai-gpt',
  });

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#8028fe',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f7fa',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#333333', // Changed from #000000 to #333333
        secondary: isDarkMode ? '#cccccc' : '#666666',
      },
      divider: isDarkMode ? '#333333' : '#e0e0e0',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#121212' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#333333', // Changed from #000000 to #333333
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: '#8028fe',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#5a00ff',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          thumb: {
            backgroundColor: isDarkMode ? '#ffffff' : '#333333',
          },
          track: {
            backgroundColor: isDarkMode ? '#cccccc' : '#e0e0e0',
          },
        },
      },
    },
  });

  useEffect(() => {
    if (initialText) {
      setChatMessages([
        {
          author: aiAuthor,
          text: initialText || 'Hello, I am Bob the Interviewer. How can I help you?',
          type: 'text',
          timestamp: Date.now(),
        },
      ]);
    }
  }, [initialText]);

  useEffect(() => {
    if (messages.length > 0) {
      const formattedMessages = messages.map((msg) => ({
        author: msg.role === 'user' ? userAuthor : aiAuthor,
        text: msg.content,
        type: 'text' as const,
        timestamp: Date.now(),
      }));
      setChatMessages(formattedMessages);
    }
  }, [messages]);

  const handleOnSendMessage = async (message: string) => {
    // Add the user's message to the chat
    setChatMessages((prevMessages) => [
      ...prevMessages,
      {
        author: userAuthor,
        text: message,
        type: 'text',
        timestamp: Date.now(),
      },
    ]);

    // Send the message to the API
    try {
      const response = await fetch('/api/openai-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // Add the AI's response to the chat
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          author: aiAuthor,
          text: data.response,
          type: 'text',
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while processing your message.');
    }
  };

  const ChatBoxComponent = dynamic<ChatBoxProps>(() => import('react-chat-plugin'), { ssr: false });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          padding: '20px',
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              color="primary"
            />
          }
          label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
          sx={{ marginBottom: '20px' }}
        />

        {isAiLoading ? (
          <div>Loading...</div>
        ) : (
          <ChatBoxComponent
            messages={chatMessages}
            userId={1}
            onSendMessage={handleOnSendMessage}
            width={'550px'}
            height={'500px'}
            // Remove the authors prop here
          />
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Chat;
