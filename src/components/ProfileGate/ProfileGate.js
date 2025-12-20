'use client';

/**
 * ProfileGate Component
 * ========================================
 * Blocks app access until user has at least one profile set up.
 * Shows ProfileWizard as fullscreen modal when no profiles exist.
 * ========================================
 */

import { useProfiles } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import ProfileWizard from '@/components/Onboarding/ProfileWizard';
import styles from './ProfileGate.module.css';

export default function ProfileGate({ children }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { profiles, loading: profilesLoading, hasProfiles, refreshProfiles } = useProfiles();

    // Handle wizard completion
    const handleWizardComplete = async () => {
        await refreshProfiles();
        // ProfileContext will update hasProfiles automatically
    };

    // Still loading auth or profiles
    if (authLoading || profilesLoading) {
        return children; // Show children while loading (dashboard will show skeletons)
    }

    // Not authenticated - don't block, just show children (login page etc.)
    if (!isAuthenticated) {
        return children;
    }

    // User is authenticated but has no profiles - BLOCK and show wizard
    if (!hasProfiles && profiles.length === 0) {
        return (
            <>
                {children}
                <div className={styles.wizardOverlay}>
                    <ProfileWizard
                        onComplete={handleWizardComplete}
                        isModal={true}
                    />
                </div>
            </>
        );
    }

    // User has profiles - show normal app
    return children;
}
