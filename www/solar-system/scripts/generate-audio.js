// Script to generate all audio files for offline use
require('dotenv').config({ path: '../../server/.env' });
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => {
    // Add SSL certificate check bypass for self-signed cert
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return fetch(...args);
});

// Languages we support
const LANGUAGES = ['en', 'hi', 'kn', 'ta', 'te', 'bn'];

// Voice mapping
const VOICE_BY_LANG = {
    en: 'Meera',
    hi: 'Lekha',
    kn: 'Lekha',
    ta: 'Lekha',
    te: 'Lekha',
    bn: 'Lekha'
};

// Planet data with descriptions
const PLANET_DATA = {
    sun: {
        en: "The Sun is the star at the center of our Solar System. It's a massive ball of hydrogen and helium undergoing constant nuclear fusion, providing light and heat to all the planets.",
        hi: "सूर्य हमारे सौर मंडल के केंद्र में स्थित तारा है। यह हाइड्रोजन और हीलियम का एक विशाल गोला है जो निरंतर नाभिकीय संलयन से ऊर्जा उत्पन्न करता है।",
        // Add translations for other languages
    },
    mercury: {
        en: "Mercury is the smallest and innermost planet in the Solar System. It's a rocky world with extreme temperatures, ranging from very hot during the day to very cold at night.",
        hi: "बुध सौर मंडल का सबसे छोटा और सबसे भीतरी ग्रह है। यह एक चट्टानी दुनिया है जहाँ दिन में बहुत गर्मी और रात में बहुत ठंड होती है।",
        // Add translations for other languages
    },
    venus: {
        en: "Venus is often called Earth's sister planet due to their similar size. However, it has a thick atmosphere of carbon dioxide that creates an extreme greenhouse effect.",
        hi: "शुक्र को अक्सर पृथ्वी का बहन ग्रह कहा जाता है क्योंकि दोनों का आकार समान है। हालांकि, इसमें कार्बन डाइऑक्साइड का एक मोटा वायुमंडल है।",
        // Add translations for other languages
    },
    earth: {
        en: "Earth is our home planet, the only known world to harbor life. It has liquid water on its surface and an atmosphere rich in nitrogen and oxygen.",
        hi: "पृथ्वी हमारा घर ग्रह है, एकमात्र ज्ञात दुनिया जहाँ जीवन है। इसकी सतह पर तरल पानी और नाइट्रोजन और ऑक्सीजन से भरपूर वायुमंडल है।",
        // Add translations for other languages
    },
    mars: {
        en: "Mars is known as the Red Planet due to its reddish appearance. It has polar ice caps, valleys, and the largest volcano in the Solar System, Olympus Mons.",
        hi: "मंगल को लाल ग्रह के नाम से जाना जाता है। इसमें ध्रुवीय बर्फ की टोपियां, घाटियां और सौर मंडल का सबसे बड़ा ज्वालामुखी ओलंपस मोन्स है।",
        // Add translations for other languages
    },
    jupiter: {
        en: "Jupiter is the largest planet in our Solar System. It's a gas giant with a Great Red Spot, which is actually a giant storm that has been raging for hundreds of years.",
        hi: "बृहस्पति हमारे सौर मंडल का सबसे बड़ा ग्रह है। यह एक गैस का विशालकाय ग्रह है जिसमें एक बड़ा लाल धब्बा है, जो वास्तव में एक विशाल तूफान है।",
        // Add translations for other languages
    },
    saturn: {
        en: "Saturn is famous for its beautiful ring system, made mostly of ice particles and rock. It's another gas giant planet with many fascinating moons.",
        hi: "शनि अपनी सुंदर वलय प्रणाली के लिए प्रसिद्ध है, जो ज्यादातर बर्फ के कणों और चट्टान से बनी है। यह एक और गैस का विशालकाय ग्रह है।",
        // Add translations for other languages
    },
    uranus: {
        en: "Uranus is an ice giant planet that rotates on its side. It appears blue-green due to methane in its atmosphere and has a system of thin, dark rings.",
        hi: "यूरेनस एक बर्फीला विशालकाय ग्रह है जो अपनी धुरी पर एक तरफ झुका हुआ घूमता है। इसका वायुमंडल मीथेन की वजह से नीला-हरा दिखता है।",
        // Add translations for other languages
    },
    neptune: {
        en: "Neptune is the windiest planet, with speeds reaching 2,100 kilometers per hour. It's the last of the ice giants and has a deep blue color due to methane.",
        hi: "नेपच्यून सबसे तूफानी ग्रह है, जहाँ हवाओं की गति 2,100 किलोमीटर प्रति घंटा तक पहुंचती है। यह आखिरी बर्फीला विशालकाय ग्रह है।",
        // Add translations for other languages
    }
};

// Additional content
const EXTRA_CONTENT = {
    overview: {
        en: "Welcome to the Solar System tour! Let's explore our cosmic neighborhood, starting from the Sun and traveling outward to the distant ice giants.",
        hi: "सौर मंडल की यात्रा में आपका स्वागत है! आइए हमारे ब्रह्मांडीय पड़ोस की खोज करें, सूर्य से शुरू करके दूर के बर्फीले विशालकाय ग्रहों तक।",
        // Add translations for other languages
    },
    conclusion: {
        en: "Thank you for exploring the Solar System with us! We hope you enjoyed learning about our cosmic neighborhood.",
        hi: "हमारे साथ सौर मंडल की खोज करने के लिए धन्यवाद! हमें आशा है कि आपको हमारे ब्रह्मांडीय पड़ोस के बारे में जानकर आनंद आया।",
        // Add translations for other languages
    }
};

async function generateAudio(text, lang, filename) {
    try {
        const response = await fetch('https://localhost:8040/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                language: lang,
                voice: VOICE_BY_LANG[lang],
                response_type: 'audio_base64'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.audio) {
            throw new Error('No audio data received');
        }

        // Convert base64 to buffer and save
        const buffer = Buffer.from(data.audio, 'base64');
        await fs.writeFile(filename, buffer);
        console.log(`✅ Generated: ${filename}`);
    } catch (error) {
        console.error(`❌ Error generating ${filename}:`, error);
    }
}

async function generateAllAudio() {
    // Create audio directories if they don't exist
    for (const lang of LANGUAGES) {
        await fs.mkdir(path.join(__dirname, '..', 'audio', lang), { recursive: true });
    }

    // Generate for all planets
    for (const [planet, translations] of Object.entries(PLANET_DATA)) {
        for (const lang of LANGUAGES) {
            if (translations[lang]) {
                const filename = path.join(__dirname, '..', 'audio', lang, `${planet}.mp3`);
                await generateAudio(translations[lang], lang, filename);
            }
        }
    }

    // Generate for extra content
    for (const [type, translations] of Object.entries(EXTRA_CONTENT)) {
        for (const lang of LANGUAGES) {
            if (translations[lang]) {
                const filename = path.join(__dirname, '..', 'audio', lang, `${type}.mp3`);
                await generateAudio(translations[lang], lang, filename);
            }
        }
    }
}

// Run the generation
console.log('🎵 Starting audio generation...');
generateAllAudio().then(() => {
    console.log('✨ Audio generation complete!');
}).catch(console.error);
