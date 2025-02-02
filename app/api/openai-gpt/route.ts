import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();
        
        // Initialize system message
        const systemMessage = {
            role: 'system',
            content: 'You are an AI interviewer. Be professional and friendly.'
        };

        // Initialize messages array if it doesn't exist
        const messageArray = messages || [];

        // Combine the system message with the existing messages
        const combinedMessages = [systemMessage, ...messageArray];

        // Ask OpenAI for a streaming chat completion
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: combinedMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
        });

        return NextResponse.json({
            status: 'success',
            data: response.data
        });
    } catch (error) {
        console.error('Error in OpenAI API call:', error);
        return NextResponse.json({
            status: 'error',
            error: error.message
        }, { status: 500 });
    }
}