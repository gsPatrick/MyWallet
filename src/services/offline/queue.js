import { getDB, STORES } from './db';

/**
 * Adds a request to the pending queue.
 * @param {Object} request - The request object.
 * @param {string} request.url - The API endpoint.
 * @param {string} request.method - HTTP method (POST, PUT, etc.).
 * @param {Object} request.body - The payload.
 * @param {string} request.type - Type of action ('CHAT', 'TRANSACTION', etc.).
 */
export const addToQueue = async (request) => {
    const db = await getDB();
    const item = {
        ...request,
        timestamp: Date.now(),
        status: 'pending'
    };
    await db.add(STORES.PENDING_QUEUE, item);
    return item; // Returns with generated ID (if autoIncrement)
};

/**
 * Removes an item from the queue by ID.
 * @param {number|string} id - The ID of the item to remove.
 */
export const removeFromQueue = async (id) => {
    const db = await getDB();
    await db.delete(STORES.PENDING_QUEUE, id);
};

/**
 * Gets all pending items from the queue, sorted by timestamp.
 */
export const getQueue = async () => {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.PENDING_QUEUE, 'timestamp');
};

/**
 * Clears the entire queue.
 */
export const clearQueue = async () => {
    const db = await getDB();
    await db.clear(STORES.PENDING_QUEUE);
};
