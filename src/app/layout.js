import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { MedalProvider } from '@/contexts/MedalContext';
import { PaymentNotificationProvider } from '@/contexts/PaymentNotificationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { PageTransitionProvider } from '@/components/PageTransition';

export const metadata = {
    title: 'MyWallet - Sistema de Investimentos',
    description: 'Gerencie suas finanças com inteligência',
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
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const savedTheme = localStorage.getItem('investpro-theme');
                                    const savedAccent = localStorage.getItem('investpro-accent');
                                    if (savedTheme) {
                                        document.documentElement.setAttribute('data-theme', savedTheme);
                                    }
                                    if (savedAccent) {
                                        document.documentElement.style.setProperty('--accent-primary', savedAccent);
                                    }
                                } catch (e) {}
                            })()
                        `,
                    }}
                />
            </head>
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <ProfileProvider>
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
                        </ProfileProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

