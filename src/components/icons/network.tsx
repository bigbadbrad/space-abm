// /src/components/logo-money.tsx
import { styled } from '@mui/material/styles';

interface LogoProps {
  fill?: string; // Optional prop for fill color
  height?: string | number; // Optional prop for height
}

export const NetworkIcon: React.FC<LogoProps> = ({ fill = '#ffffff', height }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="100%" 
      height={height || "100%"} 
      preserveAspectRatio="xMidYMid meet" 
    >
      <g fillRule="nonzero">
        <path fill={fill} d="M22,12a10.009,10.009,0,1,1-9-9.949v8.226a2,2,0,1,1-2,0V7.934A4.2,4.2,0,1,0,15,9.07V6.812a6,6,0,1,1-4-.722V4.069a7.993,7.993,0,1,0,4,.518V2.461A10.017,10.017,0,0,1,22,12Z"/> 
         </g>
    </svg>
  );
};

