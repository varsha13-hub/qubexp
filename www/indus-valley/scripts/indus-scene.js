/**
 * Indus Valley VR Scene Controller
 * Manages the 3D scene, interactions, and site navigation
 */

class IndusScene {
    constructor() {
        this.scene = null;
        this.cameraRig = null;
        this.currentSite = null;
        this.isInitialized = false;
        this.tourStages = [];
        this.currentTourStage = 0;
    }

    initialize() {
        this.scene = document.querySelector('#indusScene');
        this.cameraRig = document.querySelector('#cameraRig');
        
        if (!this.scene || !this.cameraRig) {
            console.error('❌ Scene or camera rig not found');
            return;
        }

        this.setupEventListeners();
        this.setupTourStages();
        this.isInitialized = true;
        
        console.log('✅ Indus Valley scene initialized');
    }

    setupEventListeners() {
        // Site click handlers
        const sites = ['mohenjo-daro', 'harappa', 'dholavira', 'lothal', 'kalibangan'];
        
        sites.forEach(siteId => {
            const siteElement = document.querySelector(`#${siteId}`);
            if (siteElement) {
                siteElement.addEventListener('click', (event) => {
                    this.handleSiteClick(siteId, event);
                });
            }
        });

        // Camera movement completion
        this.cameraRig.addEventListener('animationcomplete', (event) => {
            console.log('📷 Camera animation completed');
        });
    }

