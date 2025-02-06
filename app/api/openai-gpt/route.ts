import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request: messages array required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }

    // Function to send messages to OpenAI API
    const fetchResponse = async (messagesChunk: any[]) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messagesChunk,
        }),
      });

      if (response.status === 429) {
        return { error: "Rate limit exceeded. Please try again later.", status: 429 };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error?.message || "Failed to fetch OpenAI response", status: 500 };
      }

      const data = await response.json();
      return { response: data.choices[0].message.content };
    };

    // Send the full message and handle chunking if needed
    let fullResponse = "";
    let messagesChunk = [];
    for (let i = 0; i < messages.length; i++) {
      messagesChunk.push(messages[i]);

      // Send the chunk if it reaches a reasonable limit (prevent OpenAI API failure)
      if (i % 10 === 0 || i === messages.length - 1) {
        const result = await fetchResponse(messagesChunk);
        if (result.error) {
          return NextResponse.json(result, { status: result.status });
        }
        fullResponse += result.response + "\n";
        messagesChunk = []; // Reset chunk
      }
    }

    return NextResponse.json({ response: fullResponse.trim() });

  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
