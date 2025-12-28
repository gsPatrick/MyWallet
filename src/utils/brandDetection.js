/**
 * Brand Detection Utility
 * ========================================
 * Detects brand from text using subscriptionIcons.json
 * Used for real-time brand detection as user types
 * 
 * SINGLE SOURCE OF TRUTH: subscriptionIcons.json
 * ========================================
 */

import subscriptionIcons from '@/data/subscriptionIcons.json';

/**
 * Normaliza texto para matching
 * - Lowercase
 * - Remove acentos
 * - Remove caracteres especiais
 */
const normalizeText = (text) => {
    if (!text) return '';

    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s*]/g, ' ')       // Remove chars especiais
        .replace(/\s+/g, ' ')            // Normaliza espaços
        .trim();
};

/**
 * Verifica se texto contém keyword
 * Suporta wildcards com *
 */
const matchesKeyword = (normalizedText, keyword) => {
    const normalizedKeyword = normalizeText(keyword);

    // Suporte a wildcard (ex: "uber*" casa com "uber trip")
    if (normalizedKeyword.includes('*')) {
        const pattern = normalizedKeyword.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        return regex.test(normalizedText);
    }

    // Match exato ou como palavra
    const wordBoundaryRegex = new RegExp(`(^|\\s|[^a-z0-9])${normalizedKeyword}($|\\s|[^a-z0-9])`);
    return wordBoundaryRegex.test(` ${normalizedText} `);
};

/**
 * Detecta marca no texto
 * @param {string} text - Texto para analisar (descrição da transação)
 * @returns {Object|null} - { brandKey, icon, name, color, category } ou null
 */
export const detectBrand = (text) => {
    if (!text || text.length < 2) return null;

    const normalizedText = normalizeText(text);
    if (!normalizedText) return null;

    // Iterar sobre todas as marcas no subscriptionIcons
    for (const [brandKey, brand] of Object.entries(subscriptionIcons.subscriptions || {})) {
        const keywords = brand.keywords || [];

        // Se não tem keywords, usa o nome como keyword
        const searchTerms = keywords.length > 0 ? keywords : [brand.name.toLowerCase()];

        for (const keyword of searchTerms) {
            if (matchesKeyword(normalizedText, keyword)) {
                return {
                    brandKey,
                    icon: brand.icon || null, // Pode ser vazio
                    name: brand.name,
                    color: brand.color,
                    category: brand.category
                };
            }
        }
    }

    return null;
};

/**
 * Detecta marca e retorna apenas o ícone
 * @param {string} text - Texto para analisar
 * @returns {string|null} - URL do ícone ou null
 */
export const detectBrandIcon = (text) => {
    const brand = detectBrand(text);
    return brand?.icon || null;
};

/**
 * Hook para usar detecção de marca em componentes
 * @param {string} text - Texto para analisar
 * @returns {Object} - { brand, icon, name, detected }
 */
export const useDetectBrand = (text) => {
    const brand = detectBrand(text);

    return {
        brand,
        icon: brand?.icon || null,
        name: brand?.name || null,
        color: brand?.color || null,
        category: brand?.category || null,
        detected: !!brand
    };
};

export default detectBrand;
