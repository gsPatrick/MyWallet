'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Button from '@/components/ui/Button';
import { reportsAPI } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import styles from './page.module.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Mock data com múltiplas transações por dia (5+ por dia)
const MOCK_DATA = {
    summary: {
        openingBalance: 12450.00,
        totalIncome: 12800.00,
        totalExpense: 8234.50,
        closingBalance: 17015.50
    },
    transactions: [
        // === DIA 1 - Dia do Salário ===
        { id: 1, date: '2024-12-01', description: 'Salário - Empresa TechCorp', type: 'INCOME', amount: 8500.00, time: '06:00' },
        { id: 2, date: '2024-12-01', description: 'Bônus Performance Q4', type: 'INCOME', amount: 2000.00, time: '06:01' },
        { id: 3, date: '2024-12-01', description: 'Café - Starbucks', type: 'EXPENSE', amount: 28.90, time: '08:15' },
        { id: 4, date: '2024-12-01', description: 'Uber - Casa → Trabalho', type: 'EXPENSE', amount: 34.50, time: '08:45' },
        { id: 5, date: '2024-12-01', description: 'Almoço - Restaurante Executivo', type: 'EXPENSE', amount: 65.00, time: '12:30' },
        { id: 6, date: '2024-12-01', description: 'Uber - Trabalho → Casa', type: 'EXPENSE', amount: 38.20, time: '18:30' },
        { id: 7, date: '2024-12-01', description: 'iFood - Jantar Japonês', type: 'EXPENSE', amount: 89.90, time: '20:45' },

        // === DIA 2 - Contas Fixas ===
        { id: 8, date: '2024-12-02', description: 'Aluguel - Apartamento', type: 'EXPENSE', amount: 2200.00, time: '08:00' },
        { id: 9, date: '2024-12-02', description: 'Condomínio', type: 'EXPENSE', amount: 580.00, time: '08:01' },
        { id: 10, date: '2024-12-02', description: 'IPTU - Parcela 12/12', type: 'EXPENSE', amount: 185.00, time: '08:02' },
        { id: 11, date: '2024-12-02', description: 'Seguro Residencial', type: 'EXPENSE', amount: 95.00, time: '08:03' },
        { id: 12, date: '2024-12-02', description: 'Café da Manhã - Padaria', type: 'EXPENSE', amount: 22.50, time: '09:00' },
        { id: 13, date: '2024-12-02', description: 'Mercado - Compras Semana', type: 'EXPENSE', amount: 487.30, time: '19:00' },

        // === DIA 5 - Assinaturas ===
        { id: 14, date: '2024-12-05', description: 'Netflix - Assinatura Mensal', type: 'EXPENSE', amount: 55.90, time: '00:00' },
        { id: 15, date: '2024-12-05', description: 'Spotify Premium - Família', type: 'EXPENSE', amount: 34.90, time: '00:00' },
        { id: 16, date: '2024-12-05', description: 'Amazon Prime', type: 'EXPENSE', amount: 14.90, time: '00:00' },
        { id: 17, date: '2024-12-05', description: 'HBO Max', type: 'EXPENSE', amount: 34.90, time: '00:00' },
        { id: 18, date: '2024-12-05', description: 'Disney+', type: 'EXPENSE', amount: 33.90, time: '00:00' },
        { id: 19, date: '2024-12-05', description: 'iCloud 200GB', type: 'EXPENSE', amount: 10.90, time: '00:00' },
        { id: 20, date: '2024-12-05', description: 'ChatGPT Plus', type: 'EXPENSE', amount: 100.00, time: '00:00' },

        // === DIA 7 - Contas de Consumo ===
        { id: 21, date: '2024-12-07', description: 'Conta de Luz - Enel', type: 'EXPENSE', amount: 245.80, time: '09:00' },
        { id: 22, date: '2024-12-07', description: 'Conta de Água - Sabesp', type: 'EXPENSE', amount: 98.50, time: '09:01' },
        { id: 23, date: '2024-12-07', description: 'Gás Natural - Comgás', type: 'EXPENSE', amount: 67.30, time: '09:02' },
        { id: 24, date: '2024-12-07', description: 'Internet Fibra - Vivo', type: 'EXPENSE', amount: 149.90, time: '09:03' },
        { id: 25, date: '2024-12-07', description: 'Celular - Tim', type: 'EXPENSE', amount: 79.90, time: '09:04' },

        // === DIA 10 - Receita Extra ===
        { id: 26, date: '2024-12-10', description: 'PIX Recebido - Freelance Web', type: 'INCOME', amount: 1500.00, time: '14:30' },
        { id: 27, date: '2024-12-10', description: 'PIX Recebido - Consultoria', type: 'INCOME', amount: 800.00, time: '15:45' },
        { id: 28, date: '2024-12-10', description: 'Uber - Reunião Cliente', type: 'EXPENSE', amount: 42.00, time: '10:00' },
        { id: 29, date: '2024-12-10', description: 'Almoço Business - Restaurante', type: 'EXPENSE', amount: 156.00, time: '13:00' },
        { id: 30, date: '2024-12-10', description: 'Uber - Volta Cliente', type: 'EXPENSE', amount: 38.00, time: '16:30' },

        // === DIA 12 - Compras ===
        { id: 31, date: '2024-12-12', description: 'Gasolina - Posto Shell', type: 'EXPENSE', amount: 320.00, time: '08:30' },
        { id: 32, date: '2024-12-12', description: 'Lavagem Carro', type: 'EXPENSE', amount: 45.00, time: '09:00' },
        { id: 33, date: '2024-12-12', description: 'Estacionamento Shopping', type: 'EXPENSE', amount: 18.00, time: '14:00' },
        { id: 34, date: '2024-12-12', description: 'Renner - Roupas', type: 'EXPENSE', amount: 289.90, time: '15:30' },
        { id: 35, date: '2024-12-12', description: 'Farmácia - Medicamentos', type: 'EXPENSE', amount: 127.50, time: '16:45' },
        { id: 36, date: '2024-12-12', description: 'Café com Amigos', type: 'EXPENSE', amount: 48.00, time: '17:30' },

        // === DIA 15 - Saúde e Educação ===
        { id: 37, date: '2024-12-15', description: 'Plano de Saúde - Unimed', type: 'EXPENSE', amount: 890.00, time: '00:00' },
        { id: 38, date: '2024-12-15', description: 'Academia - Smart Fit', type: 'EXPENSE', amount: 119.90, time: '00:00' },
        { id: 39, date: '2024-12-15', description: 'Curso Online - Alura', type: 'EXPENSE', amount: 99.00, time: '00:00' },
        { id: 40, date: '2024-12-15', description: 'Dentista - Consulta', type: 'EXPENSE', amount: 200.00, time: '10:00' },
        { id: 41, date: '2024-12-15', description: 'Livraria - Livros Técnicos', type: 'EXPENSE', amount: 156.80, time: '15:00' },

        // === DIA 20 - Lazer ===
        { id: 42, date: '2024-12-20', description: 'Cinema - Ingressos (2)', type: 'EXPENSE', amount: 96.00, time: '19:00' },
        { id: 43, date: '2024-12-20', description: 'Pipoca + Bebidas', type: 'EXPENSE', amount: 68.00, time: '19:15' },
        { id: 44, date: '2024-12-20', description: 'Jantar Romântico', type: 'EXPENSE', amount: 280.00, time: '21:30' },
        { id: 45, date: '2024-12-20', description: 'Uber - Cinema', type: 'EXPENSE', amount: 35.00, time: '18:30' },
        { id: 46, date: '2024-12-20', description: 'Uber - Volta', type: 'EXPENSE', amount: 42.00, time: '23:00' },
    ]
};

