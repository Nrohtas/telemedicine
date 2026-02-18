import React from 'react';

interface SoftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    active?: boolean;
    variant?: 'primary' | 'secondary' | 'nav' | 'none';
}

const SoftButton: React.FC<SoftButtonProps> = ({
    children,
    active = false,
    variant = 'secondary',
    className = '',
    ...props
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'primary':
                return 'bg-nm-primary text-white shadow-[4px_4px_8px_rgba(142,122,181,0.4),-4px_-4px_8px_rgba(142,122,181,0.1)] active:shadow-inner';
            case 'nav':
                return active
                    ? 'bg-white/50 text-nm-primary shadow-nm-inset font-black ring-1 ring-nm-primary/20 backdrop-blur-sm'
                    : 'text-nm-primary/40 hover:text-nm-primary/70 hover:bg-white/10 transition-all font-bold';
            case 'none':
                return '';
            default:
                return 'nm-card active:nm-inset py-2 px-4';
        }
    };

    return (
        <button
            className={`rounded-xl transition-all duration-300 font-medium ${getVariantClass()} ${variant === 'nav' ? 'px-6 py-2.5' : 'px-4 py-2'} ${active && variant !== 'nav' ? 'nm-inset' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default SoftButton;
