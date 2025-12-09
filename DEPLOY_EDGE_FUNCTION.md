# Deploy Supabase Edge Function via CLI

## Step 1: Install Supabase CLI

**On macOS (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**On macOS (using npm):**
```bash
npm install -g supabase
```

**On Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or download directly:**
- Go to: https://github.com/supabase/cli/releases
- Download for your OS
- Add to PATH

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After logging in, you'll be authenticated in the CLI.

## Step 3: Link to Your Project

You need your Supabase project reference ID. Find it in:
- Supabase Dashboard → Settings → General → Reference ID

Then link:
```bash
supabase link --project-ref your-project-ref-id
```

**Example:**
```bash
supabase link --project-ref abcdefghijklmnop
```

## Step 4: Navigate to Your Project

```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent"
```

## Step 5: Deploy the Function

```bash
supabase functions deploy vapi-webhook
```

This will:
- Upload the function code
- Deploy it to your Supabase project
- Give you the function URL

## Step 6: Get Your Webhook URL

After deployment, you'll see output like:
```
Deployed Function vapi-webhook!
URL: https://abcdefghijklmnop.supabase.co/functions/v1/vapi-webhook
```

**That's your webhook URL!** Copy it.

## Step 7: Configure Vapi

Set the webhook URL in Vapi via API:

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://your-project-ref.supabase.co/functions/v1/vapi-webhook"
  }'
```

Replace:
- `YOUR_ASSISTANT_ID` - Your Vapi assistant ID
- `YOUR_VAPI_API_KEY` - Your Vapi API key (from Vapi Dashboard → Settings → API Keys)
- `your-project-ref` - Your actual Supabase project reference

## Quick Test

Test the function is working:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/vapi-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

You should get a response (even if it's an error about missing data, that means it's working).

## Troubleshooting

### "Command not found: supabase"
- Make sure Supabase CLI is installed
- Check it's in your PATH: `which supabase`

### "Not logged in"
- Run: `supabase login`
- Make sure you complete the browser authentication

### "Project not linked"
- Run: `supabase link --project-ref your-project-ref`
- Make sure you have the correct project reference ID

### "Function not found"
- Make sure you're in the project directory
- Check the function exists: `ls supabase/functions/vapi-webhook/`

## Alternative: Deploy via Dashboard

If CLI doesn't work, you can deploy via Supabase Dashboard:
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name: `vapi-webhook`
4. Copy code from: `supabase/functions/vapi-webhook/index.ts`
5. Click "Deploy"

