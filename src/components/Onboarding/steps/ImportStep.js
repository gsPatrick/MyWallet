import React, { useState } from 'react';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiX, FiCalendar, FiCreditCard, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CreditCard from '@/components/ui/CreditCard/CreditCard';
import { importAPI } from '@/services/api';

const cardColors = [
    { name: 'Midnight', value: '#1a1a2e' },
    { name: 'Navy', value: '#16213e' },
    { name: 'Slate', value: '#334155' },
    { name: 'Indigo', value: '#312e81' },
    { name: 'Purple', value: '#581c87' },
    { name: 'Rose', value: '#881337' },
    { name: 'Gold', value: '#78350f' },
    { name: 'Emerald', value: '#064e3b' },
    { name: 'Blue', value: '#1e40af' },
    { name: 'Red', value: '#991b1b' },
    { name: 'Prata', value: '#e4e3e4' },
    { name: 'Grafite', value: '#535151' },
    { name: 'Black', value: '#020202' },
];

export default function ImportStep({ onNext, onSkip, onConfirmHelper, isSubComponent }) {
    const [step, setStep] = useState('select-bank'); // 'select-bank', 'select-type', 'upload-card', 'upload-account', 'preview', 'complete'
    const [selectedBank, setSelectedBank] = useState(null);
    const [importType, setImportType] = useState(null); // 'ACCOUNT' or 'CARD'

    // Card Flow State
    const [cardDate, setCardDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() }); // Month 0-11

    // Account Flow State
    const [accountYear, setAccountYear] = useState(new Date().getFullYear());
    const [monthlyStatus, setMonthlyStatus] = useState({}); // { '2024-0': 'success' }

    // Upload & Preview State
    const [currentFile, setCurrentFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInvestment, setIsInvestment] = useState(false);
    const [targetMonthForUpload, setTargetMonthForUpload] = useState(null); // For Account Grid upload

    // Card Form State (for customization during import)
    const [cardForm, setCardForm] = useState({
        name: '',
        lastFourDigits: '',
        closingDay: 1,
        dueDay: 10,
        color: '#1a1a2e',
        brand: 'MASTERCARD', // Default guess
        creditLimit: '',
        blockedLimit: '',
        availableLimit: '',
        holderName: ''
    });

    // Mock Banks List (Same as before)
    const BANKS = [
        { id: 'nubank', name: 'Nubank', color: '#820ad1', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg' },
        { id: 'itau', name: 'Itaú', color: '#ec7000', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Ita%C3%fa_Unibanco_logo_%282023%29.svg' },
        { id: 'bradesco', name: 'Bradesco', color: '#cc092f', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Bradesco_logo.svg' },
        { id: 'inter', name: 'Inter', color: '#ff7a00', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Banco_Inter_logo.svg' },
        { id: 'btg', name: 'BTG Pactual', color: '#003665', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/BTG_Pactual_logo.svg' },
        { id: 'xp', name: 'XP', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/XP_Investimentos_logo.svg' },
        { id: 'other', name: 'Outro', color: '#333333', logo: null }
    ];

    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setStep('select-type');
    };

    const handleTypeSelect = (type) => {
        setImportType(type);
        if (type === 'CARD') setStep('upload-card');
        if (type === 'ACCOUNT') setStep('upload-account');
    };

    // Card Date Helpers
    const handleCardYearChange = (delta) => {
        setCardDate(prev => ({ ...prev, year: prev.year + delta }));
    };

    const handleCardMonthChange = (e) => {
        setCardDate(prev => ({ ...prev, month: parseInt(e.target.value) }));
    };

    // Account Year Helpers
    const handleAccountYearChange = (delta) => {
        setAccountYear(prev => prev + delta);
    };

    // File Handling
    const handleFileSelect = (e, monthIndex = null) => {
        const file = e.target.files[0];
        if (!file) return;

        if (importType === 'ACCOUNT') {
            setTargetMonthForUpload(monthIndex);
        }

        setCurrentFile(file);
        loadPreview(file, monthIndex); // Pass monthIndex for Account context
    };

    const loadPreview = async (file, monthOverride = null) => {
        setLoading(true);
        setError(null);
        setPreviewData(null);
        setStep('preview');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            try {
                const response = await importAPI.previewOFX(content);
                if (response.success) {
                    const data = response.data;

                    // Determine Reference Date based on context
                    let refMonth, refYear;

                    if (importType === 'CARD') {
                        refMonth = cardDate.month + 1; // API expects 1-12
                        refYear = cardDate.year;
                    } else if (importType === 'ACCOUNT' && monthOverride !== null) {
                        refMonth = monthOverride + 1; // API expects 1-12
                        refYear = accountYear;
                    } else {
                        // Fallback to auto-detect
                        // (Use existing logic or just default to now)
                        refMonth = new Date().getMonth() + 1;
                        refYear = new Date().getFullYear();
                    }

                    setPreviewData({
                        ...data,
                        fileName: file.name,
                        referenceMonth: refMonth,
                        referenceYear: refYear
                    });

                    // Initialize Card Form with detected data
                    if (data.bank) {
                        setCardForm(prev => ({
                            ...prev,
                            name: `Cartão ${data.bank.name || 'Importado'}`,
                            lastFourDigits: data.bank.accountNumber ? data.bank.accountNumber.slice(-4) : '0000',
                            color: selectedBank?.color || '#1a1a2e',
                            brand: 'MASTERCARD' // Could try to detect, but default is fine
                        }));
                    }
                } else {
                    setError(`Não foi possível ler ${file.name}`);
                }
            } catch (err) {
                console.error('Preview error:', err);
                setError(`Erro ao ler ${file.name}. Verifique o formato.`);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;
        setLoading(true);

        try {
            const response = await importAPI.confirmImport({
                data: previewData,
                type: importType === 'CARD' ? 'CREDIT_CARD' : (isInvestment ? 'INVESTMENT' : 'CHECKING'),
                referenceMonth: previewData.referenceMonth,
                referenceYear: previewData.referenceYear,
                dryRun: !!isSubComponent // If in wizard, just parse/validate, don't save to DB yet
            });

            // Mark as success
            if (importType === 'ACCOUNT' && targetMonthForUpload !== null) {
                const key = `${accountYear}-${targetMonthForUpload}`;
                setMonthlyStatus(prev => ({ ...prev, [key]: 'success' }));
                setStep('upload-account'); // Go back to grid
            } else {
                setStep('complete'); // Card flow ends or single import
            }

            // Notify parent
            if (onConfirmHelper) {
                // If it's a dry run (Wizard), we need to inject the user's custom form data
                // because the backend returned a generic virtual entity.
                if (isSubComponent && response && response.entity) {
                    // Start with the backend response
                    const enhancedResponse = { ...response };

                    // Override the entity details with our form state AND selected bank metadata
                    enhancedResponse.entity = {
                        ...enhancedResponse.entity,
                        // Inject Selected Bank Metadata (Icon/Color/Name) if not present or better
                        icon: selectedBank?.logo || null,
                        color: (cardForm.color !== '#1a1a2e' ? cardForm.color : null) || (selectedBank?.color || '#6366F1'),
                        bankName: selectedBank?.name || enhancedResponse.entity.bankName,
                        nickname: selectedBank?.name || enhancedResponse.entity.bankName,
                    };

                    if (importType === 'CARD') {
                        enhancedResponse.entity = {
                            ...enhancedResponse.entity,
                            name: cardForm.name,
                            lastFourDigits: cardForm.lastFourDigits,
                            closingDay: parseInt(cardForm.closingDay),
                            dueDay: parseInt(cardForm.dueDay),
                            brand: cardForm.brand,
                            creditLimit: parseFloat(cardForm.creditLimit || 0),
                            blockedLimit: parseFloat(cardForm.blockedLimit || 0),
                            availableLimit: parseFloat(cardForm.availableLimit || 0),
                            holderName: cardForm.holderName
                        };
                    }
                    onConfirmHelper(enhancedResponse);
                } else {
                    onConfirmHelper(response);
                }
            }

        } catch (err) {
            console.error('Import error:', err);
            setError('Falha na importação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // RENDER: Select Bank
    if (step === 'select-bank') {
        return (
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ flex: 1, textAlign: 'center' }}>Qual é o seu banco?</h3>
                    {isSubComponent && <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><FiX size={20} /></button>}
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {BANKS.map(bank => (
                        <button key={bank.id} onClick={() => handleBankSelect(bank)} style={{
                            background: '#222', border: '1px solid #333', borderRadius: '12px', padding: '1rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', background: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                padding: '4px'
                            }}>
                                {bank.logo ?
                                    <img src={bank.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <FiUpload color="#000" size={20} />
                                }
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#fff' }}>{bank.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // RENDER: Select Import Type
    if (step === 'select-type') {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1rem' }}>
                    {selectedBank?.logo && <img src={selectedBank.logo} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    <h3>O que você quer importar?</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => handleTypeSelect('ACCOUNT')}
                        style={{
                            background: '#2a2a2a', border: '1px solid #444', borderRadius: '12px', padding: '1.5rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer'
                        }}
                    >
                        <FiFileText size={32} color="#6366F1" />
                        <div>
                            <strong style={{ display: 'block', color: '#fff' }}>Extrato Bancário</strong>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Conta corrente, poupança</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleTypeSelect('CARD')}
                        style={{
                            background: '#2a2a2a', border: '1px solid #444', borderRadius: '12px', padding: '1.5rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer'
                        }}
                    >
                        <FiCreditCard size={32} color="#10B981" />
                        <div>
                            <strong style={{ display: 'block', color: '#fff' }}>Fatura do Cartão</strong>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Cartão de crédito</span>
                        </div>
                    </button>
                </div>

                <Button variant="secondary" onClick={() => setStep('select-bank')}>Voltar</Button>
            </div>
        );
    }

    // RENDER: Upload Card (Month/Year Selection)
    if (step === 'upload-card') {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                <h3>Importar Fatura</h3>
                <p style={{ color: '#888', marginBottom: '1.5rem' }}>Selecione o mês da fatura</p>

                {/* Month/Year Picker */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', background: '#222', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleCardYearChange(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiChevronLeft /></button>
                        <span style={{ fontWeight: 'bold' }}>{cardDate.year}</span>
                        <button onClick={() => handleCardYearChange(1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiChevronRight /></button>
                    </div>
                    <select
                        value={cardDate.month}
                        onChange={handleCardMonthChange}
                        style={{ background: '#333', border: '1px solid #444', color: '#fff', padding: '0.5rem', borderRadius: '4px' }}
                    >
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>

                <div style={{
                    border: '2px dashed #444', borderRadius: '12px', padding: '2rem',
                    cursor: 'pointer', position: 'relative'
                }}>
                    <input
                        type="file"
                        id="card-upload"
                        accept=".ofx,.csv"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="card-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <FiUpload size={32} color="#666" style={{ marginBottom: '1rem' }} />
                        <div style={{ fontWeight: 600, color: '#fff' }}>Upload da Fatura de {MONTHS[cardDate.month]}</div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Suporta .OFX e .CSV</div>
                    </label>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <button onClick={() => setStep('select-type')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>Voltar</button>
                </div>
            </div>
        );
    }

    // RENDER: Upload Account (Monthly Grid)
    if (step === 'upload-account') {
        const currentYear = new Date().getFullYear();
        return (
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Extrato da Conta</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>
                        <button onClick={() => handleAccountYearChange(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiChevronLeft /></button>
                        <span>{accountYear}</span>
                        <button onClick={() => handleAccountYearChange(1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiChevronRight /></button>
                    </div>
                </div>

                <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Selecione o mês para importar o extrato
                </p>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem',
                    marginBottom: '2rem'
                }}>
                    {MONTHS.map((monthName, idx) => {
                        const statusKey = `${accountYear}-${idx}`;
                        const isDone = monthlyStatus[statusKey] === 'success';

                        return (
                            <div key={idx} style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    id={`account-upload-${idx}`}
                                    accept=".ofx,.csv"
                                    onChange={(e) => handleFileSelect(e, idx)}
                                    style={{ display: 'none' }}
                                    disabled={loading}
                                />
                                <label
                                    htmlFor={`account-upload-${idx}`}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        padding: '1rem 0.5rem', borderRadius: '8px',
                                        background: isDone ? 'rgba(16, 185, 129, 0.1)' : '#222',
                                        border: isDone ? '1px solid #10B981' : '1px solid #333',
                                        cursor: 'pointer', opacity: loading ? 0.5 : 1
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: isDone ? '#10B981' : '#fff' }}>{monthName}</span>
                                    {isDone ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#10B981', marginTop: '4px' }}>
                                            <FiCheckCircle /> OK
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                                            Importar
                                        </div>
                                    )}
                                </label>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <Button
                        onClick={() => {
                            setImportType(null);
                            setStep('select-type');
                        }}
                        disabled={loading}
                        style={{ background: '#2a2a2a', border: '1px solid #444' }}
                    >
                        <FiCreditCard style={{ marginRight: '8px' }} />
                        Importar Cartão / Outro Tipo
                    </Button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="secondary" onClick={() => setStep('select-bank')} disabled={loading} style={{ flex: 1 }}>
                            Trocar Banco
                        </Button>
                        <Button variant="primary" onClick={onSkip} disabled={loading} style={{ flex: 1, background: '#10B981' }}>
                            <FiCheckCircle style={{ marginRight: '8px' }} />
                            Concluir
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: Preview
    if (step === 'preview') {
        // Calculate Totals
        const transactions = previewData?.transactions || [];
        const totalCredits = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        const totalDebits = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);
        const monthName = MONTHS[(previewData?.referenceMonth || 1) - 1];

        return (
            <div style={{ padding: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3>Confirmar do {importType === 'CARD' ? 'Fatura' : 'Extrato'}</h3>
                    <p style={{ color: '#888' }}>
                        Referência: <strong style={{ color: '#fff' }}>{monthName} de {previewData?.referenceYear}</strong>
                    </p>
                </div>

                <div style={{ background: '#222', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #333' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%', background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px'
                        }}>
                            {selectedBank?.logo ?
                                <img src={selectedBank.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                : <FiFileText color="#333" size={24} />
                            }
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{previewData?.bank?.name}</div>
                            <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                {previewData?.bank?.accountNumber} • {importType === 'CARD' ? 'Cartão de Crédito' : 'Conta Corrente'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#10B981', marginBottom: '4px' }}>Entradas</span>
                            <strong style={{ fontSize: '1.1rem', color: '#10B981', display: 'block' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCredits)}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#10B981', opacity: 0.8 }}>
                                {transactions.filter(t => t.amount > 0).length} lançamentos
                            </span>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#ef4444', marginBottom: '4px' }}>Saídas</span>
                            <strong style={{ fontSize: '1.1rem', color: '#ef4444', display: 'block' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebits)}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#ef4444', opacity: 0.8 }}>
                                {transactions.filter(t => t.amount < 0).length} lançamentos
                            </span>
                        </div>
                    </div>

                    {/* Type Override Only For Account Mode (Investments) */}
                    {importType === 'ACCOUNT' && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1rem', borderTop: '1px solid #333' }}>
                            <input
                                type="checkbox"
                                checked={isInvestment}
                                onChange={e => setIsInvestment(e.target.checked)}
                                id="invest-check"
                                style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#6366F1' }}
                            />
                            <label htmlFor="invest-check" style={{ color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Marcar como conta de <strong>Investimentos</strong>
                            </label>
                        </div>
                    )}

                    {/* Card Customization Form (Only for Card Import) */}
                    {importType === 'CARD' && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#fff' }}>Detalhes do Cartão</h4>

                            {/* Live Preview */}
                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: '100%', maxWidth: '340px' }}>
                                    <CreditCard
                                        name={cardForm.name || 'Cartão Importado'}
                                        number={`•••• •••• •••• ${cardForm.lastFourDigits || '0000'}`}
                                        expiry="MM/YY"
                                        cvc="•••"
                                        brand={cardForm.brand}
                                        color={cardForm.color}
                                        style={{ width: '100%', height: 'auto', aspectRatio: '1.586' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <Input
                                    label="Nome do Cartão"
                                    value={cardForm.name}
                                    onChange={e => setCardForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Nubank Platinum"
                                    fullWidth
                                />
                                <Input
                                    label="Nome do Titular"
                                    value={cardForm.holderName}
                                    onChange={e => setCardForm(prev => ({ ...prev, holderName: e.target.value }))}
                                    placeholder="Como aparece no cartão"
                                    fullWidth
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input
                                        label="Últimos 4 dígitos"
                                        value={cardForm.lastFourDigits}
                                        onChange={e => setCardForm(prev => ({ ...prev, lastFourDigits: e.target.value.slice(0, 4) }))}
                                        placeholder="0000"
                                        maxLength={4}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.9rem', color: '#888' }}>Cor</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {cardColors.slice(0, 5).map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setCardForm(prev => ({ ...prev, color: c.value }))}
                                                    style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: c.value,
                                                        border: cardForm.color === c.value ? '2px solid #fff' : '2px solid transparent',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            ))}
                                            <button
                                                onClick={() => {
                                                    // Cycle through colors or open modal? 
                                                    // Simple version: Pick random from rest
                                                    const random = cardColors[Math.floor(Math.random() * cardColors.length)].value;
                                                    setCardForm(prev => ({ ...prev, color: random }));
                                                }}
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#333', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input
                                        label="Dia Fechamento"
                                        type="number"
                                        value={cardForm.closingDay}
                                        onChange={e => setCardForm(prev => ({ ...prev, closingDay: e.target.value }))}
                                        min={1} max={31}
                                    />
                                    <Input
                                        label="Dia Vencimento"
                                        type="number"
                                        value={cardForm.dueDay}
                                        onChange={e => setCardForm(prev => ({ ...prev, dueDay: e.target.value }))}
                                        min={1} max={31}
                                    />
                                </div>
                            </div>

                            {/* Additional Card Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#fff' }}>Bandeira</label>
                                    <select
                                        value={cardForm.brand}
                                        onChange={e => setCardForm(prev => ({ ...prev, brand: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff' }}
                                    >
                                        <option value="MASTERCARD">Mastercard</option>
                                        <option value="VISA">Visa</option>
                                        <option value="ELO">Elo</option>
                                        <option value="AMEX">American Express</option>
                                        <option value="HIPERCARD">Hipercard</option>
                                        <option value="OTHER">Outra</option>
                                    </select>
                                </div>
                                <Input
                                    label="Limite Total (R$)"
                                    value={cardForm.creditLimit}
                                    onChange={e => setCardForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                                    placeholder="0,00"
                                    type="number"
                                />
                            </div>

                                    type="number"
                                />
                            </div>

                            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Limite Disponível (R$)"
                                    value={cardForm.availableLimit}
                                    onChange={e => setCardForm(prev => ({ ...prev, availableLimit: e.target.value }))}
                                    placeholder="0,00"
                                    type="number"
                                />
                                <div>
                                    <Input
                                        label="Limite Bloqueado (R$)"
                                        value={cardForm.blockedLimit}
                                        onChange={e => setCardForm(prev => ({ ...prev, blockedLimit: e.target.value }))}
                                        placeholder="0,00 (Opcional)"
                                        type="number"
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px', display: 'block' }}>
                                        Opcional: Valor travado no app.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
            </div>

                { error && <div style={{ color: '#f87171', marginBottom: '1rem', textAlign: 'center' }}>{error}</div> }

                <Button onClick={handleConfirmImport} disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                    {loading ? 'Processando...' : 'Confirmar Importação'}
                </Button>

                <Button variant="secondary" onClick={() => setStep(importType === 'CARD' ? 'upload-card' : 'upload-account')} disabled={loading} style={{ width: '100%' }}>
                    Cancelar
                </Button>
            </div >
        );
    }

    // RENDER: Complete (Final success screen)
    if (step === 'complete') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <FiCheckCircle size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
                <h3>Importação Concluída!</h3>
                <p style={{ color: '#888', marginBottom: '2rem' }}>
                    {importType === 'CARD' ? 'Fatura importada com sucesso.' : 'Extrato bancário importado com sucesso.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button onClick={() => {
                        // Reset to Select Type to allow importing the other item (Card <-> Account)
                        setStep('select-type');
                        setPreviewData(null);
                        setCardForm(prev => ({ ...prev, name: '', lastFourDigits: '' }));
                        // Keep selectedBank!
                    }}>Importar Outro Item (Cartão/Extrato)</Button>

                    <Button variant="secondary" onClick={onSkip}>Concluir e Fechar</Button>
                </div>
            </div>
        );
    }

    return null;
}
