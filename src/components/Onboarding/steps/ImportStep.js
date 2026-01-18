import React, { useState } from 'react';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { importAPI } from '@/services/api';

export default function ImportStep({ onNext, onSkip, onConfirmHelper, isSubComponent }) {
    const [step, setStep] = useState('select-bank'); // 'select-bank', 'upload', 'preview-queue', 'complete'
    const [selectedBank, setSelectedBank] = useState(null);
    const [filesQueue, setFilesQueue] = useState([]); // Array of { file, id, status, result, error }
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInvestment, setIsInvestment] = useState(false);

    // Mock Banks List
    const BANKS = [
        { id: 'nubank', name: 'Nubank', color: '#820ad1', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg' },
        { id: 'itau', name: 'Itaú', color: '#ec7000', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Ita%C3%fa_Unibanco_logo_%282023%29.svg' },
        { id: 'bradesco', name: 'Bradesco', color: '#cc092f', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Bradesco_logo.svg' },
        { id: 'inter', name: 'Inter', color: '#ff7a00', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Banco_Inter_logo.svg' },
        { id: 'btg', name: 'BTG Pactual', color: '#003665', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/BTG_Pactual_logo.svg' },
        { id: 'xp', name: 'XP', color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/XP_Investimentos_logo.svg' },
        { id: 'other', name: 'Outro', color: '#333333', logo: null }
    ];

    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setStep('upload');
    };

    // Handle initial file selection (multiple)
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const queue = files.map((f, i) => ({
                id: i,
                file: f,
                status: 'pending' // pending, processing, success, error
            }));
            setFilesQueue(queue);
            setCurrentFileIndex(0);
            setStep('preview-queue');
            // Start first
            loadPreview(queue[0].file);
        }
    };

    const loadPreview = async (file) => {
        setLoading(true);
        setError(null);
        setPreviewData(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            try {
                const response = await importAPI.previewOFX(content);
                if (response.success) {
                    const data = response.data;

                    // Auto-detect Reference Date (Mode: Most frequent month in transactions)
                    let refMonth = new Date().getMonth();
                    let refYear = new Date().getFullYear();

                    if (data.transactions && data.transactions.length > 0) {
                        const monthCounts = {};
                        data.transactions.forEach(t => {
                            const d = new Date(t.date);
                            const key = `${d.getFullYear()}-${d.getMonth()}`;
                            monthCounts[key] = (monthCounts[key] || 0) + 1;
                        });

                        // Find max
                        const bestKey = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b);
                        if (bestKey) {
                            const [y, m] = bestKey.split('-');
                            refYear = parseInt(y);
                            refMonth = parseInt(m);
                        }
                    }

                    setPreviewData({
                        ...data,
                        fileName: file.name,
                        referenceMonth: refMonth,
                        referenceYear: refYear
                    });
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
                ...previewData,
                type: isInvestment ? 'INVESTMENT' : 'CHECKING',
                referenceMonth: previewData.referenceMonth,
                referenceYear: previewData.referenceYear
            });

            // Update queue item
            const newQueue = [...filesQueue];
            newQueue[currentFileIndex].status = 'success';
            newQueue[currentFileIndex].result = response;
            setFilesQueue(newQueue);

            // Notify parent
            if (onConfirmHelper) {
                onConfirmHelper(response);
            }

            // Move next
            if (currentFileIndex < filesQueue.length - 1) {
                const next = currentFileIndex + 1;
                setCurrentFileIndex(next);
                loadPreview(newQueue[next].file);
            } else {
                setStep('complete');
            }

        } catch (err) {
            console.error('Import error:', err);
            setError('Falha na importação. Tente novamente.');
            // Mark as error
            const newQueue = [...filesQueue];
            newQueue[currentFileIndex].status = 'error';
            setFilesQueue(newQueue);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipFile = () => {
        // Mark as skipped? Or just remove?
        // Let's just move next
        if (currentFileIndex < filesQueue.length - 1) {
            const next = currentFileIndex + 1;
            setCurrentFileIndex(next);
            loadPreview(filesQueue[next].file);
        } else {
            // If all skipped/done
            setStep('complete');
        }
    };

    // RENDER: Select Bank
    if (step === 'select-bank') {
        return (
            <div style={{ padding: '1rem' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Qual é o seu banco?</h3>
                <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem' }}>
                    Escolha o banco para importar os arquivos
                </p>
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
                {!isSubComponent && <Button variant="secondary" onClick={onSkip} style={{ width: '100%' }}>Pular Importação</Button>}

                {isSubComponent && (
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // RENDER: Upload
    if (step === 'upload') {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1rem' }}>
                    {selectedBank?.logo && <img src={selectedBank.logo} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    <h3>Importar de {selectedBank?.name}</h3>
                </div>
                <p style={{ color: '#888', marginBottom: '2rem' }}>
                    Selecione suas faturas fechadas (CSV) e extratos da conta (OFX/CSV).<br />
                    <small>Você pode selecionar vários arquivos de uma vez.</small>
                </p>

                <div style={{
                    border: '2px dashed #444', borderRadius: '12px', padding: '3rem',
                    cursor: 'pointer', position: 'relative'
                }}>
                    <input
                        type="file"
                        id="multi-upload"
                        accept=".ofx,.csv"
                        multiple // ENABLE MULTI
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="multi-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <FiUpload size={48} color="#666" style={{ marginBottom: '1rem' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Clique para selecionar arquivos
                        </div>
                        <div style={{ color: '#666' }}>Suporta .OFX e .CSV</div>
                    </label>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <button onClick={() => setStep('select-bank')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // RENDER: Preview Queue
    if (step === 'preview-queue') {
        const file = filesQueue[currentFileIndex]?.file;
        return (
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}>
                    <span>Arquivo {currentFileIndex + 1} de {filesQueue.length}</span>
                    <span>{file?.name}</span>
                </div>

                {loading && !previewData && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Lendo arquivo...</div>
                )}

                {error && (
                    <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <FiAlertCircle style={{ marginRight: '8px' }} />
                        {error}
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <Button size="sm" onClick={() => loadPreview(file)}>Tentar de novo</Button>
                            <Button size="sm" variant="secondary" onClick={handleSkipFile}>Pular arquivo</Button>
                        </div>
                    </div>
                )}

                {previewData && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <div style={{ background: '#222', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#888' }}>Origem:</span>
                                <span style={{ color: '#fff' }}>{previewData.bankName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#888' }}>Conta:</span>
                                <span style={{ color: '#fff' }}>{previewData.accountNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#888' }}>Tipo Detectado:</span>
                                <span style={{ color: previewData.accountType === 'CREDIT_CARD' ? '#C084FC' : '#fff' }}>
                                    {previewData.accountType === 'CREDIT_CARD' ? 'Fatura Cartão' : 'Conta Corrente'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888' }}>Transações:</span>
                                <span style={{ color: '#fff' }}>{previewData.totalTransactions}</span>
                            </div>
                        </div>

                        {/* Force Type Toggle for Investments */}
                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#333', padding: '10px', borderRadius: '8px' }}>
                            <input
                                type="checkbox"
                                id="isInvestment"
                                checked={isInvestment}
                                onChange={(e) => setIsInvestment(e.target.checked)}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                            <label htmlFor="isInvestment" style={{ color: '#fff', cursor: 'pointer', flex: 1 }}>
                                É Conta de <strong>Investimentos</strong>?
                            </label>
                        </div>

                        <Button onClick={handleConfirmImport} disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                            {loading ? 'Processando...' : `Confirmar e Importar (${filesQueue.length - currentFileIndex} restam)`}
                        </Button>

                        <button onClick={handleSkipFile} style={{ width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                            Pular este arquivo
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // RENDER: Complete
    if (step === 'complete') {
        const successCount = filesQueue.filter(f => f.status === 'success').length;
        const errorCount = filesQueue.filter(f => f.status === 'error').length;

        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <FiCheckCircle size={48} color="#059669" style={{ marginBottom: '1rem' }} />
                <h3>Processamento Finalizado!</h3>
                <p style={{ color: '#888', marginBottom: '2rem' }}>
                    {successCount} arquivo(s) importado(s) com sucesso.<br />
                    {errorCount > 0 && <span style={{ color: '#f87171' }}>{errorCount} erro(s).</span>}
                </p>
                <Button onClick={onSkip}>Voltar para Lista</Button>
            </div>
        );
    }

    return null;
}
