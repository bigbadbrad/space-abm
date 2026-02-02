// /src/components/logo-money.tsx
import { styled } from '@mui/material/styles';

interface LogoProps {
  fill?: string; // Optional prop for fill color
  height?: string | number; // Optional prop for height
}

export const StructureIcon: React.FC<LogoProps> = ({ fill = '#ffffff', height }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="100%" 
      height={height || "100%"} 
      preserveAspectRatio="xMidYMid meet" 
    >
      <g fillRule="nonzero">
        <path fill={fill} d="M10.5,2h-4a1,1,0,0,0-1,1V8h6V3A1,1,0,0,0,10.5,2Z"/>
        <path fill={fill} d="M5.5,14a1,1,0,0,0,1,1h5V9h-6Z"/>
        <path fill={fill} d="M17.5,9h-5v6h6V10A1,1,0,0,0,17.5,9Z"/>
        <path fill={fill} d="M12.5,21a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V16h-6Z"/>
    </g>
    </svg>
  );
};

