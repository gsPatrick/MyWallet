'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiPlus, FiDollarSign, FiCalendar, FiPercent } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useNotification } from '@/contexts/NotificationContext';
import { formatCurrency, getAssetTypeColor } from '@/utils/formatters';
import styles from './page.module.css';

const assetTypes = [
    { id: 'b3', label: 'Ativo B3', types: ['STOCK', 'FII', 'ETF', 'BDR'] },
    { id: 'renda_fixa', label: 'Renda Fixa', types: ['CDB', 'LCI', 'LCA', 'TESOURO_SELIC', 'TESOURO_IPCA', 'TESOURO_PREFIXADO'] },
    { id: 'crypto', label: 'Criptomoeda', types: ['BTC', 'ETH', 'OTHER_CRYPTO'] },
    { id: 'other', label: 'Outros', types: ['FUNDO', 'PREVIDENCIA', 'OTHER'] },
];

const popularAssets = [
    { ticker: 'PETR4', name: 'Petrobras PN', type: 'STOCK', price: 35.20 },
    { ticker: 'VALE3', name: 'Vale ON', type: 'STOCK', price: 72.50 },
    { ticker: 'MXRF11', name: 'Maxi Renda FII', type: 'FII', price: 10.85 },
    { ticker: 'ITUB4', name: 'Itau Unibanco PN', type: 'STOCK', price: 27.80 },
    { ticker: 'HGLG11', name: 'CSHG Logística FII', type: 'FII', price: 168.50 },
    { ticker: 'BBAS3', name: 'Banco do Brasil ON', type: 'STOCK', price: 48.90 },
];

