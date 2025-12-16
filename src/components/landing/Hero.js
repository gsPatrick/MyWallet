'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            {/* Subtle Background */}
            <div className={styles.background}>
                <div className={styles.gradientOrb} />
            </div>

            <motion.div
                className={styles.content}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Logo Large */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <Image
                        src="/images/logoparafundobranco.png"
                        alt="MyWallet"
                        width={600}
                        height={200}
                        className={styles.logo}
                        priority
                    />
                </motion.div>

                {/* Main Title */}
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    Sua carteira em suas mãos
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    Controle investimentos, despesas e metas financeiras<br />
                    em uma plataforma completa e intuitiva.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    className={styles.cta}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Link href="/signup" className={styles.primaryBtn}>
                        Começar Grátis
                        <FiArrowRight />
                    </Link>
                    <Link href="/login" className={styles.secondaryBtn}>
                        Já tenho conta
                    </Link>
                </motion.div>
            </motion.div>

            {/* Scroll Hint */}
            <motion.div
                className={styles.scrollHint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
            >
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={styles.scrollLine}
                />
            </motion.div>
        </section>
    );
}
