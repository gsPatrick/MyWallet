/**
 * Offline Cache Service
 * Stores user data locally for offline command handling
 * Returns RichBubble-compatible data structures
 */

const CACHE_KEYS = {
    USER_DATA: 'mywallet_user_cache',
    BANKS: 'mywallet_banks_cache',
    CARDS: 'mywallet_cards_cache',
    LAST_SYNC: 'mywallet_last_sync'
};

/**
 * Save user financial data to localStorage for offline use
 */
export const cacheUserData = (data) => {
    try {
        if (data.banks) {
            localStorage.setItem(CACHE_KEYS.BANKS, JSON.stringify(data.banks));
        }
        if (data.cards) {
            localStorage.setItem(CACHE_KEYS.CARDS, JSON.stringify(data.cards));
        }
        localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
        console.error('Error caching user data:', e);
    }
};

/**
 * Get cached banks
 */
export const getCachedBanks = () => {
    try {
        const data = localStorage.getItem(CACHE_KEYS.BANKS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Get cached cards
 */
export const getCachedCards = () => {
    try {
        const data = localStorage.getItem(CACHE_KEYS.CARDS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Get last sync time
 */
export const getLastSync = () => {
    return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
};

/**
 * Handle commands locally (offline mode)
 * Returns RichBubble-compatible response or text-only response
 */
export const handleOfflineCommand = (text) => {
    const upperText = text.toUpperCase().trim();

    // MENU command - text only
    if (upperText === 'MENU') {
        return {
            type: 'MENU',
            text: `📝 *Comandos disponíveis:*

• SALDO - Ver saldo total
• BANCOS - Ver saldo por conta
• CARTAO - Ver cartões
• PF/PJ - Alternar perfil

💡 *Exemplos de transação:*
• "Gastei 50 no Uber"
• "Recebi 1000 de salário"

⚠️ _Modo offline - dados podem estar desatualizados_`
        };
    }

    // SALDO command - Rich Bubble
    if (upperText === 'SALDO') {
        const banks = getCachedBanks();

        if (banks.length === 0) {
            return {
                type: 'ERROR',
                text: `💰 *Saldo*\n\n_Nenhuma conta em cache. Conecte-se para sincronizar._`
            };
        }

        let totalBalance = 0;
        const banksData = banks.map(b => {
            const balance = parseFloat(b.balance) || 0;
            totalBalance += balance;
            return {
                name: b.bankName || b.name,
                balance: balance,
                icon: b.icon
            };
        });

        // Return RichBubble-compatible structure
        return {
            type: 'BALANCE',
            isRich: true,
            richData: {
                type: 'BALANCE',
                banks: banksData,
                totalBalance: totalBalance
            }
        };
    }

    // BANCOS command - Rich Bubble
    if (upperText === 'BANCOS' || upperText === 'BANCO') {
        const banks = getCachedBanks();

        if (banks.length === 0) {
            return {
                type: 'ERROR',
                text: `🏦 *Minhas Contas*\n\n_Nenhuma conta em cache. Conecte-se para sincronizar._`
            };
        }

        let totalBalance = 0;
        const banksData = banks.map(b => {
            const balance = parseFloat(b.balance) || 0;
            totalBalance += balance;
            return {
                name: b.bankName || b.name,
                balance: balance,
                icon: b.icon
            };
        });

        return {
            type: 'BALANCE',
            isRich: true,
            richData: {
                type: 'BALANCE',
                banks: banksData,
                totalBalance: totalBalance
            }
        };
    }

    // CARTAO/CARTOES command - Rich Bubble
    if (upperText === 'CARTAO' || upperText === 'CARTÃO' || upperText === 'CARTOES' || upperText === 'CARTÕES') {
        const cards = getCachedCards();

        if (cards.length === 0) {
            return {
                type: 'ERROR',
                text: `💳 *Meus Cartões*\n\n_Nenhum cartão em cache. Conecte-se para sincronizar._`
            };
        }

        let totalLimit = 0;
        let totalAvailable = 0;

        const cardsData = cards.map(card => {
            const limit = parseFloat(card.creditLimit || card.limit) || 0;
            const available = parseFloat(card.availableLimit) || limit;
            const used = limit - available;

            totalLimit += limit;
            totalAvailable += available;

            return {
                name: card.name || card.bankName,
                lastFour: card.lastFourDigits || card.lastFour,
                limit: limit,
                used: used,
                brandIcon: card.brandIcon,
                bankIcon: card.bankIcon,
                brand: card.brand,
                color: card.color
            };
        });

        return {
            type: 'CARDS_LIST',
            isRich: true,
            richData: {
                type: 'CARDS_LIST',
                cards: cardsData,
                totalLimit: totalLimit,
                totalAvailable: totalAvailable
            }
        };
    }

    // PF/PJ commands - text only
    if (upperText === 'PF' || upperText === 'PJ') {
        return {
            type: 'SYSTEM',
            text: `⚠️ Alternar perfil requer conexão com o servidor.\n\n_Tente novamente quando estiver online._`
        };
    }

    // FATURA command - text only
    if (upperText === 'FATURA') {
        return {
            type: 'INVOICES',
            text: `📑 *Faturas*\n\n_Ver faturas requer conexão com o servidor._\n\n_Tente novamente quando estiver online._`
        };
    }

    return null; // Not a recognized command
};
