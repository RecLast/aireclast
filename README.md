
# ReclastAI - Cloudflare Workers AI API Gateway

A comprehensive AI API gateway built with Cloudflare Workers and Cloudflare Workers AI, featuring a modern web interface and API endpoints for text, image, and code generation. Developed by [RecLast](https://www.umiteski.com.tr/) as an open-source solution for AI API access.

![ReclastAI Logo](src/static/images/logo.png)

## Image

![ReclastAI Logo](src/static/images/app.png)

## Features

- **Modern Web Interface**: Responsive and intuitive UI for interacting with AI models
- **Text Generation**: Generate text using advanced LLMs like Llama 2-13B, Qwen 1.5-14B, Gemma-2B, and more
- **Image Generation**: Create images from text prompts using Stable Diffusion XL, SDXL Lightning, DreamShaper, and Flux
- **Code Generation**: Generate code with AI assistance using specialized models like DeepSeek Coder
- **Secure Authentication**: Two-step authentication with email verification and username/password
- **API Key Management**: Generate and manage your API keys for programmatic access
- **Usage Statistics**: Track API usage and requests across different AI services
- **API Documentation**: Built-in examples for cURL, Python, and JavaScript with your personal API key
- **Comprehensive Error Handling**: Robust validation and error responses

## Web Interface

The application includes a complete web interface with the following pages:

- **Login**: Secure two-step authentication with email verification and username/password
- **Dashboard**: Overview of usage statistics and API key management
- **Image Generation**: Create images with customizable settings, models, and dimensions
- **Text Generation**: Chat-like interface for text generation with multiple AI models
- **Code Generation**: Specialized interface for code generation with programming-focused models

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

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Authentication successful",
    "email": "test@example.com",
    "username": "admin",
    "apiKey": "reclast_xxxxxxxxxxxxxxxxxxxx"
  }
}
```

The API key returned in the response should be used for all subsequent API calls.

### Text Generation

#### POST /api/text/generate
Generate text using LLMs.

**Request Body:**
```json
{
  "prompt": "Write a short story about a robot learning to paint",
  "model": "@hf/thebloke/llama-2-13b-chat-awq",
  "max_tokens": 500,
  "temperature": 0.7
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer reclast_xxxxxxxxxxxxxxxxxxxx
```

**Available Models:**
- `@hf/thebloke/llama-2-13b-chat-awq` - Llama 2 (13B)
- `@cf/meta/llama-2-7b-chat-int8` - Llama 2 (7B)
- `@cf/qwen/qwen1.5-14b-chat-awq` - Qwen 1.5 (14B)
- `@cf/google/gemma-2b-it-lora` - Gemma (2B)
- `@cf/mistral/mistral-7b-instruct-v0.1` - Mistral 7B
- `@cf/openchat/openchat-3.5-0106` - OpenChat 3.5

### Image Generation

#### POST /api/image/generate
Generate images from text prompts.

**Request Body:**
```json
{
  "prompt": "A cyberpunk cat in a neon city",
  "model": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "width": 1024,
  "height": 1024,
  "steps": 30
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer reclast_xxxxxxxxxxxxxxxxxxxx
```

**Available Models:**
- `@cf/stabilityai/stable-diffusion-xl-base-1.0` - Stable Diffusion XL (supports dimensions: 1024x1024, 1152x896, 896x1152, 1216x832, 832x1216)
- `@cf/bytedance/stable-diffusion-xl-lightning` - SDXL Lightning (supports dimensions: 1024x1024, 1152x896, 896x1152, max steps: 4)
- `@cf/lykon/dreamshaper-8-lcm` - DreamShaper (supports dimensions: 512x512, 768x512, 512x768, max steps: 10)
- `@cf/black-forest-labs/flux-1-schnell` - Flux-1 Schnell (Premium model, requires confirmPremium: true, only supports 1024x1024, max steps: 8)

**For Premium Models:**
```json
{
  "prompt": "A cyberpunk cat in a neon city",
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "width": 1024,
  "height": 1024,
  "steps": 8,
  "confirmPremium": true
}
```

### Code Generation

#### POST /api/code/generate
Generate code with AI assistance.

**Request Body:**
```json
{
  "prompt": "Write a function to calculate the Fibonacci sequence in JavaScript",
  "model": "@hf/thebloke/deepseek-coder-6.7b-base-awq",
  "max_tokens": 500,
  "temperature": 0.2
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer reclast_xxxxxxxxxxxxxxxxxxxx
```

**Available Models:**
- `@hf/thebloke/deepseek-coder-6.7b-base-awq` - DeepSeek Coder (6.7B)
- `@hf/thebloke/llama-2-13b-chat-awq` - Llama 2 (13B)
- `@cf/qwen/qwen1.5-14b-chat-awq` - Qwen 1.5 (14B)
- `@cf/meta/llama-2-7b-chat-int8` - Llama 2 (7B)
- `@cf/mistral/mistral-7b-instruct-v0.1` - Mistral 7B
- `@cf/openchat/openchat-3.5-0106` - OpenChat 3.5

### Statistics

#### GET /api/stats
Get usage statistics.

**Headers:**
```
Authorization: Bearer reclast_xxxxxxxxxxxxxxxxxxxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "textRequests": 10,
    "imageRequests": 5,
    "codeRequests": 8,
    "totalRequests": 23
  }
}
```

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

7. **Authentication System**:

   The application uses a secure authentication system:

   a. **Step 1: Email Verification**
      - User enters their email address
      - If the email is in the allowed list (ALLOWED_EMAILS), they can proceed to the next step
      - No verification codes or emails are sent

   b. **Step 2: Username/Password Authentication**
      - After email verification, user enters username and password
      - Credentials are checked against the USER_CREDENTIALS environment variable
      - If valid, user is authenticated and redirected to the dashboard
      - A unique API key is generated for the user and displayed in the dashboard

   c. **API Key Management**
      - Users can view their API key in the dashboard
      - Users can regenerate their API key if needed
      - API keys are used for programmatic access to the API endpoints

   This approach provides robust security:
   - Protected pages require authentication
   - API endpoints require a valid API key
   - Each user has their own unique API key
   - API keys can be regenerated if compromised

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

## Model Compatibility and Limitations

### Text and Code Generation Models
- Each model has different capabilities and performance characteristics
- Some models are better suited for specific tasks (e.g., DeepSeek Coder for programming)
- Models have token limits that vary by model
- Temperature and other parameters can be adjusted to control creativity vs. precision

### Image Generation Models
- Each model has specific dimension requirements:
  - **Stable Diffusion XL**: 1024x1024, 1152x896, 896x1152, 1216x832, 832x1216
  - **SDXL Lightning**: 1024x1024, 1152x896, 896x1152 (max steps: 4)
  - **DreamShaper**: 512x512, 768x512, 512x768 (max steps: 10)
  - **Flux-1 Schnell**: 1024x1024 only (max steps: 8, requires confirmPremium: true)
- The application automatically adjusts dimensions and steps to match model requirements
- Premium models require explicit confirmation via the confirmPremium parameter

For a complete list of available models and their parameters, refer to the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/).

## Troubleshooting

### Authentication Issues
- Ensure your email is in the ALLOWED_EMAILS list
- Verify your username and password match the USER_CREDENTIALS configuration
- Check that JWT_SECRET is properly set in the Cloudflare Dashboard
- Clear browser cookies and try logging in again

### API Issues
- Ensure you're using a valid API key in the Authorization header
- Check that your request format matches the examples
- Verify that model parameters (dimensions, steps) are within allowed ranges
- For premium models, include the confirmPremium: true parameter

### Deployment Issues
- Verify that all environment variables are correctly set in the Cloudflare Dashboard
- Ensure the KV namespace is properly bound to AUTH_STORE
- Check Cloudflare Workers logs for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Developed by [RecLast](https://www.umiteski.com.tr/) using Cloudflare Workers and Cloudflare Workers AI.
