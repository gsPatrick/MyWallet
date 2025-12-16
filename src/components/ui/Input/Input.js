'use client';

import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import styles from './Input.module.css';

const Input = forwardRef(({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    helperText,
    leftIcon,
    rightIcon,
    disabled = false,
    required = false,
    fullWidth = false,
    size = 'md', // sm, md, lg
    className = '',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <div className={`
        ${styles.inputWrapper} 
        ${styles[size]} 
        ${error ? styles.error : ''} 
        ${disabled ? styles.disabled : ''}
      `}>
                {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                <input
                    ref={ref}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    className={styles.input}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                )}
                {rightIcon && !isPassword && <span className={styles.rightIcon}>{rightIcon}</span>}
            </div>
            {(error || helperText) && (
                <span className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
                    {error && <FiAlertCircle className={styles.errorIcon} />}
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;

// Textarea variant
export const Textarea = forwardRef(({
    label,
    placeholder,
    value,
    onChange,
    error,
    helperText,
    disabled = false,
    required = false,
    fullWidth = false,
    rows = 4,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                rows={rows}
                className={`${styles.textarea} ${error ? styles.error : ''}`}
                {...props}
            />
            {(error || helperText) && (
                <span className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
                    {error && <FiAlertCircle className={styles.errorIcon} />}
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';