    setupTourStages() {
        this.tourStages = [
            {
                name: 'overview',
                position: { x: 0, y: 15, z: 30 },
                rotation: { x: -20, y: 0, z: 0 },
                duration: 3000,
                description: {
                    en: 'Welcome to the Indus Valley Civilization, one of the world\'s earliest urban civilizations.',
                    hi: 'सिंधु घाटी सभ्यता में आपका स्वागत है, जो दुनिया की सबसे पुरानी शहरी सभ्यताओं में से एक है।',
                    kn: 'ಸಿಂಧೂ ಕಣಿವೆ ನಾಗರಿಕತೆಗೆ ಸ್ವಾಗತ, ಇದು ವಿಶ್ವದ ಅತ್ಯಂತ ಹಳೆಯ ನಗರ ನಾಗರಿಕತೆಗಳಲ್ಲಿ ಒಂದಾಗಿದೆ.',
                    ta: 'சிந்து சமவெளி நாகரிகத்திற்கு வரவேற்கிறோம், இது உலகின் மிகப் பழமையான நகர நாகரிகங்களில் ஒன்றாகும்.',
                    te: 'సింధు లోయ నాగరికతకు స్వాగతం, ఇది ప్రపంచంలోని అత్యంత పురాతనమైన నగర నాగరికతలలో ఒకటి.',
                    bn: 'সিন্ধু সভ্যতায় স্বাগতম, যা বিশ্বের প্রাচীনতম নগর সভ্যতাগুলির মধ্যে একটি।'
                }
            },
            {
                name: 'mohenjo-daro',
                position: { x: 0, y: 5, z: -15 },
                rotation: { x: -10, y: 0, z: 0 },
                duration: 3000,
                description: {
                    en: 'Mohenjo-daro, the largest city of the Indus Valley Civilization, known for its Great Bath and advanced urban planning.',
                    hi: 'मोहनजोदड़ो, सिंधु घाटी सभ्यता का सबसे बड़ा शहर, जो अपने महान स्नानागार और उन्नत शहरी योजना के लिए जाना जाता है।',
                    kn: 'ಮೋಹೆಂಜೊದಾರೊ, ಸಿಂಧೂ ಕಣಿವೆ ನಾಗರಿಕತೆಯ ಅತಿದೊಡ್ಡ ನಗರ, ಇದು ಅದರ ಮಹಾನ್ ಸ್ನಾನಗೃಹ ಮತ್ತು ಅತ್ಯಾಧುನಿಕ ನಗರ ಯೋಜನೆಗೆ ಹೆಸರುವಾಸಿಯಾಗಿದೆ.',
                    ta: 'மொஹென்ஜொதாரோ, சிந்து சமவெளி நாகரிகத்தின் மிகப்பெரிய நகரம், இது அதன் பெரிய குளம் மற்றும் மேம்பட்ட நகரத் திட்டமிடலுக்கு பெயர்பெற்றது.',
                    te: 'మొహెంజొదారొ, సింధు లోయ నాగరికత యొక్క అతిపెద్ద నగరం, ఇది దాని గొప్ప స్నానగృహం మరియు అధునాతన నగర ప్రణాళికకు ప్రసిద్ధి చెందింది.',
                    bn: 'মহেঞ্জোদাড়ো, সিন্ধু সভ্যতার বৃহত্তম শহর, যা তার মহান স্নানাগার এবং উন্নত নগর পরিকল্পনার জন্য পরিচিত।'
                }
            },
            {
                name: 'harappa',
                position: { x: -25, y: 5, z: -10 },
                rotation: { x: -10, y: 15, z: 0 },
                duration: 3000,
                description: {
                    en: 'Harappa, another major city famous for its granaries and sophisticated urban planning.',
                    hi: 'हड़प्पा, एक और प्रमुख शहर जो अपने अन्न भंडार और परिष्कृत शहरी योजना के लिए प्रसिद्ध है।',
                    kn: 'ಹರಪ್ಪಾ, ಇನ್ನೊಂದು ಪ್ರಮುಖ ನಗರ, ಇದು ಅದರ ಧಾನ್ಯ ಭಂಡಾರಗಳು ಮತ್ತು ಅತ್ಯಾಧುನಿಕ ನಗರ ಯೋಜನೆಗೆ ಹೆಸರುವಾಸಿಯಾಗಿದೆ.',
                    ta: 'ஹரப்பா, மற்றொரு முக்கிய நகரம், இது அதன் தானிய களஞ்சியங்கள் மற்றும் அதிநவீன நகரத் திட்டமிடலுக்கு பெயர்பெற்றது.',
                    te: 'హరప్పా, మరొక ప్రధాన నగరం, ఇది దాని ధాన్య గోదాములు మరియు అధునాతన నగర ప్రణాళికకు ప్రసిద్ధి చెందింది.',
                    bn: 'হরপ্পা, আরেকটি প্রধান শহর যা তার শস্যাগার এবং পরিশীলিত নগর পরিকল্পনার জন্য বিখ্যাত।'
                }
            },
            {
                name: 'lothal',
                position: { x: 0, y: 5, z: 25 },
                rotation: { x: -10, y: 0, z: 0 },
                duration: 3000,
                description: {
                    en: 'Lothal, the ancient port city with the world\'s earliest known dock, showing advanced maritime trade.',
                    hi: 'लोथल, प्राचीन बंदरगाह शहर जिसमें दुनिया का सबसे पुराना ज्ञात डॉक है, जो उन्नत समुद्री व्यापार दिखाता है।',
                    kn: 'ಲೋಥಲ್, ಪ್ರಾಚೀನ ಬಂದರು ನಗರ, ಇದು ವಿಶ್ವದ ಅತ್ಯಂತ ಹಳೆಯ ತಿಳಿದಿರುವ ಡಾಕ್ ಹೊಂದಿದೆ, ಇದು ಅತ್ಯಾಧುನಿಕ ಸಮುದ್ರ ವ್ಯಾಪಾರವನ್ನು ತೋರಿಸುತ್ತದೆ.',
                    ta: 'லோதல், பண்டைய துறைமுக நகரம், இது உலகின் மிகப் பழமையான அறியப்பட்ட கப்பல்துறையைக் கொண்டுள்ளது, இது மேம்பட்ட கடல் வணிகத்தைக் காட்டுகிறது.',
                    te: 'లోథల్, ప్రాచీన పోర్ట్ నగరం, ఇది ప్రపంచంలోని అత్యంత పురాతనమైన తెలిసిన డాక్ కలిగి ఉంది, ఇది అధునాతన సముద్ర వాణిజ్యాన్ని చూపిస్తుంది.',
                    bn: 'লোথল, প্রাচীন বন্দর শহর যাতে বিশ্বের প্রাচীনতম পরিচিত ডক রয়েছে, যা উন্নত সামুদ্রিক বাণিজ্য দেখায়।'
                }
            }
        ];
    }

