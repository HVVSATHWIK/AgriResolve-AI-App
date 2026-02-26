import React from 'react';

export type AgriResolveAssistantMarkProps = React.SVGProps<SVGSVGElement>;

// Custom mark for the Field Assistant: a crop/leaf inside a badge with small scan arcs.
// Uses currentColor so it inherits the surrounding text color.
export const AgriResolveAssistantMark: React.FC<AgriResolveAssistantMarkProps> = ({
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
            {/* Badge */}
            <path d="M12 2.6c5.19 0 9.4 4.21 9.4 9.4s-4.21 9.4-9.4 9.4-9.4-4.21-9.4-9.4 4.21-9.4 9.4-9.4z" />

            {/* Leaf / crop mark */}
            <path d="M8.2 14.1c1.4-3.9 4.4-6.1 7.7-6.7.1 3.7-1.7 7.4-5.2 8.9-1.3.6-2.7.8-4.1.6.1-1 .3-2 .6-2.8z" />
            <path d="M9.4 16.6c1-2.2 3.1-4.6 5.5-6.1" />

            {/* Soil rows */}
            <path d="M7.2 18.1h9.6" />
            <path d="M8.1 19.6h7.8" />

            {/* Scan arcs (AI) */}
            <path d="M16.9 7.6c1 .2 1.8 1 2 2" />
            <path d="M15.9 6.3c1.8.3 3.3 1.8 3.6 3.6" />
            <circle cx="18.8" cy="10.0" r="0.7" />
        </svg>
    );
};
