// Offline Q&A Cache System
// Stores AI answers locally and provides keyword-based search when offline

class OfflineQACache {
  constructor() {
    this.dbName = 'QubeXPQACache';
    this.dbVersion = 1;
    this.storeName = 'qa_pairs';
    this.db = null;
    this._initDB();
  }

  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[QA-Cache] IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[QA-Cache] ✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for searching
          objectStore.createIndex('question', 'question', { unique: false });
          objectStore.createIndex('lang', 'lang', { unique: false });
          objectStore.createIndex('keywords', 'keywords', { unique: false, multiEntry: true });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          
          console.log('[QA-Cache] Database created');
        }
      };
    });
  }

  // Extract keywords from question
  _extractKeywords(text) {
    // Remove common stop words
    const stopWords = [
      'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'about', 'tell', 'me', 'can', 'you', 'please'
    ];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    
    return [...new Set(words)]; // Remove duplicates
  }

  // Store Q&A pair
  async store(question, answer, lang) {
    if (!this.db) {
      await this._initDB();
    }

    const keywords = this._extractKeywords(question);
    
    const qaData = {
      question: question.trim(),
      answer: answer.trim(),
      lang: lang,
      keywords: keywords,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(qaData);

      request.onsuccess = () => {
        console.log('[QA-Cache] ✅ Stored Q&A:', question.substring(0, 50));
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[QA-Cache] Store error:', request.error);
        reject(request.error);
      };
    });
  }

  // Find similar questions using keyword matching
  async findSimilar(question, lang, threshold = 0.3) {
    if (!this.db) {
      await this._initDB();
    }

    const questionKeywords = this._extractKeywords(question);
    if (questionKeywords.length === 0) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const langIndex = store.index('lang');
      const request = langIndex.getAll(lang);

      request.onsuccess = () => {
        const records = request.result;
        
        if (records.length === 0) {
          resolve(null);
          return;
        }

        // Calculate similarity scores
        const scored = records.map(record => {
          const matchCount = record.keywords.filter(k => questionKeywords.includes(k)).length;
          const totalKeywords = new Set([...record.keywords, ...questionKeywords]).size;
          const similarity = matchCount / totalKeywords;
          
          return { ...record, similarity };
        });

        // Sort by similarity
        scored.sort((a, b) => b.similarity - a.similarity);

        // Return best match if above threshold
        const best = scored[0];
        if (best.similarity >= threshold) {
          console.log('[QA-Cache] ✅ Found similar:', best.question, '(similarity:', best.similarity.toFixed(2), ')');
          resolve(best);
        } else {
          console.log('[QA-Cache] No similar question found (best similarity:', best.similarity.toFixed(2), ')');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[QA-Cache] Search error:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all cached Q&A pairs for a language
  async getAll(lang) {
    if (!this.db) {
      await this._initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const langIndex = store.index('lang');
      const request = langIndex.getAll(lang);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear old entries (keep last 1000)
  async cleanup(maxEntries = 1000) {
    if (!this.db) {
      await this._initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const timestampIndex = store.index('timestamp');
      const request = timestampIndex.openCursor(null, 'prev');

      let count = 0;
      const toDelete = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          count++;
          if (count > maxEntries) {
            toDelete.push(cursor.primaryKey);
          }
          cursor.continue();
        } else {
          // Delete old entries
          toDelete.forEach(key => store.delete(key));
          console.log('[QA-Cache] Cleaned up', toDelete.length, 'old entries');
          resolve(toDelete.length);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get cache statistics
  async getStats() {
    if (!this.db) {
      await this._initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();

      countRequest.onsuccess = async () => {
        const total = countRequest.result;
        
        // Get count per language
        const langCounts = {};
        for (const lang of ['en', 'hi', 'kn', 'ta', 'te', 'bn']) {
          const count = await this.getAll(lang).then(r => r.length);
          if (count > 0) langCounts[lang] = count;
        }

        resolve({
          total,
          byLanguage: langCounts
        });
      };

      countRequest.onerror = () => {
        reject(countRequest.error);
      };
    });
  }
}

// Create global instance
window.offlineQACache = new OfflineQACache();
console.log('[QA-Cache] ✅ Offline Q&A Cache system initialized');

// Show cache status on load
setTimeout(async () => {
  try {
    const stats = await window.offlineQACache.getStats();
    if (stats.total > 0) {
      console.log(`[QA-Cache] 💾 ${stats.total} Q&A pairs cached offline`);
      console.log('[QA-Cache] Languages:', Object.keys(stats.byLanguage).join(', '));
    } else {
      console.log('[QA-Cache] 📝 No cached Q&A yet - ask questions online to build cache');
    }
  } catch (err) {
    console.warn('[QA-Cache] Could not load stats:', err);
  }
}, 1000);

// Helper functions for console debugging
window.qaCache = {
  // View all cached Q&A
  viewAll: async (lang = 'en') => {
    const all = await window.offlineQACache.getAll(lang);
    console.table(all.map(q => ({
      Question: q.question.substring(0, 50),
      Answer: q.answer.substring(0, 50),
      Language: q.lang,
      Keywords: q.keywords.join(', ')
    })));
    return all;
  },
  
  // Search for similar question
  search: async (question, lang = 'en') => {
    const result = await window.offlineQACache.findSimilar(question, lang);
    if (result) {
      console.log('Found:', result);
      return result;
    } else {
      console.log('No similar question found');
      return null;
    }
  },
  
  // Get statistics
  stats: async () => {
    const stats = await window.offlineQACache.getStats();
    console.log('Cache Statistics:', stats);
    return stats;
  },
  
  // Clean up old entries
  cleanup: async () => {
    const deleted = await window.offlineQACache.cleanup();
    console.log('Cleaned up', deleted, 'old entries');
    return deleted;
  }
};

console.log('[QA-Cache] 💡 Try: qaCache.stats(), qaCache.viewAll(), qaCache.search("what is mars?")');