export default function StatementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [statement, setStatement] = useState(null);

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    useEffect(() => {
        loadStatement();
    }, [selectedYear, selectedMonth]);

    const loadStatement = async () => {
        setLoading(true);
        try {
            const { data } = await reportsAPI.getStatement(selectedYear, selectedMonth);
            setStatement(data.data || { summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 }, transactions: [] });
        } catch (error) {
            console.error('Erro ao carregar extrato:', error);
            setStatement({ summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 }, transactions: [] });
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(y => y - 1);
            } else {
                setSelectedMonth(m => m - 1);
            }
        } else {
            if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(y => y + 1);
            } else {
                setSelectedMonth(m => m + 1);
            }
        }
    };

    // Agrupa por data
    const groupedByDate = statement?.transactions?.reduce((acc, t) => {
        const key = t.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {}) || {};

    // Calcula o total do dia
    const getDayTotal = (transactions) => {
        return transactions.reduce((sum, t) => {
            return sum + (t.type === 'INCOME' ? t.amount : -t.amount);
        }, 0);
    };

    const exportToPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Extrato Financeiro', 20, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${MONTHS[selectedMonth - 1]} de ${selectedYear}`, 20, 28);

        let y = 45;
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Saldo Anterior: ${formatCurrency(statement?.summary?.openingBalance || 0)}`, 20, y);
        y += 8;
        doc.text(`Entradas: +${formatCurrency(statement?.summary?.totalIncome || 0)}`, 20, y);
        y += 8;
        doc.text(`Saídas: -${formatCurrency(statement?.summary?.totalExpense || 0)}`, 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.text(`Saldo Final: ${formatCurrency(statement?.summary?.closingBalance || 0)}`, 20, y);

        y += 20;

        Object.entries(groupedByDate).forEach(([date, items]) => {
            if (y > 265) { doc.addPage(); y = 20; }

            const dateObj = new Date(date + 'T12:00:00');
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }), 20, y);
            y += 8;

            items.forEach(t => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setFontSize(9);
                doc.setTextColor(60);
                const time = t.time || '';
                doc.text(`${time}`, 20, y);
                doc.text(t.description.substring(0, 45), 35, y);
                doc.setTextColor(t.type === 'INCOME' ? 34 : 200, t.type === 'INCOME' ? 197 : 80, t.type === 'INCOME' ? 94 : 80);
                doc.text(`${t.type === 'INCOME' ? '+' : '-'}${formatCurrency(t.amount)}`, 155, y);
                y += 6;
            });
            y += 6;
        });

        doc.save(`extrato_${selectedYear}_${selectedMonth}.pdf`);
    };

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Back */}
                    <button className={styles.back} onClick={() => router.push('/settings')}>
                        <FiArrowLeft /> Voltar para Configurações
                    </button>

                    {/* Header */}
                    <div className={styles.header}>
                        <div>
                            <h1>Extrato Financeiro</h1>
                            <p className={styles.subtitle}>Movimentações detalhadas da sua conta</p>
                        </div>
                        <Button variant="secondary" leftIcon={<FiDownload />} onClick={exportToPDF}>
                            Exportar PDF
                        </Button>
                    </div>

                    {/* Month Navigator */}
                    <div className={styles.monthNav}>
                        <button onClick={() => navigateMonth('prev')} aria-label="Mês anterior">
                            <FiChevronLeft />
                        </button>
                        <div className={styles.monthDisplay}>
                            <span className={styles.monthName}>{MONTHS[selectedMonth - 1]}</span>
                            <span className={styles.yearName}>{selectedYear}</span>
                        </div>
                        <button onClick={() => navigateMonth('next')} aria-label="Próximo mês">
                            <FiChevronRight />
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className={styles.summary}>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Saldo Anterior</span>
                                <span className={styles.value}>{formatCurrency(statement?.summary?.openingBalance || 0)}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Total de Entradas</span>
                                <span className={`${styles.value} ${styles.credit}`}>+{formatCurrency(statement?.summary?.totalIncome || 0)}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Total de Saídas</span>
                                <span className={`${styles.value} ${styles.debit}`}>-{formatCurrency(statement?.summary?.totalExpense || 0)}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>Saldo Final</span>
                                <span className={`${styles.value} ${styles.highlight}`}>{formatCurrency(statement?.summary?.closingBalance || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className={styles.transactionsList}>
                        <h2 className={styles.sectionTitle}>Movimentações</h2>

                        {loading ? (
                            <div className={styles.loading}>Carregando extrato...</div>
                        ) : Object.keys(groupedByDate).length > 0 ? (
                            Object.entries(groupedByDate).map(([date, items]) => {
                                const dateObj = new Date(date + 'T12:00:00');
                                const dayTotal = getDayTotal(items);

                                return (
                                    <motion.div
                                        key={date}
                                        className={styles.dayBlock}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className={styles.dayHeader}>
                                            <div className={styles.dayInfo}>
                                                <span className={styles.dayNumber}>{dateObj.getDate()}</span>
                                                <div className={styles.dayMeta}>
                                                    <span className={styles.dayWeek}>
                                                        {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                                    </span>
                                                    <span className={styles.dayMonth}>
                                                        {dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`${styles.dayTotal} ${dayTotal >= 0 ? styles.credit : styles.debit}`}>
                                                {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                                            </div>
                                        </div>

                                        <div className={styles.dayTransactions}>
                                            {items.map((t, idx) => (
                                                <div key={t.id} className={styles.transaction}>
                                                    <div className={styles.txTime}>{t.time || '--:--'}</div>
                                                    <div className={styles.txContent}>
                                                        <span className={styles.txDesc}>{t.description}</span>
                                                    </div>
                                                    <div className={`${styles.txAmount} ${t.type === 'INCOME' ? styles.credit : styles.debit}`}>
                                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className={styles.empty}>
                                <p>Nenhuma movimentação encontrada neste período</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
