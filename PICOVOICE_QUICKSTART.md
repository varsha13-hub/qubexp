# Picovoice Quick Start Guide

## 🎯 What You Need to Do

You need to create **2 model files** on the Picovoice Console. This takes about **10-15 minutes**.

## 📋 Step-by-Step Instructions

### **Step 1: Create Wake Word Model (5 minutes)**

1. **Go to:** https://console.picovoice.ai/porcupine
2. **Login with:** `quebxp.official@gmail.com`
3. **Click:** "Train Keyword" button
4. **Enter keyword:** `cutie`
5. **Select language:** English
6. **Train:** Record your voice saying these variations (5-10 recordings each):
   - "cutie" (clear pronunciation)
   - "QT" (letters Q-T)
   - "cuty" (casual)
   - "cutey" (alternative)
7. **Click:** "Train & Download"
8. **Download** the `.ppn` file
9. **Rename** to: `cutie_en.ppn`
10. **Place in:** `/Users/varsha/Desktop/QubeXP/solar-system/pv/cutie_en.ppn`

**Pro tip:** Train with multiple pronunciations to make it catch all variations!

### **Step 2: Create Command Context Model (10 minutes)**

1. **Go to:** https://console.picovoice.ai/rhino
2. **Click:** "Create Context"
3. **Name:** `solar_commands`
4. **Language:** English

**Add these 7 intents:**

#### **Intent 1: start_tour**
Click "Add Intent" → Name: `start_tour`
Add expressions:
```
start tour
start the tour
begin tour
let's start
```

#### **Intent 2: pause_tour**
Add expressions:
```
pause
pause tour
stop
```

#### **Intent 3: resume_tour**
Add expressions:
```
resume
continue
play
resume tour
```

#### **Intent 4: land**
**Add slot:** `planet` (type: enum)
**Values:** mars, jupiter, saturn, earth, venus, mercury, uranus, neptune, sun

Add expressions:
```
land on $planet
go to $planet
visit $planet
take me to $planet
```

#### **Intent 5: next**
Add expressions:
```
next
next planet
```

#### **Intent 6: previous**
Add expressions:
```
previous
back
go back
```

#### **Intent 7: qa**
**Add slot:** `question` (type: free-form)

Add expressions:
```
what is $question
tell me about $question
how many $question
explain $question
```

5. **Click:** "Train Context"
6. **Download** the `.rhn` file
7. **Rename** to: `context_en.rhn`
8. **Place in:** `/Users/varsha/Desktop/QubeXP/solar-system/pv/context_en.rhn`

### **Step 3: Test**

1. **Refresh your browser**
2. **Check console:** Should see `[Picovoice] ✅ Ready and listening for "hi Q"`
3. **Say:** "hi Q" → Should hear beep
4. **Say:** "start tour" → Tour should start
5. **Say:** "hi Q" → "pause tour" → Tour should pause

## 📁 Required Files

After completing Steps 1-2, you should have:

```
/Users/varsha/Desktop/QubeXP/solar-system/pv/
  ├── hey_q_en.ppn     ← Wake word model (from Step 1)
  ├── context_en.rhn   ← Command context (from Step 2)
  └── README.md        ← Instructions
```

## ✅ What's Already Done

- ✅ Picovoice SDK installed (`@picovoice/picovoice-web`)
- ✅ Access key configured in code
- ✅ Manager code created (`picovoice-manager.js`)
- ✅ Auto-fallback to Web Speech API
- ✅ Integration with existing voice commands
- ✅ Text input fallback for VR headsets

## 🧪 Testing Commands

Once models are in place, you can say:

### **Tour Control:**
- "hi Q, start tour"
- "hi Q, pause tour"
- "hi Q, resume tour"
- "hi Q, next"
- "hi Q, previous"

### **Navigation:**
- "hi Q, land on Mars"
- "hi Q, go to Jupiter"
- "hi Q, visit Saturn"

### **Questions:**
- "hi Q, what is Mars"
- "hi Q, tell me about Jupiter"
- "hi Q, how many moons does Saturn have"

## 🎯 Without Models (Current State)

If you don't create the models, the app will automatically use:
- **Desktop Chrome:** Web Speech API (works well)
- **VR Headset:** Text input (works well)

Both are already functional, so Picovoice is **optional** for enhanced offline support.

## 📊 Comparison

| Feature | Web Speech API | Picovoice |
|---------|---------------|-----------|
| **Desktop Chrome** | ✅ Works | ✅ Works |
| **VR Headset** | ❌ Not supported | ✅ Works |
| **Offline** | ❌ Needs internet | ✅ Fully offline |
| **Setup** | ✅ Zero setup | ⏳ Requires model creation |
| **Accuracy** | ✅ Excellent | ✅ Good |
| **Cost** | ✅ Free | ✅ Free tier available |

## 💡 Recommendation

**For now:** Use the current setup (Web Speech API + text input)
**For production VR:** Create Picovoice models following Steps 1-2 above

The text input already works perfectly on Quest, so Picovoice is a nice-to-have, not a must-have.

---

**Questions?** Check the full guide: `PICOVOICE_SETUP.md`

