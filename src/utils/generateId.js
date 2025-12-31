/**
 * Generates a unique string ID based on timestamp and random number.
 * Useful for frontend-generated keys and IDs.
 * @returns {string} The generated ID
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
