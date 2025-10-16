import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon: Icon = null,
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#475569' : '#00917C',
          color: 'white',
          hoverColor: disabled ? '#475569' : '#059669'
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#475569' : '#475569',
          color: 'white',
          hoverColor: disabled ? '#475569' : '#00917C'
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#475569' : '#dc2626',
          color: 'white',
          hoverColor: disabled ? '#475569' : '#b91c1c'
        };
      default:
        return {
          backgroundColor: disabled ? '#475569' : '#00917C',
          color: 'white',
          hoverColor: disabled ? '#475569' : '#059669'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '6px 12px',
          fontSize: '12px'
        };
      case 'large':
        return {
          padding: '12px 24px',
          fontSize: '16px'
        };
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizeStyles,
        backgroundColor: variantStyles.backgroundColor,
        color: variantStyles.color,
        border: 'none',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Icon ? '8px' : '0',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        ...props.style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = variantStyles.hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = variantStyles.backgroundColor;
        }
      }}
      {...props}
    >
      {Icon && <Icon style={{ width: '16px', height: '16px' }} />}
      {children}
    </button>
  );
};

export default Button;