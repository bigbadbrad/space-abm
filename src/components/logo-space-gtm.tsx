import React from 'react';

interface LogoWordmarkProps {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  height?: number | string;
  className?: string;
}

export const LogoSpaceGtm: React.FC<LogoWordmarkProps> = ({
  textColor = '#010101',
  height = '100%',
  className,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 18"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    >
      <path id="element-id-27926" fill={textColor} d="M0.5,17.6h25.2c2.9,0,5.2-2.2,5.2-5c0-2.7-2.5-4.9-5.1-4.9H5.6c-1.3,0-2.4-1-2.4-2.3
	c0-1.3,1.1-2.2,2.2-2.2c0,0,0.1,0,0.1,0h25.2V0.6H5.6c-2.7,0-5.1,2.1-5.1,4.9v0.1c0,2.8,2.6,4.9,5.1,4.9h20.1c1.3,0,2.3,1,2.3,2.2
	c0,1.2-1,2.3-2.4,2.3H0.5V17.6z"/>
<path id="element-id-76999" fill={textColor} d="M35.8,17.6v-7.2h22.4c2.8,0,5.1-2.1,5.1-5c0-2.8-2.4-4.9-5.1-4.9H33v2.7h25.2
	c1.3,0,2.4,1,2.4,2.2c0,1.2-1.1,2.3-2.4,2.3H33v9.8L35.8,17.6z"/>
<path id="element-id-92945" fill={textColor} d="M56.8,17.7h23.8L78.1,15H62.9l9.4-10.3l0.5,0.6c2.3,2.5,11.3,12.3,11.4,12.4H88
	C84.2,13.5,74.1,2.4,72.4,0.6L56.8,17.7z"/>
<path id="element-id-48779" fill={textColor} d="M86.9,12.5c1.4,3.1,4.6,5.2,8.2,5.2h5.9c0.1-0.1,1.8-1.9,2.4-2.7h-8.3
	c-3.5,0-6.2-2.8-6.2-5.9l-0.1,0.1c0-0.4,0-0.6,0.1-0.9L89.1,8c0.6-2.6,3.1-4.7,6-4.7h19c0.3-0.4,0.9-1,1.4-1.6l1-1.1H95.1
	c-4.8,0-9,3.7-9,8.5C86.2,10.3,86.4,11.4,86.9,12.5L86.9,12.5z M104.8,17.7h30.4V15h-28L104.8,17.7z M133.7,10.4V7.8h-19.9l-2.4,2.7
	H133.7z M118,3.2h17.3V0.5h-14.8C119.8,1.1,119,2,118,3.2z"/>
<path id="element-id-45230" fill={textColor} d="M154,12.5c1.5,3.1,4.6,5.2,8.2,5.2h21.5V7.8h-9.6l1.8,2.7h5V15h-18.7
	c-3.3,0-6.1-2.6-6.1-5.9v0c0-3.2,2.7-5.9,6.1-5.9h21.5V0.6h-21.5c-4.7,0-8.9,3.7-8.9,8.5C153.3,10.3,153.5,11.5,154,12.5L154,12.5z"
	/>
<path id="element-id-8246" fill={textColor} d="M185.9,3.3h13.8v14.4h2.8V3.3h13.8V0.6h-30.4V3.3z"/>
<path id="element-id-97472" fill={textColor} d="M218.5,17.7h2.8V6.5l12.4,10.6l12.5-10.6v11.1h2.8V0.6l-15.3,13l-15.2-13L218.5,17.7z"/>
    </svg>
  );
};
