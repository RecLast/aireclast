
# ReclastAI - Cloudflare Workers AI API Gateway

A comprehensive AI API gateway built with Cloudflare Workers and Cloudflare Workers AI, featuring a modern web interface and API endpoints for text, image, and code generation. Developed by [RecLast](https://www.umiteski.com.tr/) as an open-source solution for AI API access.

![ReclastAI Logo](src/static/images/logo.png)

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

#### POST /api/auth/check-email
Check if an email is allowed to access the application.

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

#### POST /api/auth/login
Login with username and password.

**Request Body:**
```json
{
  "email": "test@example.com",
  "username": "admin",
  "password": "securepass123"
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

4. Update the basic configuration in `wrangler.json`:
   ```json
   {
     "compatibility_date": "2025-04-01",
     "main": "src/index.ts",
     "name": "aireclast",
     "upload_source_maps": true,
     "ai": {
       "binding": "AI"
     },
     "observability": {
       "enabled": true
     },
     "assets": {
       "binding": "ASSETS",
       "directory": "src/static"
     }
   }
   ```

5. Create a KV namespace:
   ```bash
   npx wrangler kv namespace create AUTH_STORE
   ```
   Note the returned ID for the next step.

6. **IMPORTANT**: Instead of adding sensitive information to `wrangler.json`, configure these settings directly in the Cloudflare Dashboard after deployment:

   a. Go to Workers & Pages > Your Worker > Settings

   b. Add KV Namespace binding:
      - In the "Bindings" section, click "+ Add"
      - Type: KV Namespace
      - Variable name: AUTH_STORE
      - KV Namespace: Select your created namespace

   c. Add environment variables:
      - In the "Variables and secrets" section, click "+ Add"
      - Add ALLOWED_EMAILS (Plain text): Comma-separated list of emails allowed to access the application
      - Add USER_CREDENTIALS (Plain text): Comma-separated list of username:password pairs (e.g., "admin:password123,user:pass456")
      - Add JWT_SECRET (Secret): A secure secret key for JWT token generation

7. **Two-Step Authentication**:

   The application uses a simplified two-step authentication system:

   a. **Step 1: Email Verification**
      - User enters their email address
      - If the email is in the allowed list (ALLOWED_EMAILS), they can proceed to the next step
      - No verification codes or emails are sent

   b. **Step 2: Username/Password Authentication**
      - After email verification, user enters username and password
      - Credentials are checked against the USER_CREDENTIALS environment variable
      - If valid, user is authenticated and redirected to the dashboard

   This approach provides good security without requiring email sending:
   - Only allowed emails can proceed to the credentials step
   - Even if someone knows an allowed email, they still need valid credentials
   - No need for KV storage for verification codes
   - No need for third-party email services or API keys

   To set up the authentication:

   1. Configure ALLOWED_EMAILS with comma-separated list of allowed email addresses
   2. Configure USER_CREDENTIALS with comma-separated list of username:password pairs
   3. Set a secure JWT_SECRET for token generation

   Example configuration:
   ```
   ALLOWED_EMAILS: "admin@example.com,user@example.com"
   USER_CREDENTIALS: "admin:securepass123,user:userpass456"
   JWT_SECRET: "your-secure-random-string-here"
   ```

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
