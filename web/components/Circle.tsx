import React from "react";

interface CircleProps {
    radius?: number;
    color?: string;
}

export const Circle: React.FC<CircleProps> = ({ radius = 50, color }) => {
    return (
        // create a cricle svg with size radius
        <svg
            width={radius}
            height={radius}
            viewBox={`0 0 ${radius} ${radius}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                cx={radius / 2}
                cy={radius / 2}
                r={radius / 2}
                fill={color}
            />
        </svg>
    );
};
