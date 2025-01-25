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
  const [chatMessages, setChatMessages] = useState([]);
  const { append, messages } = useChat({
    api: '/api/openai-gpt',
  });

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = [...messages];
      newMessages.push({
        content: initialText || 'Hello, I am Bob the Interviewer. How can I help you?',
        role: 'user',
      });
      setChatMessages(newMessages);
    }
  }, [messages]);

  const handleOnSendMessage = async (message: string) => {
    append({
      content: message,
      role: 'user'
    });

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
    <ChatBox
      style={{ margin: 'auto' }}
      messages={chatMessages}
      userId={1}
      onSendMessage={handleOnSendMessage}
      width={'550px'}
      height={'500px'}
    />
  );
}

export default Chat;
