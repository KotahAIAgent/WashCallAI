# Troubleshooting: Can't Click "Create a new function"

## Common Issues and Solutions

### Issue 1: Unsaved Changes
**Symptom:** Button is grayed out or not clickable, "Finish update" button is visible

**Solution:**
1. Look for a **"Finish update"** or **"Save"** button at the top right
2. Click it to save any pending changes
3. Then try clicking "Create a new function" again

### Issue 2: Page Not in Edit Mode
**Symptom:** Button appears but nothing happens when clicked

**Solution:**
1. Look for an **"Edit"** button or pencil icon near the assistant name
2. Click it to enter edit mode
3. Then try creating the function

### Issue 3: Browser/JavaScript Issue
**Symptom:** Button looks normal but doesn't respond

**Solution:**
1. **Refresh the page** (F5 or Cmd+R)
2. **Clear browser cache** and try again
3. **Try a different browser** (Chrome, Firefox, Safari)
4. **Disable browser extensions** temporarily

### Issue 4: Permission/Role Issue
**Symptom:** Button is completely missing or grayed out

**Solution:**
1. Check if you're logged in with the correct account
2. Verify you have edit permissions for this assistant
3. Try logging out and back in

### Issue 5: Alternative Method - Use API
If the UI won't work, we can add the function programmatically via API.

---

## Quick Fixes to Try (In Order):

1. ✅ **Click "Finish update"** button if visible
2. ✅ **Refresh the page** (F5)
3. ✅ **Scroll down** - make sure you're clicking the right button
4. ✅ **Try right-clicking** the button and "Inspect Element" to see if there's an error
5. ✅ **Check browser console** (F12) for JavaScript errors

---

## Alternative: Add Function via API

If the UI continues to not work, I can help you add the function programmatically using Vapi's API. This requires:
- Your Vapi API key
- The assistant ID: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`

Let me know if you want to try the API method instead!

