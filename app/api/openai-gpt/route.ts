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
            content: 'You are an AI interviewer. Be professional and friendly.',
        };

        // Ensure messages is an array
        if (!Array.isArray(messages)) {
            throw new Error("Invalid request: 'messages' should be an array.");
        }

        // Combine system message with user messages
        const combinedMessages = [systemMessage, ...messages];

        // Ask OpenAI for a streaming chat completion
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: combinedMessages,
            stream: false,  // 🔥 Set `stream: false` for easier debugging
            temperature: 0.7,
            max_tokens: 1000,
        });

        console.log('OpenAI response:', response); // ✅ Debugging output

        return NextResponse.json({
            status: 'success',
            text: response.choices?.[0]?.message?.content || "No response from OpenAI",
        });
    } catch (error: unknown) {
        console.error('❌ OpenAI API Error:', error);

        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = String(error.message);
        }

        return NextResponse.json(
            { status: 'error', error: errorMessage },
            { status: 500 }
        );
    }
}
