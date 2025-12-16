'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

const Button = forwardRef(({
    children,
    variant = 'primary', // primary, secondary, ghost, danger, success
    size = 'md', // sm, md, lg
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    onClick,
    type = 'button',
    className = '',
    ...props
}, ref) => {
    return (
        <motion.button
            ref={ref}
            type={type}
            className={`
        ${styles.button} 
        ${styles[variant]} 
        ${styles[size]} 
        ${fullWidth ? styles.fullWidth : ''} 
        ${loading ? styles.loading : ''}
        ${className}
      `}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {!loading && leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
            <span className={styles.label}>{children}</span>
            {!loading && rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
