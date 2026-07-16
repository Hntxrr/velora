import * as React from "react";

/**
 * Velora logo mark — a "V" formed by two swept wings with the brand gradient
 * (cyan/blue on the left wing, violet/magenta on the right). SVG so it scales
 * crisply and re-colors from brand tokens.
 */
export function Logo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-left`} x1="6" y1="12" x2="34" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="58" y1="12" x2="34" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e948d6" />
          <stop offset="0.5" stopColor="#9333ea" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Left wing */}
      <path
        d="M7 13c4.5-1.2 8.6 0.6 11 4.7l14.9 25.6c1 1.7 0.4 3.4-1 4.4-1.6 1.1-3.7 0.7-4.8-1L9.2 20.2C7 16.4 5.4 14.4 7 13Z"
        fill={`url(#${id}-left)`}
      />
      {/* Right wing */}
      <path
        d="M57 13c-4.5-1.2-8.6 0.6-11 4.7L31.1 43.3c-1 1.7-0.4 3.4 1 4.4 1.6 1.1 3.7 0.7 4.8-1l17.9-26.5c2.2-3.8 3.8-5.8 2.2-7.2Z"
        fill={`url(#${id}-right)`}
      />
      {/* Inner sweep highlight for depth */}
      <path
        d="M32 42.5 27.2 51c-1 1.7-0.4 3.4 1 4.4 1.6 1.1 3.7 0.7 4.8-1L37 46l-5-3.5Z"
        fill={`url(#${id}-right)`}
        opacity="0.55"
      />
    </svg>
  );
}
