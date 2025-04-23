# Cloudflare Workers AI API Gateway

A comprehensive AI API gateway built with Cloudflare Workers and Cloudflare Workers AI, featuring a modern web interface and API endpoints for text, image, and code generation.

## Features

- **Modern Web Interface**: Responsive and intuitive UI for interacting with AI models
- **Text Generation**: Generate text using LLMs like Llama 2
- **Image Generation**: Create images from text prompts using Stable Diffusion
- **Code Generation**: Generate code with AI assistance
- **Email Authentication**: Secure access with email verification codes
- **Usage Statistics**: Track API usage and requests
- **API Documentation**: Built-in examples for cURL, Python, and JavaScript
- **Comprehensive Error Handling**: Robust validation and error responses

## Web Interface

The application includes a complete web interface with the following pages:

- **Login**: Secure authentication with email verification codes
- **Dashboard**: Overview of usage statistics
- **Image Generation**: Create images with customizable settings
- **Text Generation**: Chat-like interface for text generation
- **Code Generation**: Specialized interface for code generation

## API Endpoints

### Authentication

#### POST /api/auth/request-code
Request a verification code for login.

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

#### POST /api/auth/verify
Verify the code and authenticate.

**Request Body:**
```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

### Text Generation

#### POST /api/text/generate
Generate text using LLMs.

**Request Body:**
```json
{
  "prompt": "Write a short story about a robot learning to paint",
  "model": "@cf/meta/llama-2-7b-chat-int8"
}
```

### Image Generation

#### POST /api/image/generate
Generate images from text prompts.

**Request Body:**
```json
{
  "prompt": "A cyberpunk cat in a neon city",
  "model": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "width": 640,
  "height": 640,
  "steps": 30
}
```

### Code Generation

#### POST /api/code/generate
Generate code with AI assistance.

**Request Body:**
```json
{
  "prompt": "Write a function to calculate the Fibonacci sequence in JavaScript",
  "model": "@cf/meta/llama-2-7b-chat-int8"
}
```

### Statistics

#### GET /api/stats
Get usage statistics.

## Setup and Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account with Workers and Workers AI access

### Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/RecLast/aireclast.git
   cd aireclast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `wrangler.json` file based on the example:
   ```bash
   cp wrangler.example.json wrangler.json
   ```

4. Update the configuration with your own values:
   - Replace `your-kv-namespace-id-here` with your KV namespace ID
   - Replace `your-email@example.com` with your allowed email addresses
   - Replace `your-secure-jwt-secret-here` with a secure JWT secret

5. Create a KV namespace:
   ```bash
   npx wrangler kv namespace create AUTH_STORE
   ```
   Then update the `kv_namespaces` section in `wrangler.json` with the returned ID.

6. Configure environment variables in `wrangler.json`:
   - `ALLOWED_EMAILS`: Comma-separated list of emails allowed to access the application
   - `JWT_SECRET`: Secret key for JWT token generation

### Development

Run the application locally:
```bash
npm run dev
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Project Structure

```
aireclast/
├── src/
│   ├── api/                     # API handlers
│   │   ├── auth.ts              # Authentication API
│   │   ├── text.ts              # Text generation API
│   │   ├── image.ts             # Image generation API
│   │   ├── code.ts              # Code generation API
│   │   └── stats.ts             # Statistics API
│   ├── middleware/              # Middleware functions
│   │   ├── auth.ts              # Authentication middleware
│   │   └── validation.ts        # Request validation
│   ├── utils/                   # Utility functions
│   │   ├── response.ts          # Response formatting
│   │   ├── jwt.ts               # JWT handling
│   │   └── email.ts             # Email utilities
│   ├── static/                  # Static assets
│   │   ├── css/                 # CSS styles
│   │   ├── js/                  # JavaScript files
│   │   └── images/              # Image assets
│   ├── templates/               # HTML templates
│   ├── types.ts                 # TypeScript type definitions
│   └── index.ts                 # Main application entry point
├── wrangler.json                # Cloudflare Workers configuration
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Available Models

For a complete list of available models, refer to the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
