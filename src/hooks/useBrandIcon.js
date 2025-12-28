/**
 * useBrandIcon Hook
 * ========================================
 * Resolve brandKey para ícone/dados da marca
 * 
 * O backend salva apenas brandKey (ex: "mcdonalds")
 * Este hook busca no dicionário local a imagem e demais dados
 * 
 * SINGLE SOURCE OF TRUTH: subscriptionIcons.json
 * ========================================
 */

import subscriptionIcons from '@/data/subscriptionIcons.json';

/**
 * Busca dados da marca pelo brandKey
 * @param {string} brandKey - Chave da marca (ex: "mcdonalds", "uber")
 * @returns {Object|null} - { icon, name, color, category } ou null
 */
export const getBrandByKey = (brandKey) => {
    if (!brandKey) return null;

    const brand = subscriptionIcons.subscriptions[brandKey];
    if (brand) {
        return {
            icon: brand.icon || null, // Pode ser vazio
            name: brand.name,
            color: brand.color,
            category: brand.category
        };
    }

    // Fallback: tentar buscar por nome normalizado
    const normalizedKey = brandKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fallbackBrand = subscriptionIcons.subscriptions[normalizedKey];
    if (fallbackBrand) {
        return {
            icon: fallbackBrand.icon || null,
            name: fallbackBrand.name,
            color: fallbackBrand.color,
            category: fallbackBrand.category
        };
    }

    return null;
};

/**
 * Retorna URL do ícone da marca
 * @param {string} brandKey - Chave da marca
 * @param {string} fallbackIcon - Ícone padrão se não encontrar
 * @returns {string} - URL do ícone
 */
export const getBrandIcon = (brandKey, fallbackIcon = null) => {
    const brand = getBrandByKey(brandKey);
    return brand?.icon || fallbackIcon;
};

/**
 * Retorna cor da marca
 * @param {string} brandKey - Chave da marca
 * @param {string} fallbackColor - Cor padrão se não encontrar
 * @returns {string} - Cor hex
 */
export const getBrandColor = (brandKey, fallbackColor = '#666666') => {
    const brand = getBrandByKey(brandKey);
    return brand?.color || fallbackColor;
};

/**
 * Lista todas as marcas disponíveis
 * @returns {Array} - Array com { key, name, icon, category }
 */
export const getAllBrands = () => {
    return Object.entries(subscriptionIcons.subscriptions).map(([key, brand]) => ({
        key,
        name: brand.name,
        icon: brand.icon || null,
        category: brand.category,
        color: brand.color
    }));
};

/**
 * Lista marcas por categoria
 * @param {string} category - Nome da categoria
 * @returns {Array} - Marcas da categoria
 */
export const getBrandsByCategory = (category) => {
    return getAllBrands().filter(brand =>
        brand.category?.toLowerCase() === category.toLowerCase()
    );
};

/**
 * Custom hook para usar em componentes React
 * @param {string} brandKey - Chave da marca
 * @returns {Object} - { brand, icon, color, loading }
 */
export const useBrandIcon = (brandKey) => {
    const brand = getBrandByKey(brandKey);

    return {
        brand,
        icon: brand?.icon || null,
        color: brand?.color || '#666666',
        name: brand?.name || null,
        category: brand?.category || null,
        found: !!brand
    };
};

export default useBrandIcon;
