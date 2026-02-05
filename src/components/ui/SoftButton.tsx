import React from 'react';

interface SoftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    active?: boolean;
    variant?: 'primary' | 'secondary' | 'none';
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
            case 'none':
                return '';
            default:
                return 'nm-card active:nm-inset py-2 px-4';
        }
    };

    return (
        <button
            className={`rounded-2xl transition-all duration-200 font-medium ${getVariantClass()} ${active ? 'nm-inset' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default SoftButton;
