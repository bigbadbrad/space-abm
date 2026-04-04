import React from 'react';

interface LogoConsumerGtmStackedProps {
  /** Wordmark / text color (st0 in original SVG) */
  wordmarkColor?: string;
  /** Primary icon color (st1 in original SVG) */
  iconPrimaryColor?: string;
  /** Secondary icon color (st2 in original SVG) */
  iconSecondaryColor?: string;
  height?: number | string;
  className?: string;
}

export const LogoConsumerGtmStacked: React.FC<LogoConsumerGtmStackedProps> = ({
  wordmarkColor = '#231F20',
  iconPrimaryColor = '#00A9E0',
  iconSecondaryColor = '#D14124',
  height = '100%',
  className,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 376 137.8"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    >
      {/* Wordmark */}
      <g>
        <path
          fill={wordmarkColor}
          d="M0.4,127.6c0,4.8,4.1,8.5,9,8.5h21.4v-2.7H9.3c-3.5,0-6.2-2.8-6.2-5.9c0-0.4,0-0.6,0.1-0.9l0.1-0.3
            c0.6-2.7,3.1-4.6,5.8-4.6c0,0,0.1,0,0.1,0h21.4v-2.7H9.3C4.6,119.1,0.4,122.8,0.4,127.6L0.4,127.6z"
        />
        <path
          fill={wordmarkColor}
          d="M32.7,123.6v8c0,2.5,2.2,4.5,4.8,4.5h20.7c2.6,0,4.8-2,4.8-4.5v-8c0-2.5-2.2-4.5-4.8-4.5H37.5
            C34.9,119.1,32.7,121.1,32.7,123.6z M35.4,131.6v-8c0-1,0.9-1.8,2-1.8h20.7c1.1,0,2,0.9,2,1.8v8c0,1-0.9,1.9-2,1.9H37.5
            C36.3,133.5,35.4,132.6,35.4,131.6z"
        />
        <path
          fill={wordmarkColor}
          d="M66,136h2.8v-12.8c23.2,10.8,26.9,12.6,27.5,12.8l0.1,0v-17h-2.8v12.8L66,119L66,136z"
        />
        <path
          fill={wordmarkColor}
          d="M98.5,136.1h25.2c2.8,0,5.2-2.2,5.2-4.9c0-2.7-2.5-4.9-5.1-4.9h-20c-1.3,0-2.4-1-2.4-2.3
            c0-1.3,1.1-2.2,2.2-2.2c0,0,0.1,0,0.1,0h25.2v-2.7h-25.2c-2.7,0-5.1,2.1-5.1,4.9v0.1c0,2.8,2.6,4.9,5.1,4.9h20.1
            c1.3,0,2.3,1,2.3,2.2c0,1.2-1,2.3-2.4,2.3H98.5V136.1z"
        />
        <path
          fill={wordmarkColor}
          d="M131,119.1v12.5c0,2.5,2.3,4.5,4.7,4.5h20.8c2.5,0,4.7-2,4.7-4.5v-12.5h-2.8v12.5c0,1-0.8,1.9-2,1.9h-20.8
            c-1,0-2-0.9-2-1.9v-12.5H131z"
        />
        <path
          fill={wordmarkColor}
          d="M164.2,136.1h2.8V125l12.4,10.6l12.4-10.6v11.1h2.8v-17L179.4,132l-15.1-12.9L164.2,136.1z"
        />
        <path
          fill={wordmarkColor}
          d="M197.5,136.1h30.4v-2.7h-30.4V136.1z M227.9,121.7v-2.7l-30.4,0v2.7H227.9z M197.5,126.3v2.6h28.9v-2.6H197.5z"
        />
        <path
          fill={wordmarkColor}
          d="M230.8,121.8h25.5c1.2,0.1,2.1,1.1,2.1,2.3s-1,2.1-2.1,2.3h-25.4v9.8h2.8V129h18.7l6.5,7.2h3.3l-6.2-7.2h0.1
            c1.5,0,2.6-0.5,3.6-1.3c3.3-2.8,1.3-8.5-3.6-8.5h-25.2L230.8,121.8z"
        />
        <path
          fill={wordmarkColor}
          d="M279.6,131c1.5,3.1,4.6,5.2,8.1,5.2h21.4v-9.8h-9.5l1.8,2.7h4.9v4.5h-18.6c-3.3,0-6.1-2.6-6.1-5.9v0
            c0-3.2,2.7-5.8,6.1-5.8h21.4v-2.7h-21.4c-4.7,0-8.9,3.7-8.9,8.5C278.8,128.8,279.1,129.9,279.6,131L279.6,131z"
        />
        <path
          fill={wordmarkColor}
          d="M312,121.8h13.7v14.4h2.8v-14.4h13.8v-2.7H312V121.8z"
        />
        <path
          fill={wordmarkColor}
          d="M345.1,136.1h2.8V125l12.4,10.6l12.4-10.6v11.1h2.8v-17L360.2,132l-15.1-12.9L345.1,136.1z"
        />
      </g>

      {/* Icon */}
      <g>
        <g>
          <path
            fill={iconPrimaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M211.7,26.3l-22.8,24.5v-49L211.7,26.3L211.7,26.3z"
          />
          <path
            fill={iconSecondaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M183.9,52l-1.2-33.4l-0.1,0l-33.4-1.2L183.9,52z"
          />
          <path
            fill={iconPrimaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M193.3,53.4l33.4-1.2l0-0.1l1.2-33.4L193.3,53.4z"
          />
          <path
            fill={iconSecondaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M156.8,33.7l24.5,22.8h-49L156.8,33.7L156.8,33.7z"
          />
          <path
            fill={iconPrimaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M191,60c0.8-0.8,1.1-1.7,1.1-2.7c0-1.1-0.4-2-1.1-2.7c-0.8-0.8-1.7-1.1-2.7-1.1c-1.1,0-2,0.4-2.7,1.1
              c-0.8,0.8-1.1,1.7-1.1,2.7c0,1.1,0.4,2,1.1,2.7c0.8,0.8,1.7,1.1,2.7,1.1C189.3,61.1,190.2,60.7,191,60L191,60z"
          />
          <path
            fill={iconSecondaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M219.1,81.2l-24.5-22.8h49L219.1,81.2L219.1,81.2z"
          />
          <path
            fill={iconPrimaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M182.5,61.5l-33.4,1.2l0,0.1l-1.2,33.4L182.5,61.5z"
          />
          <path
            fill={iconSecondaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M192,62.9l1.2,33.4l0.1,0l33.4,1.2L192,62.9z"
          />
          <path
            fill={iconPrimaryColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M186.9,64.1l-22.8,24.5l0,0l22.8,24.4V64.1z"
          />
        </g>
      </g>
    </svg>
  );
};

