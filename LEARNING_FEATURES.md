# Power Couple - Language Learning Update

## 🎯 New Features

### **Learning System**
- **Sajid** learns **Indonesian** 🇮🇩
- **Nasywa** learns **Hindi** 🇮🇳  
- Both chat in **English** (their common language)

### **How It Works**

#### For Sajid:
1. Types message in English
2. Sees Indonesian translation below the message
3. All words are automatically collected in the **Learning Bucket** (right panel)
4. Each word shows:
   - English word
   - Indonesian translation 🇮🇩
   - English meaning/explanation

#### For Nasywa:
1. Types message in English  
2. Sees Hindi translation below the message
3. All words collected in her **Learning Bucket**
4. Each word shows:
   - English word
   - Hindi translation 🇮🇳
   - English meaning/explanation

### **Word Collection Bucket**
- **Always visible** on the right side
- Shows count of collected words
- Words accumulate as you chat
- No duplicates - each word added only once
- Numbered list (#1, #2, #3...)

### **Email Feature**
1. Click the **Send** icon in the bucket header
2. Enter your email address
3. Click "Email My Word List"
4. Receive a beautiful HTML email with:
   - All your learned words in a table
   - English word | Translation | Meaning
   - Professional formatting
   - Ready to study offline!

### **Settings**
- Email input field (appears when you click send icon)
- "Clear All Words" button to start fresh
- Word count display

## 🔧 Technical Changes

### API Updates:
- `/api/chat` - Now returns Indonesian/Hindi based on user
- `/api/send-words` - New endpoint for emailing word lists
- Updated Gemini prompt to return ALL words with translations

### UI Changes:
- Simplified message display (translation below message)
- Removed Hindi reference from Sajid's view
- Added persistent word bucket panel
- Email settings integration
- Word counter

## 📧 Email System

Uses Resend API (configured in `.env.local`):
```
RESEND_API_KEY=your_key_here
```

If no API key is set, it will simulate sending (console log).

## 🎨 User Experience

### Sajid's View:
```
[Message in English]
🇮🇩 Indonesian translation

[Right Panel - Learning Indonesian 🇮🇩]
- 15 words collected
- [Send icon for email]
- Word #1: Hello → Halo → A greeting
- Word #2: Friend → Teman → A person you know
...
```

### Nasywa's View:
```
[Message in English]
🇮🇳 Hindi translation

[Right Panel - Learning Hindi 🇮🇳]
- 12 words collected
- [Send icon for email]
- Word #1: Hello → नमस्ते → A greeting
- Word #2: Friend → दोस्त → A person you know
...
```

## 🚀 Next Steps

1. Add Resend API key to `.env.local` for email functionality
2. Test with real Gemini API key for translations
3. Both users can now learn while chatting!

## 💡 Tips

- Words are collected automatically as you chat
- Email yourself the list after each session
- Clear words to start a new learning session
- The more you chat, the more you learn!
