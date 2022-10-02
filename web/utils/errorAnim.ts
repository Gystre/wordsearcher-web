import { keyframes } from "@emotion/react";

const keys = keyframes`
0% { 
	transform: translateX(0);
}
25% { 
	transform: translateX(5px) 
}
50% { 
	transform: translateX(-5px) 
}
75% { 
	transform: translateX(5px) 
}
100% { 
	transform: translateX(0);
}
`;

export const errorAnim = `${keys} 0.5s ease-in-out`;
