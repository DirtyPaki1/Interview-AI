import fs from 'fs/promises';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

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

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }

    return fullResponse;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    throw new Error(`An error occurred during the API request: ${error.message}`);
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
    });
  }

  try {
    const formData = await req.formData();
    const [file] = formData.getAll('file') as unknown as File[];

    if (!file) {
      return new Response(JSON.stringify({ status: 'error', error: 'No file uploaded' }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 400,
      });
    }

    // Generate a unique filename
    const uniqueFileName = `${Date.now()}-${path.basename(file.name)}`;
    const filePath = path.join(process.cwd(), 'uploads', uniqueFileName);

    // Save the file to disk
    await fs.writeFile(filePath, await file.arrayBuffer());

    // Import pdf.js dynamically
    const pdfjs = await import('pdfjs-dist/build/pdf.worker.mjs');

    // Load the PDF from the file path
    const loadingTask = pdfjs.getDocument({ url: filePath });
    const pdf = await loadingTask.promise;

    if (!pdf.numPages) {
      return new Response(JSON.stringify({ status: 'error', error: 'No pages found in PDF' }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
      });
    }

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const extractedText = mergeTextContent(textContent);

    console.log('Extracted text:', extractedText.substring(0, 100)); // Log first 100 characters for debugging

    // Send extracted resume text to OpenAI API to get the first question from the AI
    const openAIResponse = await fetchOpenAIResponse(extractedText);

    return new Response(JSON.stringify({ status: 'ok', text: openAIResponse }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Error processing file:', err);
    return new Response(JSON.stringify({ status: 'error', error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

function mergeTextContent(textContent: any): string {
  let result = '';
  textContent.items.forEach((item: any) => {
    if (item.str) {
      result += item.str + (item.hasEOL ? '\n' : '');
    }
  });
  return result;
}
