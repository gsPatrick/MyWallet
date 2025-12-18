import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { MedalProvider } from '@/contexts/MedalContext';
import { PaymentNotificationProvider } from '@/contexts/PaymentNotificationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { PageTransitionProvider } from '@/components/PageTransition';

export const metadata = {
    title: 'InvestPro - Sistema de Investimentos',
    description: 'Sistema financeiro completo com Open Finance Brasil',
    manifest: '/manifest.json',
    themeColor: '#0a0a0f',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <MedalProvider>
                            <OnboardingProvider>
                                <PaymentNotificationProvider>
                                    <NotificationProvider>
                                        <PrivacyProvider>
                                            <PageTransitionProvider>
                                                {children}
                                            </PageTransitionProvider>
                                        </PrivacyProvider>
                                    </NotificationProvider>
                                </PaymentNotificationProvider>
                            </OnboardingProvider>
                        </MedalProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
