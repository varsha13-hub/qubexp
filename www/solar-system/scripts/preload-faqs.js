// Preload FAQs into Offline Cache
// This script loads common Q&A pairs into the cache for offline use

async function preloadFAQs() {
  console.log('[FAQ-Preload] Starting FAQ preload...');
  
  try {
    // Wait for cache to be ready
    if (!window.offlineQACache) {
      console.warn('[FAQ-Preload] Cache not ready yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Fetch FAQ data
    const response = await fetch('data/preloaded-faqs.json');
    if (!response.ok) {
      throw new Error(`Failed to load FAQs: ${response.status}`);
    }
    
    const faqData = await response.json();
    
    // Check if already preloaded
    const stats = await window.offlineQACache.getStats();
    if (stats.total >= 20) {
      console.log('[FAQ-Preload] Cache already has', stats.total, 'entries - skipping preload');
      return;
    }
    
    let loaded = 0;
    const languages = Object.keys(faqData);
    
    for (const lang of languages) {
      const faqs = faqData[lang];
      console.log(`[FAQ-Preload] Loading ${faqs.length} FAQs for ${lang}...`);
      
      for (const faq of faqs) {
        try {
          await window.offlineQACache.store(faq.question, faq.answer, lang);
          loaded++;
        } catch (err) {
          console.warn('[FAQ-Preload] Failed to store:', faq.question, err);
        }
      }
    }
    
    const finalStats = await window.offlineQACache.getStats();
    console.log(`[FAQ-Preload] ✅ Preloaded ${loaded} FAQs`);
    console.log(`[FAQ-Preload] 💾 Total cache: ${finalStats.total} Q&A pairs`);
    console.log(`[FAQ-Preload] Languages:`, Object.keys(finalStats.byLanguage).join(', '));
    
  } catch (err) {
    console.error('[FAQ-Preload] Error:', err);
  }
}

// Auto-preload on first run
if (window.offlineQACache) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(preloadFAQs, 2000); // Wait 2s for everything to initialize
    });
  } else {
    setTimeout(preloadFAQs, 2000);
  }
}

// Expose function for manual preload
window.preloadFAQs = preloadFAQs;
console.log('[FAQ-Preload] 💡 Run preloadFAQs() to manually load 20+ common Q&As');

