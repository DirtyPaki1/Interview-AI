'use client'

import { useEffect, useState } from 'react';
import { useChat } from 'ai/react';
import dynamic from 'next/dynamic';
import type { ChatBoxProps } from 'react-chat-plugin';

const ChatBox = dynamic<ChatBoxProps>(() => import('react-chat-plugin'), { ssr: false });

type ChatProps = {
  initialText?: string;
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

const Chat: React.FC<ChatProps> = ({ initialText }) => {
  const [chatMessages, setChatMessages] = useState<Array<{ content: string; role: string }>>([]);
  const { append, messages, isLoading: isAiLoading } = useChat({
    api: '/api/openai-gpt',
  });

  useEffect(() => {
    if (initialText) {
      // Add the initial message from Bob when the chat starts
      setChatMessages([
        {
          content: initialText || 'Hello, I am Bob the Interviewer. How can I help you?',
          role: 'assistant',
        },
      ]);
    }
  }, [initialText]);

  useEffect(() => {
    // Update chatMessages whenever the `messages` array from `useChat` changes
    if (messages.length > 0) {
      const formattedMessages = messages.map((msg) => ({
        content: msg.content,
        role: msg.role === 'user' ? 'user' : 'assistant',
      }));
      setChatMessages(formattedMessages);
    }
  }, [messages]);

  const handleOnSendMessage = async (message: string) => {
    // Add the user's message to the chat
    append({
      content: message,
      role: 'user',
    });

    try {
      // Send the message to the OpenAI API
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
      append({
        content: data.response,
        role: 'assistant',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while processing your message.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <ChatBox
        messages={chatMessages}
        userId={1}
        onSendMessage={handleOnSendMessage}
        width={'550px'}
        height={'500px'}
        loading={isAiLoading} // Show loading state while AI is processing
        authors={[userAuthor, aiAuthor]} // Add authors for user and AI
      />
    </div>
  );
};

export default Chat;