    handleSiteClick(siteId, event) {
        console.log('🏛️ Site clicked:', siteId);
        
        if (this.currentSite === siteId) {
            // Already focused on this site, show detailed info
            this.showSiteDetails(siteId);
        } else {
            // Move to and focus on this site
            this.focusOnSite(siteId);
        }
    }

    focusOnSite(siteId) {
        const site = indusData.getSite(siteId, currentLanguage);
        if (!site) return;

        this.currentSite = siteId;
        
        // Calculate camera position for optimal viewing
        const sitePos = site.position;
        const cameraPos = {
            x: sitePos.x + 10,
            y: sitePos.y + 5,
            z: sitePos.z + 10
        };

        // Move camera to site
        this.moveCameraTo(cameraPos, 2000, () => {
            // Update info panel
            updateInfo(site.name, site.description);
            
            // Speak the description
            if (ttsManager) {
                ttsManager.speak(site.description, currentLanguage);
            }
        });
    }

    showSiteDetails(siteId) {
        const site = indusData.getSite(siteId, currentLanguage);
        if (!site) return;

        const featuresText = site.features.join(', ');
        const detailedInfo = `${site.description}\n\nKey Features: ${featuresText}`;
        
        updateInfo(site.name, detailedInfo);
        
        if (ttsManager) {
            ttsManager.speak(detailedInfo, currentLanguage);
        }
    }

    moveCameraTo(position, duration = 3000, onComplete) {
        if (!this.cameraRig) return;

        const startPos = this.cameraRig.object3D.position.clone();
        const endPos = new THREE.Vector3(position.x, position.y, position.z);
        let startTime = null;

        function animate(time) {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.cameraRig.object3D.position.lerpVectors(startPos, endPos, progress);

            if (progress < 1) {
                requestAnimationFrame(animate.bind(this));
            } else {
                console.log("📷 Camera move finished:", endPos);
                if (typeof onComplete === "function") {
                    onComplete();
                }
            }
        }
        requestAnimationFrame(animate.bind(this));
    }

    startGuidedTour() {
        if (!this.tourStages.length) return;

        this.currentTourStage = 0;
        this.playTourStage();
    }

    playTourStage() {
        if (this.currentTourStage >= this.tourStages.length) {
            console.log('🎬 Tour completed');
            return;
        }

        const stage = this.tourStages[this.currentTourStage];
        console.log(`🎬 Tour stage ${this.currentTourStage + 1}: ${stage.name}`);

        // Move camera to stage position
        this.moveCameraTo(stage.position, stage.duration, () => {
            // Update info panel
            const description = stage.description[currentLanguage] || stage.description.en;
            updateInfo(`Tour: ${stage.name}`, description);

            // Speak the description
            if (ttsManager) {
                ttsManager.speak(description, currentLanguage);
            }

            // Auto-advance to next stage after a delay
            setTimeout(() => {
                this.currentTourStage++;
                this.playTourStage();
            }, 8000); // 8 seconds per stage
        });
    }

    showOverview() {
        if (isTourActive) {
            this.moveCameraTo({ x: 0, y: 15, z: 30 }, 3000);
            updateInfo('Indus Valley Overview', 'This ancient civilization spanned across modern-day Pakistan and northwest India, with major cities like Mohenjo-daro and Harappa.');
        }
    }

    resetCamera() {
        this.moveCameraTo({ x: 0, y: 1.6, z: 0 }, 2000);
        this.currentSite = null;
        updateInfo('Welcome to Indus Valley Civilization', 'Explore the ancient cities and learn about this remarkable civilization. Click on sites or use voice commands to learn more.');
    }
}
