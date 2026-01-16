/**
 * AviatorDB - Manejador de Base de Datos Local (IndexedDB)
 * Permite almacenamiento ilimitado de datos históricos.
 */
class AviatorDB {
    constructor() {
        this.dbName = 'AviatorTrackerDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Error al abrir IndexedDB:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB inicializada correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('history')) {
                    const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('multiplier', 'multiplier', { unique: false });
                    console.log('ObjectStore "history" creado');
                }
            };
        });
    }

    async saveMultiplier(entry) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readwrite');
            const store = transaction.objectStore('history');

            // Asegurar que la entrada tenga un timestamp
            const data = {
                ...entry,
                timestamp: entry.timestamp || Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAll() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readonly');
            const store = transaction.objectStore('history');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getRecent(count = 100) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readonly');
            const store = transaction.objectStore('history');
            const index = store.index('timestamp');
            const results = [];

            // Usar un cursor en dirección descendente para obtener los más recientes
            const request = index.openCursor(null, 'prev');

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < count) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async clear() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['history'], 'readwrite');
            const store = transaction.objectStore('history');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// Exportar instancia global
const aviatorDB = new AviatorDB();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aviatorDB;
} else if (typeof window !== 'undefined') {
    window.aviatorDB = aviatorDB;
}
