# Fix: Click "Finish update" Button First!

## The Problem

You see a **"Finish update"** button in the top right corner of the browser. This button is blocking you from creating a new function.

## The Solution

1. **Click the "Finish update" button** (top right, next to the URL bar)
2. This will save any pending changes
3. **Then** try clicking "Create a new function" again

## Why This Happens

Vapi requires you to finish/save any pending updates before allowing new changes. The "Finish update" button indicates there are unsaved changes that need to be saved first.

## Steps:

1. ✅ Click **"Finish update"** (top right)
2. ✅ Wait for it to save
3. ✅ Then click **"Create a new function"**
4. ✅ Fill in the form:
   - Name: `check_access`
   - Type: Webhook
   - URL: `https://www.fusioncaller.com/api/vapi/check-access`
   - Method: `POST`
5. ✅ Save

---

**OR** use the automatic method via admin panel (no clicking needed!):
- Go to `/app/admin` → Configure Agent → Re-save the agent ID
- Function gets added automatically via API

