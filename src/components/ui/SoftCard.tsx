import React from 'react';

interface SoftCardProps {
    children: React.ReactNode;
    className?: string;
    inset?: boolean;
}

const SoftCard: React.FC<SoftCardProps> = ({ children, className = '', inset = false }) => {
    return (
        <div className={`nm-card ${inset ? 'nm-inset' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default SoftCard;
