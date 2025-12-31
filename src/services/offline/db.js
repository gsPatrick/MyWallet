import { openDB } from 'idb';

const DB_NAME = 'mywallet-offline-db';
const DB_VERSION = 1;

export const STORES = {
    PENDING_QUEUE: 'pending_queue',
    CHAT_HISTORY: 'chat_history' // Optional: if we want to store chat history offline
};

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Store for pending offline requests
            if (!db.objectStoreNames.contains(STORES.PENDING_QUEUE)) {
                const store = db.createObjectStore(STORES.PENDING_QUEUE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp');
                store.createIndex('type', 'type');
            }

            // Store for chat messages (to persist across reloads when offline)
            if (!db.objectStoreNames.contains(STORES.CHAT_HISTORY)) {
                const chatStore = db.createObjectStore(STORES.CHAT_HISTORY, {
                    keyPath: 'id'
                });
                chatStore.createIndex('timestamp', 'timestamp');
            }
        },
    });
};


export const getDB = async () => {
    return await initDB();
};

// Chat History Helpers

export const saveChatMessage = async (message) => {
    const db = await getDB();
    await db.put(STORES.CHAT_HISTORY, message);
};

export const getChatHistory = async () => {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.CHAT_HISTORY, 'timestamp');
};

export const updateChatMessageStatus = async (id, status, extraData = {}) => {
    const db = await getDB();
    const tx = db.transaction(STORES.CHAT_HISTORY, 'readwrite');
    const store = tx.objectStore(STORES.CHAT_HISTORY);

    const message = await store.get(id);
    if (message) {
        Object.assign(message, { status, ...extraData });
        await store.put(message);
    }
    await tx.done;
};

