'use client';

import { motion } from 'framer-motion';
import { FiLink } from 'react-icons/fi';
import styles from './OpenFinance.module.css';

const banks = [
    { name: 'Nubank', color: '#820AD1' },
    { name: 'Itaú', color: '#EC7000' },
    { name: 'Inter', color: '#FF7A00' },
    { name: 'Bradesco', color: '#CC092F' },
    { name: 'XP', color: '#000000' },
    { name: 'C6 Bank', color: '#1A1A1A' },
];

export default function OpenFinance() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.badge}>
                        <FiLink /> Open Finance
                    </div>
                    <h2 className={styles.title}>
                        Conecte todas suas contas
                    </h2>
                    <p className={styles.text}>
                        Integração direta com os principais bancos e instituições financeiras do Brasil.
                        Seus dados em um só lugar, de forma segura e automática.
                    </p>
                </motion.div>

                <motion.div
                    className={styles.banksGrid}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {banks.map((bank, index) => (
                        <motion.div
                            key={bank.name}
                            className={styles.bankCard}
                            style={{ '--bank-color': bank.color }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className={styles.bankDot} />
                            <span className={styles.bankName}>{bank.name}</span>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.p
                    className={styles.note}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    E mais de 50 outras instituições
                </motion.p>
            </div>
        </section>
    );
}
