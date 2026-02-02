// /src/components/logo-money.tsx
import { styled } from '@mui/material/styles';

interface LogoProps {
  fill?: string; // Optional prop for fill color
  height?: string | number; // Optional prop for height
}

export const PowerIcon: React.FC<LogoProps> = ({ fill = '#ffffff', height }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="100%" 
      height={height || "100%"} 
      preserveAspectRatio="xMidYMid meet" 
    >
      <g fillRule="nonzero">
    <path fill={fill} d="M12,10h7L8,22l3-9H5L13,2Z"/>
      </g>
    </svg>
  );
};

