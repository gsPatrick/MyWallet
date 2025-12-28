'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './LandingFooter.module.css';

export default function LandingFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.card}>
                <div className={styles.content}>
                    {/* Left - Brand */}
                    <div className={styles.brand}>
                        <Image
                            src="/images/logoparafundopreto.png"
                            alt="MyWallet"
                            width={360}
                            height={120}
                            className={styles.logo}
                        />
                        <p className={styles.description}>
                            O sistema completo para gestão financeira pessoal.
                            Simplifique o controle dos seus investimentos e despesas.
                        </p>
                        <a href="mailto:mywallet.codebypatrick.dev@gmail.com" className={styles.emailBtn}>
                            ✉️ mywallet.codebypatrick.dev@gmail.com
                        </a>
                    </div>

                    {/* Right - Navigation */}
                    <div className={styles.navigation}>
                        <h4>NAVEGAÇÃO</h4>
                        <Link href="/#features">Funcionalidades</Link>
                        <Link href="/#pricing">Planos</Link>
                        <Link href="/#benefits">Benefícios</Link>
                        <Link href="/#cta">Começar</Link>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.bottom}>
                    <span>© 2025 MyWallet. Todos os direitos reservados.</span>
                    <div className={styles.credit}>
                        Desenvolvido por
                        <span className={styles.devBadge}>
                            {'</>'} Patrick.Developer
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
