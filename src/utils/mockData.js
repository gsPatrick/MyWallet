// Mock data for investments
const mockPortfolio = {
    summary: {
        totalCost: 125430.50,
        totalCurrentValue: 142850.75,
        totalProfit: 17420.25,
        totalProfitPercent: 13.89,
    },
    positions: [
        { ticker: 'PETR4', name: 'Petrobras PN', type: 'STOCK', quantity: 500, averagePrice: 28.50, currentPrice: 35.20, currentValue: 17600, profit: 3350, profitPercent: 23.51 },
        { ticker: 'VALE3', name: 'Vale ON', type: 'STOCK', quantity: 300, averagePrice: 68.00, currentPrice: 72.50, currentValue: 21750, profit: 1350, profitPercent: 6.62 },
        { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII', quantity: 200, averagePrice: 10.20, currentPrice: 10.85, currentValue: 2170, profit: 130, profitPercent: 6.37 },
        { ticker: 'ITUB4', name: 'Itau Unibanco PN', type: 'STOCK', quantity: 400, averagePrice: 24.50, currentPrice: 27.80, currentValue: 11120, profit: 1320, profitPercent: 13.47 },
        { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII', quantity: 150, averagePrice: 162.00, currentPrice: 168.50, currentValue: 25275, profit: 975, profitPercent: 4.01 },
        { ticker: 'BBAS3', name: 'Banco do Brasil ON', type: 'STOCK', quantity: 350, averagePrice: 42.30, currentPrice: 48.90, currentValue: 17115, profit: 2310, profitPercent: 15.60 },
    ],
    allocation: {
        STOCK: 67.5,
        FII: 27.5,
        RENDA_FIXA: 5.0,
    },
};

const mockFinancialProducts = [
    { id: 1, name: 'CDB Banco Inter', type: 'RENDA_FIXA', subtype: 'CDB', institution: 'Banco Inter', investedAmount: 15000, currentValue: 15890, expectedReturn: 12.5, returnType: 'CDI', maturityDate: '2025-06-15', status: 'ACTIVE' },
    { id: 2, name: 'Tesouro Selic 2029', type: 'RENDA_FIXA', subtype: 'TESOURO_SELIC', institution: 'Tesouro Direto', investedAmount: 10000, currentValue: 10450, expectedReturn: null, returnType: 'SELIC', maturityDate: '2029-03-01', status: 'ACTIVE' },
    { id: 3, name: 'Bitcoin', type: 'CRYPTO', subtype: 'BTC', institution: 'Binance', investedAmount: 5000, currentValue: 7250, expectedReturn: null, returnType: 'VARIAVEL', status: 'ACTIVE' },
];

const mockTransactions = [
    { id: 1, type: 'EXPENSE', description: 'Supermercado', amount: 450.00, date: '2024-12-14', category: 'Alimentação', source: 'MANUAL' },
    { id: 2, type: 'INCOME', description: 'Salário', amount: 12500.00, date: '2024-12-05', category: 'Salário', source: 'OPEN_FINANCE' },
    { id: 3, type: 'EXPENSE', description: 'Netflix', amount: 55.90, date: '2024-12-10', category: 'Streaming', source: 'CREDIT_CARD' },
    { id: 4, type: 'EXPENSE', description: 'Gasolina', amount: 280.00, date: '2024-12-12', category: 'Transporte', source: 'MANUAL' },
    { id: 5, type: 'INCOME', description: 'Dividendo PETR4', amount: 125.00, date: '2024-12-08', category: 'Dividendos', source: 'MANUAL' },
];

const mockBudget = {
    month: 12,
    year: 2024,
    incomeExpected: 12500,
    incomeActual: 12625,
    investPercent: 30,
    emergencyPercent: 10,
    spendingLimit: 7500,
    actualExpenses: 5230.75,
    recommendedInvestment: 3750,
    recommendedEmergencyFund: 1250,
    budgetStatus: 'ON_TRACK',
};

const mockGoals = [
    { id: 1, name: 'Reserva de Emergência', targetAmount: 50000, currentAmount: 35000, deadline: '2025-06-01', category: 'EMERGENCY_FUND', priority: 'HIGH', status: 'ACTIVE', color: '#10b981' },
    { id: 2, name: 'Viagem Europa', targetAmount: 25000, currentAmount: 8500, deadline: '2025-12-01', category: 'TRAVEL', priority: 'MEDIUM', status: 'ACTIVE', color: '#6366f1' },
    { id: 3, name: 'Entrada Apartamento', targetAmount: 100000, currentAmount: 42000, deadline: '2026-06-01', category: 'PROPERTY', priority: 'HIGH', status: 'ACTIVE', color: '#f59e0b' },
];

const mockAlerts = [
    { type: 'success', title: 'Meta atingida!', message: 'Você atingiu 70% da reserva de emergência' },
    { type: 'info', title: 'Dividendo recebido', message: 'R$ 125,00 de PETR4 creditado' },
    { type: 'warning', title: 'Atenção', message: 'Orçamento de alimentação em 85%' },
];

const mockDividends = [
    { asset: 'PETR4', type: 'DIVIDEND', amount: 125.00, paymentDate: '2024-12-08' },
    { asset: 'MXRF11', type: 'RENDIMENTO', amount: 18.50, paymentDate: '2024-12-15' },
    { asset: 'HGLG11', type: 'RENDIMENTO', amount: 112.00, paymentDate: '2024-12-15' },
    { asset: 'ITUB4', type: 'JCP', amount: 45.00, paymentDate: '2024-12-20' },
];

const mockSubscriptions = [
    { id: 1, name: 'Netflix', amount: 55.90, frequency: 'MONTHLY', nextBillingDate: '2025-01-10', category: 'STREAMING' },
    { id: 2, name: 'Spotify', amount: 21.90, frequency: 'MONTHLY', nextBillingDate: '2025-01-05', category: 'STREAMING' },
    { id: 3, name: 'Academia', amount: 129.90, frequency: 'MONTHLY', nextBillingDate: '2025-01-01', category: 'FITNESS' },
    { id: 4, name: 'iCloud', amount: 3.50, frequency: 'MONTHLY', nextBillingDate: '2025-01-15', category: 'SOFTWARE' },
];

const mockCards = [
    { id: 1, name: 'Nubank', brand: 'MASTERCARD', lastFourDigits: '4521', creditLimit: 15000, availableLimit: 8750, closingDay: 3, dueDay: 10, color: '#8B5CF6' },
    { id: 2, name: 'Itaú Platinum', brand: 'VISA', lastFourDigits: '8832', creditLimit: 25000, availableLimit: 18200, closingDay: 15, dueDay: 22, color: '#EC7000' },
];

export {
    mockPortfolio,
    mockFinancialProducts,
    mockTransactions,
    mockBudget,
    mockGoals,
    mockAlerts,
    mockDividends,
    mockSubscriptions,
    mockCards,
};
