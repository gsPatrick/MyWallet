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
import { ServiceWorkerRegister } from '@/components/PWA';

export const metadata = {
    title: 'MyWallet - Sistema de Investimentos',
    description: 'Gerencie suas finanças com inteligência',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'MyWallet',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    ],
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* PWA - iOS Meta Tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="MyWallet" />
                <link rel="apple-touch-icon" href="/icons/icon-512x512.svg" />


                {/* PWA - Android/Chrome Meta Tags */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="application-name" content="MyWallet" />
                <meta name="msapplication-TileColor" content="#6366f1" />
                <meta name="msapplication-tap-highlight" content="no" />


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
                <ServiceWorkerRegister />
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
