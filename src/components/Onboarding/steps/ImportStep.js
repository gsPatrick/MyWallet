import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiCheck, FiAlertCircle, FiFileText, FiDatabase } from 'react-icons/fi';
import Button from '@/components/ui/Button'; // Adjust path if needed
import { importAPI } from '@/services/api';

export default function ImportStep({ onNext, onSkip, onConfirmHelper, isSubComponent }) {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInvestment, setIsInvestment] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            handlePreview(selectedFile);
        }
    };

    const handlePreview = async (selectedFile) => {
        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target.result;
            try {
                const response = await importAPI.previewOFX(content);
                if (response.success) {
                    setPreviewData(response.data);
                } else {
                    setError('Não foi possível ler o arquivo.');
                }
            } catch (err) {
                console.error('Preview error:', err);
                setError('Erro ao processar arquivo. Verifique se é um OFX ou CSV válido.');
            } finally {
                setLoading(false);
            }
        };

        reader.readAsText(selectedFile);
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;
        setLoading(true);
        try {
            // Pass type='INVESTMENT' if toggle is on
            const dataToImport = { ...previewData }; // Clone
            // The API expects `type` in options, probably need to adjust `confirmImport` call or backend
            // In `importAPI.confirmImport(data)`, data is passed as body { data }.
            // The controller calls service.processImport(userId, data, { ... }).
            // But we need to pass `type`. 
            // Let's modify the `data` object sent to include `importOptions`.

            const payload = {
                ...previewData,
                importOptions: {
                    type: isInvestment ? 'INVESTMENT' : 'CHECKING'
                }
            };

            // Wait, importAPI.confirmImport(data) sends { data }. 
            // We should just ensure backend reads it or we update `api.js` to send extra params.
            // Let's assume we can modify `api.js` or pack it into `data`.
            // Let's modify api.js first or better yet, assume we pass it inside data for now if controller supports it.
            // Looking at controller: `const { data } = req.body;` -> `processImport(userId, data, { profileId })`.
            // Controller doesn't read `type` from body currently. 
            // I should have updated controller to read `type` from body or `options`. 
            // I'll update the controller in a bit. For now let's send it in payload.

            // Actually, let's call a modified version of confirmImport that accepts options?
            // "api.js": confirmImport: (data) => api.post('/import/ofx/confirm', { data })
            // So we send { data: { ...previewData, type: ... } }
            // Controller reads `data`. 
            // Service reads `data`. 

            // OK, I'll update the controller next to read `type` from the request body alongside `data`.
            const response = await importAPI.confirmImport({
                ...previewData,
                type: isInvestment ? 'INVESTMENT' : 'CHECKING'
            });

            if (onConfirmHelper) {
                onConfirmHelper(response);
            } else {
                onNext();
            }
        } catch (err) {
            console.error('Import error:', err);
            setError('Falha ao importar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="import-step-container" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>
                    Agilize seu cadastro
                </h2>
                <p style={{ color: '#ccc', marginBottom: '2rem' }}>
                    Importe seu extrato bancário (OFX) para preencher sua conta automaticamente.
                </p>

                {/* Upload Area */}
                {!previewData && (
                    <div style={{
                        border: '2px dashed #444',
                        borderRadius: '12px',
                        padding: '3rem',
                        marginBottom: '2rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                        position: 'relative'
                    }}>
                        <input
                            type="file"
                            id="file-upload"
                            accept=".ofx,.csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            cursor: 'pointer', padding: '2rem'
                        }}>
                            <FiUpload size={48} color="#666" style={{ marginBottom: '1rem' }} />
                            <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>
                                Clique para enviar
                            </span>
                            <span style={{ color: '#888', marginTop: '0.5rem' }}>
                                Suporta arquivos .OFX e .CSV
                            </span>
                        </label>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{ marginBottom: '2rem', color: '#888' }}>
                        Processando arquivo...
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        background: '#3f1515', border: '1px solid #7f1d1d',
                        borderRadius: '8px', padding: '1rem', marginBottom: '2rem',
                        display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5'
                    }}>
                        <FiAlertCircle />
                        <span>{error}</span>
                    </div>
                )}

                {/* Preview State */}
                {previewData && !loading && (
                    <div style={{
                        background: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                background: '#059669', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FiCheck size={20} color="#fff" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Arquivo identificado!</h3>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.875rem' }}>Confira os dados encontrados:</p>
                            </div>
                        </div>

                        <div style={{ background: '#262626', borderRadius: '8px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#888' }}>Banco:</span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>{previewData.bank?.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#888' }}>Conta:</span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>{previewData.bank?.accountNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888' }}>Transações:</span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>{previewData.totalTransactions} itens</span>
                            </div>
                        </div>

                        {/* Investment Toggle */}
                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#333', padding: '10px', borderRadius: '8px' }}>
                            <input
                                type="checkbox"
                                id="isInvestment"
                                checked={isInvestment}
                                onChange={(e) => setIsInvestment(e.target.checked)}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                            <label htmlFor="isInvestment" style={{ color: '#fff', cursor: 'pointer', flex: 1 }}>
                                Esta é uma <strong>Conta de Investimentos</strong> (Corretora)
                                <span style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>
                                    Saldo será identificado como custódia/caixa.
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    {previewData ? (
                        <Button size="lg" onClick={handleConfirmImport} disabled={loading}>
                            {loading ? 'Importando...' : 'Confirmar e Adicionar'}
                        </Button>
                    ) : (
                        !isSubComponent && (
                            <Button size="lg" variant="secondary" onClick={onSkip} disabled={loading}>
                                Pular esta etapa
                            </Button>
                        )
                    )}

                    {previewData && (
                        <Button variant="ghost" onClick={() => { setPreviewData(null); setFile(null); }} disabled={loading}>
                            Selecionar outro arquivo
                        </Button>
                    )}
                </div>

            </motion.div>
        </div>
    );
}
