# Assets Directory

This directory should contain the following assets for your mobile app:

## Required Assets

### Icons
- `icon.png` - App icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `favicon.png` - Web favicon (48x48px)
- `notification-icon.png` - Notification icon (96x96px)

### Splash Screen
- `splash.png` - Splash screen image (1284x2778px recommended)

### Optional
- `notification-sound.wav` - Custom notification sound

## Generating Assets

You can use online tools or Expo's asset generator:

1. **Using Expo Asset Generator:**
   - Visit: https://www.favicon-generator.org/ or similar
   - Upload your logo
   - Generate all required sizes

2. **Using Figma/Design Tools:**
   - Create 1024x1024px icon
   - Export as PNG
   - Place in this directory

3. **Quick Start (Placeholder):**
   For development, you can use placeholder images. The app will work without these, but you'll need proper assets before building for production.

## Asset Specifications

### App Icon (icon.png)
- Size: 1024x1024px
- Format: PNG
- No transparency
- Square design (iOS will add rounded corners)

### Adaptive Icon (adaptive-icon.png)
- Size: 1024x1024px
- Format: PNG
- Safe zone: 512x512px center area
- Background color will be used

### Splash Screen (splash.png)
- Size: 1284x2778px (or your target device size)
- Format: PNG
- Background color: #ffffff (or your brand color)

### Notification Icon (notification-icon.png)
- Size: 96x96px
- Format: PNG
- White icon on transparent background (Android)
- Colored icon (iOS)

## Notes

- All images should be optimized for mobile
- Use PNG format for best quality
- Consider dark mode variants if needed
- Test on actual devices before production builds

