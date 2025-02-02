import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { OpenAIStream } from 'ai';

// Set the runtime to Node.js to support fs and path
export const runtime = 'nodejs';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function fetchOpenAIResponse(extractedText: string): Promise<string> {
  try {
    const { messages } = JSON.parse(extractedText);
    
    // Prepare the system message
    const systemMessage = {
      role: "system",
      content: `You are an expert interviewer specializing in behavioral interviews for software engineers. In the first message, you'll receive a resume. Analyze the data and ask questions one by one based on it. Start with the first question, then wait for the user's reply, and continue until you've asked all questions. Finally, provide feedback to help the user improve.`,
    };

    // Combine the system message with the existing messages
    const combinedMessages = [systemMessage, ...messages];

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: combinedMessages,
      stream: true,
      temperature: 1,
    });

    // Convert the response into a ReadableStream
    const stream = OpenAIStream(response);

    // ✅ Fix: Properly read from ReadableStream
    const reader = stream.getReader();
    let fullResponse = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) {
        fullResponse += new TextDecoder().decode(value);
      }
      done = readerDone;
    }

    return fullResponse;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    throw new Error(`An error occurred during the API request: ${error.message}`);
  }
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ status: 'error', error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique filename
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), 'uploads', uniqueFileName);

    // Save the file to disk
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Import pdf.js dynamically
    const pdfjs = await import('pdfjs-dist');

    // Load the PDF from the file path
    const loadingTask = pdfjs.getDocument({ url: filePath });
    const pdf = await loadingTask.promise;

    if (!pdf.numPages) {
      return NextResponse.json({ status: 'error', error: 'No pages found in PDF' }, { status: 500 });
    }

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const extractedText = mergeTextContent(textContent);

    console.log('Extracted text:', extractedText.substring(0, 100)); // Log first 100 characters for debugging

    // Send extracted resume text to OpenAI API to get the first question from the AI
    const openAIResponse = await fetchOpenAIResponse(extractedText);

    return NextResponse.json({ status: 'ok', text: openAIResponse });
  } catch (err) {
    console.error('Error processing file:', err);
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}

function mergeTextContent(textContent: any): string {
  return textContent.items.map((item: any) => item.str).join(' ');
}
