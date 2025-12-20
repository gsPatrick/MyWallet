'use client';

/**
 * DashboardSkeleton
 * ========================================
 * Skeleton loader that EXACTLY replicates
 * the dashboard layout with shimmer effect
 * ========================================
 */

import styles from '@/app/dashboard/page.module.css';
import skeletonStyles from './DashboardSkeleton.module.css';

export default function DashboardSkeleton() {
    return (
        <>
            {/* Hero Balance - Exact same structure */}
            <div className={styles.hero}>
                <div className={`${skeletonStyles.shimmerBlock} ${skeletonStyles.heroLabel}`} />
                <div className={`${skeletonStyles.shimmerBlock} ${skeletonStyles.heroValue}`} />
                <div className={`${skeletonStyles.shimmerBlock} ${skeletonStyles.heroPeriod}`} />
            </div>

            <div className={styles.dashboardGrid}>
                {/* LEFT COLUMN: Main Content */}
                <div className={styles.dashboardMain}>
                    {/* Summary Grid: 3 Columns (Income, Expenses, Balance) */}
                    <div className={styles.summaryGrid}>

                        {/* Column 1: Income */}
                        <div className={styles.summaryColumn}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                        </div>

                        {/* Column 2: Expenses */}
                        <div className={styles.summaryColumn}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                        </div>

                        {/* Column 3: Balance & Results */}
                        <div className={styles.summaryColumn}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    <div className={skeletonStyles.iconSkeleton} />
                                </div>
                                <span className={`${styles.cardValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card - Allocation */}
                    <div className={styles.allocationCard}>
                        <div className={styles.allocationHeader}>
                            <h3 className={skeletonStyles.shimmer} style={{ width: '180px' }}>&nbsp;</h3>
                            <div className={styles.chartToggle}>
                                <div className={skeletonStyles.chartBtnSkeleton} />
                                <div className={skeletonStyles.chartBtnSkeleton} />
                            </div>
                        </div>

                        {/* Pie Chart Skeleton */}
                        <div className={styles.pieChartContainer}>
                            <div className={styles.pieChart}>
                                <svg viewBox="0 0 100 100" className={styles.pieSvg}>
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-light)" strokeWidth="8" opacity="0.3" className={skeletonStyles.pulseCircle} />
                                    <circle cx="50" cy="50" r="20" fill="var(--bg-secondary)" />
                                </svg>
                                <div className={styles.pieCenter}>
                                    <span className={`${styles.pieCenterValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;</span>
                                    <span className={`${styles.pieCenterLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                </div>
                            </div>
                            <div className={styles.pieLegend}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={styles.legendItem}>
                                        <span className={`${styles.legendDot} ${skeletonStyles.shimmer}`} />
                                        <span className={`${styles.legendName} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                        <span className={`${styles.legendValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                        <span className={`${styles.legendPercent} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <span className={`${styles.editLink} ${skeletonStyles.shimmer}`} style={{ width: '130px', display: 'inline-block' }}>&nbsp;</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (Quick Actions) */}
                <div className={styles.dashboardSidebar}>
                    <div className={styles.quickActions}>
                        <h3 className={skeletonStyles.shimmer} style={{ width: '120px' }}>&nbsp;</h3>
                        <div className={styles.quickGrid}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`${styles.quickItem} ${skeletonStyles.quickItemSkeleton}`}>
                                    <div className={skeletonStyles.iconSkeleton} />
                                    <span className={skeletonStyles.shimmer}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                </div>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className={styles.quickStats}>
                            {[1, 2].map((i) => (
                                <div key={i} className={styles.statItem}>
                                    <div className={skeletonStyles.iconSkeleton} />
                                    <div>
                                        <span className={`${styles.statValue} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;</span>
                                        <span className={`${styles.statLabel} ${skeletonStyles.shimmer}`}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
