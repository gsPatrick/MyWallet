'use client';

import { motion } from 'framer-motion';
import styles from './Card.module.css';

export default function Card({
    children,
    variant = 'default', // default, elevated, outline, glass
    padding = 'md', // none, sm, md, lg
    className = '',
    onClick,
    animate = true,
    ...props
}) {
    const Component = animate ? motion.div : 'div';
    const animationProps = animate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring', damping: 20 },
        whileHover: onClick ? { scale: 1.02 } : {},
        whileTap: onClick ? { scale: 0.98 } : {},
    } : {};

    return (
        <Component
            className={`
        ${styles.card} 
        ${styles[variant]} 
        ${styles[`padding-${padding}`]}
        ${onClick ? styles.clickable : ''}
        ${className}
      `}
            onClick={onClick}
            {...animationProps}
            {...props}
        >
            {children}
        </Component>
    );
}

// Card Header
Card.Header = function CardHeader({ children, className = '' }) {
    return (
        <div className={`${styles.header} ${className}`}>
            {children}
        </div>
    );
};

// Card Title
Card.Title = function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`${styles.title} ${className}`}>
            {children}
        </h3>
    );
};

// Card Description
Card.Description = function CardDescription({ children, className = '' }) {
    return (
        <p className={`${styles.description} ${className}`}>
            {children}
        </p>
    );
};

// Card Content
Card.Content = function CardContent({ children, className = '' }) {
    return (
        <div className={`${styles.content} ${className}`}>
            {children}
        </div>
    );
};

// Card Footer
Card.Footer = function CardFooter({ children, className = '' }) {
    return (
        <div className={`${styles.footer} ${className}`}>
            {children}
        </div>
    );
};
