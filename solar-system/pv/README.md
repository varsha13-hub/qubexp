# Picovoice Model Files

## 📁 Required Files

You need to create these model files on the Picovoice Console and place them here:

### **Wake Word Models (.ppn files)**

Create at: https://console.picovoice.ai/porcupine

- `cutie_en.ppn` - English wake word "Cutie" (also catches: QT, Q.T., cuty, cutey, kuti, kyuti)
- `cutie_hi.ppn` - Hindi wake word (optional)
- `cutie_kn.ppn` - Kannada wake word (optional)

### **Context Models (.rhn files)**

Create at: https://console.picovoice.ai/rhino

- `context_en.rhn` - English commands
- `context_hi.rhn` - Hindi commands (optional)
- `context_kn.rhn` - Kannada commands (optional)

## 🎯 How to Create Models

### **1. Wake Word (Porcupine)**

1. Go to: https://console.picovoice.ai/porcupine
2. Click **"Train Keyword"**
3. **Keyword:** `hi q` or `hey q`
4. **Language:** English (or your preferred language)
5. **Record your voice** saying the wake word 3-5 times
6. **Download** the `.ppn` file
7. **Rename** to `hey_q_en.ppn` (or appropriate language code)
8. **Place** in this directory

### **2. Commands (Rhino)**

1. Go to: https://console.picovoice.ai/rhino
2. Click **"Create Context"**
3. **Name:** `solar_commands`
4. **Language:** English

**Add these intents and expressions:**

#### **start_tour**
```
start tour
start the tour
begin tour
let's start
```

#### **pause_tour**
```
pause
pause tour
stop
```

#### **resume_tour**
```
resume
continue
play
resume tour
```

#### **land**
Slot: `planet` (enum: mars, jupiter, saturn, earth, venus, mercury, uranus, neptune, sun)
```
land on $planet
go to $planet
visit $planet
take me to $planet
```

#### **next**
```
next
next planet
```

#### **previous**
```
previous
back
go back
```

#### **qa**
Slot: `question` (free-form)
```
what is $question
tell me about $question
how many $question
explain $question
```

5. **Download** the `.rhn` file
6. **Rename** to `context_en.rhn`
7. **Place** in this directory

## 🔧 Access Key

Your Picovoice Access Key is already configured in:
`solar-system/scripts/picovoice-manager.js`

## 🧪 Testing

Once you've created and placed the model files:

1. **Refresh the page**
2. **Check console** for: `[Picovoice] ✅ Ready and listening for "hi Q"`
3. **Say "hi Q"** → Should hear beep
4. **Say "start tour"** → Tour should start

## ⚠️ Important

If you don't create these model files, the app will **automatically fallback** to:
- **Desktop:** Web Speech API
- **VR Headset:** Text input

The app works fine without Picovoice - it's an optional enhancement for better offline support.

## 📊 File Status

- [ ] `hey_q_en.ppn` - **Not created yet** (create on Picovoice Console)
- [ ] `context_en.rhn` - **Not created yet** (create on Picovoice Console)
- [ ] `hey_q_hi.ppn` - Optional
- [ ] `context_hi.rhn` - Optional
- [ ] `hey_q_kn.ppn` - Optional
- [ ] `context_kn.rhn` - Optional

---

**Need help?** See the full setup guide at: `/Users/varsha/Desktop/QubeXP/PICOVOICE_SETUP.md`