export default function CreateInvestmentPage() {
    const router = useRouter();
    const { addNotification } = useNotification();
    const [step, setStep] = useState(1);
    const [investmentType, setInvestmentType] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        operationType: 'BUY',
        // For financial products
        name: '',
        institution: '',
        investedAmount: '',
        expectedReturn: '',
        returnType: 'CDI',
        maturityDate: '',
        liquidity: 'VENCIMENTO',
    });

    const filteredAssets = popularAssets.filter(asset =>
        asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        addNotification({
            type: 'success',
            title: 'Investimento registrado!',
            message: investmentType === 'b3'
                ? `${formData.operationType === 'BUY' ? 'Compra' : 'Venda'} de ${formData.quantity} ${selectedAsset?.ticker} registrada`
                : `${formData.name} adicionado ao portfólio`
        });
        router.push('/investments');
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button className={styles.backBtn} onClick={() => router.back()}>
                            <FiArrowLeft /> Voltar
                        </button>
                        <h1 className={styles.pageTitle}>Novo Investimento</h1>
                    </motion.div>

                    {/* Steps Indicator */}
                    <motion.div
                        className={styles.steps}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>1</span>
                            <span className={styles.stepLabel}>Tipo</span>
                        </div>
                        <div className={styles.stepLine} />
                        <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>2</span>
                            <span className={styles.stepLabel}>Ativo</span>
                        </div>
                        <div className={styles.stepLine} />
                        <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>3</span>
                            <span className={styles.stepLabel}>Detalhes</span>
                        </div>
                    </motion.div>

                    {/* Step 1: Select Type */}
                    {step === 1 && (
                        <motion.div
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className={styles.stepTitle}>Selecione o tipo de investimento</h2>
                            <div className={styles.typeGrid}>
                                {assetTypes.map(type => (
                                    <Card
                                        key={type.id}
                                        className={`${styles.typeCard} ${investmentType === type.id ? styles.selected : ''}`}
                                        onClick={() => {
                                            setInvestmentType(type.id);
                                            setStep(2);
                                        }}
                                    >
                                        <span className={styles.typeLabel}>{type.label}</span>
                                        <span className={styles.typeSubtypes}>{type.types.join(' • ')}</span>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Select Asset */}
                    {step === 2 && (
                        <motion.div
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className={styles.stepTitle}>
                                {investmentType === 'b3' ? 'Buscar ativo' : 'Informar produto'}
                            </h2>

                            {investmentType === 'b3' ? (
                                <>
                                    <Input
                                        placeholder="Buscar por código ou nome..."
                                        leftIcon={<FiSearch />}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        fullWidth
                                    />

                                    <div className={styles.assetsGrid}>
                                        {filteredAssets.map(asset => (
                                            <Card
                                                key={asset.ticker}
                                                className={`${styles.assetCard} ${selectedAsset?.ticker === asset.ticker ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setFormData(prev => ({ ...prev, price: asset.price.toString() }));
                                                    setStep(3);
                                                }}
                                            >
                                                <div
                                                    className={styles.assetBadge}
                                                    style={{ background: getAssetTypeColor(asset.type) }}
                                                >
                                                    {asset.type}
                                                </div>
                                                <span className={styles.assetTicker}>{asset.ticker}</span>
                                                <span className={styles.assetName}>{asset.name}</span>
                                                <span className={styles.assetPrice}>{formatCurrency(asset.price)}</span>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.formGrid}>
                                    <Input
                                        label="Nome do produto"
                                        placeholder="Ex: CDB Banco Inter 110% CDI"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        fullWidth
                                    />
                                    <Input
                                        label="Instituição"
                                        placeholder="Ex: Banco Inter"
                                        value={formData.institution}
                                        onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                                        fullWidth
                                    />
                                    <Button
                                        fullWidth
                                        onClick={() => setStep(3)}
                                        disabled={!formData.name || !formData.institution}
                                    >
                                        Continuar
                                    </Button>
                                </div>
                            )}

                            <Button variant="ghost" onClick={() => setStep(1)}>
                                <FiArrowLeft /> Voltar
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 3: Details */}
                    {step === 3 && (
                        <motion.div
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className={styles.stepTitle}>Detalhes da operação</h2>

                            {investmentType === 'b3' ? (
                                <Card className={styles.detailsCard}>
                                    <div className={styles.selectedAsset}>
                                        <div
                                            className={styles.assetBadge}
                                            style={{ background: getAssetTypeColor(selectedAsset?.type) }}
                                        >
                                            {selectedAsset?.type}
                                        </div>
                                        <div>
                                            <span className={styles.assetTicker}>{selectedAsset?.ticker}</span>
                                            <span className={styles.assetName}>{selectedAsset?.name}</span>
                                        </div>
                                    </div>

                                    <div className={styles.operationToggle}>
                                        <button
                                            className={`${styles.opBtn} ${formData.operationType === 'BUY' ? styles.buy : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, operationType: 'BUY' }))}
                                        >
                                            Compra
                                        </button>
                                        <button
                                            className={`${styles.opBtn} ${formData.operationType === 'SELL' ? styles.sell : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, operationType: 'SELL' }))}
                                        >
                                            Venda
                                        </button>
                                    </div>

                                    <div className={styles.formGrid}>
                                        <Input
                                            label="Quantidade"
                                            type="number"
                                            placeholder="0"
                                            leftIcon={<FiPlus />}
                                            value={formData.quantity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                        />
                                        <Input
                                            label="Preço unitário"
                                            type="number"
                                            placeholder="0,00"
                                            leftIcon={<FiDollarSign />}
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        />
                                        <Input
                                            label="Data"
                                            type="date"
                                            leftIcon={<FiCalendar />}
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                    </div>

                                    {formData.quantity && formData.price && (
                                        <div className={styles.totalRow}>
                                            <span>Total da operação</span>
                                            <span className={styles.totalValue}>
                                                {formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.price))}
                                            </span>
                                        </div>
                                    )}
                                </Card>
                            ) : (
                                <Card className={styles.detailsCard}>
                                    <div className={styles.formGrid}>
                                        <Input
                                            label="Valor investido"
                                            type="number"
                                            placeholder="0,00"
                                            leftIcon={<FiDollarSign />}
                                            value={formData.investedAmount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, investedAmount: e.target.value }))}
                                        />
                                        <Input
                                            label="Rentabilidade esperada (%)"
                                            type="number"
                                            placeholder="Ex: 110"
                                            leftIcon={<FiPercent />}
                                            value={formData.expectedReturn}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expectedReturn: e.target.value }))}
                                        />
                                        <div className={styles.inputGroup}>
                                            <label className={styles.inputLabel}>Indexador</label>
                                            <select
                                                className={styles.selectInput}
                                                value={formData.returnType}
                                                onChange={(e) => setFormData(prev => ({ ...prev, returnType: e.target.value }))}
                                            >
                                                <option value="CDI">CDI</option>
                                                <option value="SELIC">SELIC</option>
                                                <option value="IPCA">IPCA+</option>
                                                <option value="PREFIXADO">Prefixado</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="Data de vencimento"
                                            type="date"
                                            leftIcon={<FiCalendar />}
                                            value={formData.maturityDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
                                        />
                                    </div>
                                </Card>
                            )}

                            <div className={styles.actionButtons}>
                                <Button variant="ghost" onClick={() => setStep(2)}>
                                    <FiArrowLeft /> Voltar
                                </Button>
                                <Button onClick={handleSubmit}>
                                    Registrar Investimento
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <Dock />
        </div>
    );
}
