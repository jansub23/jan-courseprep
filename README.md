# Contract Review

A simple web app for reading a contract and asking questions about it. Upload a PDF on the left, chat about it on the right.

## Key features

- **PDF upload and preview:** click to browse or drag and drop a PDF. The contract shows in the left panel so you can read it while you chat.
- **Two independent panels:** the contract and the chat sit side by side and each scrolls on its own.
- **Contract Q&A via webhook:** when you click Send, the PDF and your question are sent to an n8n webhook. The answer appears in the chat with:
  - the **response**,
  - supporting **citations** (the clause or page text), and
  - short **reasoning** for how the citations support the answer.
- **Friendly states:** typing indicator while waiting, and clear messages for non-PDF files, a missing upload, or a failed request.
- **No build tools:** plain HTML, CSS and JavaScript. No frameworks, no npm.

## Run it locally

1. Download or clone this repository.
2. Open `index.html` in your browser (double-click it).
3. Upload a PDF, type a question, and click **Send**.

If the browser blocks the request to the webhook when opening the file directly, serve the folder instead:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Webhook setup

The webhook URL is set at the top of `app.js` (`WEBHOOK_URL`). The app sends a multipart form POST with two fields:

| Field     | Content                |
|-----------|------------------------|
| `file`    | the uploaded PDF       |
| `message` | the user's question    |

It expects a JSON reply in this shape:

```json
{
  "response": "answer based only on the contract",
  "citation": ["clause or page text that supports the answer"],
  "reasoning": "1-2 sentences on how the citations support the response"
}
```

Notes for n8n:

- A `webhook-test` URL only works while the workflow is listening for a test event. Use the production `/webhook/` URL once the workflow is active.
- Allow cross-origin requests on the Webhook node (Allowed Origins / CORS) so the browser can read the reply.

## Files

- `index.html`: page structure
- `styles.css`: navy and orange styling
- `app.js`: upload, preview and chat logic
