'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generatePodcastScript(content: string) {
  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt: `
      You are a world-class podcast producer. 
      Convert the following educational content into a viral, engaging podcast script between two hosts:
      
      Host A (Nexus): Enthusiastic, uses metaphors, high energy.
      Host B (Skeptic): Analytical, asks "but how?", needs practical examples.
      
      The dialogue should be natural, including filler words like "um", "ah", and "wait, let me get this straight".
      Keep it under 5 minutes of speech.
      
      Format the output as a JSON array of objects:
      [
        { "host": "A", "text": "..." },
        { "host": "B", "text": "..." }
      ]
      
      Content:
      ${content.substring(0, 10000)}
    `,
  });

  try {
    // Extract JSON if model wrapped it in markdown blocks
    const jsonMatch = text.match(/\[.*\]/s);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.error("Failed to parse podcast script:", e);
    return [{ host: "A", text: "I'm sorry, I couldn't generate the script for this content." }];
  }
}
