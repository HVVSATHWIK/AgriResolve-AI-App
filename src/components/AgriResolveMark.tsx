import React from 'react';

export type AgriResolveMarkProps = React.SVGProps<SVGSVGElement>;

// Simple, custom mark: leaf + small "AI node" dots.
export const AgriResolveMark: React.FC<AgriResolveMarkProps> = ({
    className,
    ...props
}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={props['aria-label'] ? undefined : true}
            {...props}
        >
            {/* Leaf body */}
            <path d="M6.5 14.2c4.1-8.1 11-8.9 13.1-9.1.2 2.2.5 9.6-7.6 13.6-2.2 1.1-4.6 1.3-6.9.7.1-1.9.5-3.9 1.4-5.2z" />
            {/* Mid vein */}
            <path d="M9.3 18.3c1.1-4.1 5.6-8.3 8.9-10.6" />

            {/* AI nodes */}
            <circle cx="17.6" cy="6.4" r="1.05" />
            <circle cx="14.6" cy="10.0" r="0.95" />
            <circle cx="11.7" cy="13.7" r="0.95" />
            <path d="M16.9 7.4l-1.4 1.9" />
            <path d="M13.8 11.0l-1.4 1.9" />
        </svg>
    );
};
