# Genesis Engine Environment Setup

To run the Genesis Engine, you need to set up your environment variables. 
Create a file named `.env.local` in the root of the `genesis-engine` directory and add the following:

```env
# Get your API key from https://aistudio.google.com/app/apikey
GOOGLE_GENAI_API_KEY=your_api_key_here
```

### Why is this needed?
The engine uses **Google's Gemini 2.0 Flash** model via the **Genkit** framework to:
1.  **Ingest** content and extract world rules.
2.  **Architect** the 3D world state JSON.
3.  **Generate** grounded AI commentary.

Without this key, the backend flows will return a `500 Internal Server Error`.
