# Wake-Word Voice Control Testing Guide

## 🎤 Quick Start (Hands-Free!)

1. **Open the app** in Chrome (best browser for Web Speech API):
   ```
   http://localhost:8080/solar-system/index.html
   ```

2. **Click anywhere on the page** - Chrome will ask for microphone permission - **ALLOW IT**

3. **You'll see a message**: "Voice ready — say 'hey Q'"

4. **Say the wake word**: "hey Q" (pause briefly)

5. **You'll see**: "Say your command..." - then speak your command

6. **Try these voice commands:**

## 🗣️ Supported Voice Commands

### Wake Word + Commands
- **"hey Q, start tour"** → Starts the planetary tour
- **"hey Q, pause"** → Pauses the tour  
- **"hey Q, resume"** → Resumes the tour
- **"hey Q, land on Mars"** → Goes to Mars
- **"hey Q, next"** → Next planet
- **"hey Q, previous"** → Previous planet

### Two-Step Commands (Recommended)
1. Say **"hey Q"** → Wait for "Say your command..."
2. Then say:
   - **"start tour"**
   - **"pause"** 
   - **"resume"**
   - **"land on Jupiter"**
   - **"go to Earth"**
   - **"visit Saturn"**

## 🎯 Visual Feedback

You'll see messages in the bottom-left corner:
- **"Voice ready — say 'hey Q'"** - System is ready
- **"Listening for 'hey Q'..."** - Waiting for wake word
- **"Say your command..."** - Wake word detected, speak command
- **"Command received"** - Command processed successfully
- **"Command timed out"** - Took too long to speak command

## 🐛 Debugging in Browser Console (F12 or Cmd+Option+I)

### Check 1: Is the system loaded?
```javascript
console.log('=== WAKE-WORD VOICE DEBUG ===');
console.log('A-Frame:', typeof AFRAME !== 'undefined');
console.log('Voice component:', AFRAME.components['voice-command']);
console.log('VC entity:', document.getElementById('vc'));
```

### Check 2: Speech Recognition support
```javascript
console.log('SpeechRecognition:', 
  'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
);
// Should show true
```

### Check 3: Mic permission
```javascript
navigator.permissions.query({name:'microphone'}).then(s => {
  console.log('🎤 Mic permission:', s.state);
});
// Should show 'granted' if you allowed it
```

### Check 4: Manual start (if auto-start fails)
```javascript
window.voiceUI.start();
// Should show "Voice ready — say 'hey Q'"
```

### Check 5: Listen for voice events
```javascript
document.getElementById('vc').addEventListener('voice-cmd', e => {
  console.log('🎤 Voice command received:', e.detail);
});
// Then say "hey Q, start tour" and watch the console
```

### Check 6: Test wake word detection
```javascript
document.getElementById('vc').addEventListener('voice-state', e => {
  console.log('🎤 Voice state:', e.detail);
});
// Watch for 'hotword-listening', 'listening', 'command-handled'
```

## ✅ What You Should See

When you say "hey Q, start tour":
```
[voice-command] wake word detected
[voice-wiring] intent {cmd: 'start-tour', text: 'start tour'}
[voice] Starting tour...
🎬 Starting guided tour...
```

When you say "hey Q, land on Mars":
```
[voice-command] wake word detected  
[voice-wiring] intent {cmd: 'land', planet: 'mars', text: 'land on mars'}
[voice] Landing on mars
🌍 Visiting mars...
```

## 🚨 Common Issues & Fixes

### Issue: No "Voice ready" message appears
**Fix:** 
1. Make sure you clicked somewhere on the page first
2. Check browser console for errors
3. Try: `window.voiceUI.start()` in console

### Issue: Wake word not detected
**Fix:**
1. Say "hey Q" clearly and pause briefly
2. Make sure you're in a quiet environment
3. Try speaking a bit louder
4. Check if mic permission is granted

### Issue: Commands not recognized after wake word
**Fix:**
1. Wait for "Say your command..." message
2. Speak clearly within 6 seconds
3. Use simple commands: "start tour", "pause", "land on Mars"

### Issue: System stops listening
**Fix:**
1. The system auto-restarts, but you can manually restart:
   ```javascript
   window.voiceUI.start();
   ```

## 🌍 Multi-Language Support

To change the recognition language, modify the vc entity:
```html
<!-- For Hindi -->
<a-entity id="vc" voice-command="lang: hi-IN; wakeWord: hey q;"></a-entity>

<!-- For Kannada -->
<a-entity id="vc" voice-command="lang: kn-IN; wakeWord: hey q;"></a-entity>

<!-- For Tamil -->
<a-entity id="vc" voice-command="lang: ta-IN; wakeWord: hey q;"></a-entity>
```

Note: Browser support for regional languages varies. Chrome has best support.

## 📱 Testing on Mobile/Headset

Voice control works on:
- ✅ Chrome Desktop (best)
- ✅ Chrome Android (good) 
- ✅ Meta Quest Browser (good)
- ⚠️ Safari iOS (limited support)
- ❌ Firefox (limited Web Speech API support)

On Quest:
1. Open the page in the Quest browser
2. Click anywhere to start voice control
3. Say "hey Q" then your command
4. Works hands-free in VR!

## 🎯 Advanced Usage

### Custom Wake Word
Change the wake word in the HTML:
```html
<a-entity id="vc" voice-command="wakeWord: computer;"></a-entity>
```

### Manual Control
```javascript
// Start listening manually
window.voiceUI.start();

// Stop listening
window.voiceUI.stop();

// Check if listening
document.getElementById('vc').components['voice-command'].listening;
```

### Add Custom Commands
Edit the voice-cmd event handler in the HTML to add your own commands.

## 🎉 Success!

Once working, you have hands-free voice control that:
- ✅ Listens continuously for "hey Q"
- ✅ Processes natural language commands
- ✅ Works in VR headsets
- ✅ No buttons or UI needed
- ✅ Auto-restarts if it stops
