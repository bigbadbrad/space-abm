// /src/components/logo-money.tsx
import { styled } from '@mui/material/styles';

interface LogoProps {
  fill?: string; // Optional prop for fill color
  height?: string | number; // Optional prop for height
}

export const LaserIcon: React.FC<LogoProps> = ({ fill = '#ffffff', height }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="100%" 
      height={height || "100%"} 
      preserveAspectRatio="xMidYMid meet" 
    >
      <g fillRule="nonzero">
        <path fill={fill} d="M12.1,13.1l4.7,1.9l-1.2,2l-4-3.1c-0.2,0.2-0.4,0.4-0.6,0.6l1.5,2.3l-0.8,0.5l-1.2-2.5C10.2,14.9,9.9,15,9.7,15l0.7,5H8.1
	l0.7-5c-0.3,0-0.6-0.1-0.9-0.3l-1.2,2.5l-0.8-0.5l1.5-2.3c-0.2-0.2-0.4-0.4-0.6-0.6l-4,3.2l-1.2-2l4.7-1.9c-0.1-0.3-0.2-0.6-0.2-0.9
	l-2.7,0.2v-1l2.7,0.2c0-0.3,0.1-0.6,0.2-0.9L1.7,8.9l1.2-2l4,3.1C7,9.9,7.2,9.7,7.4,9.5L5.9,7.2l0.8-0.5l1.2,2.4
	C8.2,9.1,8.5,9,8.8,8.9l-0.7-5h2.3l-0.7,5c0.3,0,0.6,0.1,0.8,0.2l1.2-2.4l0.8,0.5L11,9.5c0.2,0.2,0.5,0.4,0.6,0.6l4-3.1l1.2,2
	l-4.7,1.9c0.1,0.1,0.1,0.3,0.1,0.4h10.4l0,0.8l0,0.8H12.2C12.2,12.9,12.1,13,12.1,13.1z"/>
</g>
    </svg>
  );
};

