import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="logoGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#2A5298" />
          <stop offset="70%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#162A44" />
        </radialGradient>
      </defs>
      
      <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
      
      {/* Tree Crown - More detailed leaves arrangement */}
      <g fill="white">
        {/* Top/Center leaves */}
        <path d="M50 22 L53 28 L50 32 L47 28 Z" />
        <path d="M44 26 L47 31 L44 35 L41 31 Z" />
        <path d="M56 26 L59 31 L56 35 L53 31 Z" />
        <path d="M38 32 L41 37 L38 41 L35 37 Z" />
        <path d="M62 32 L65 37 L62 41 L59 37 Z" />
        <path d="M34 40 L37 45 L34 49 L31 45 Z" />
        <path d="M66 40 L69 45 L66 49 L63 45 Z" />
        <path d="M32 50 L35 55 L32 59 L29 55 Z" />
        <path d="M68 50 L71 55 L68 59 L65 55 Z" />
        
        {/* Fillers */}
        <path d="M43 38 L46 43 L43 47 L40 43 Z" />
        <path d="M57 38 L60 43 L57 47 L54 43 Z" />
        <path d="M38 48 L41 53 L38 57 L35 53 Z" />
        <path d="M62 48 L65 53 L62 57 L59 53 Z" />
        <path d="M45 52 L48 57 L45 61 L42 57 Z" />
        <path d="M55 52 L58 57 L55 61 L52 57 Z" />
        
        {/* Outer spikes */}
        <path d="M28 42 L31 47 L28 51 L25 47 Z" />
        <path d="M72 42 L75 47 L72 51 L69 47 Z" />
        <path d="M26 58 L29 63 L26 67 L23 63 Z" />
        <path d="M74 58 L77 63 L74 67 L71 63 Z" />
        <path d="M35 65 L38 70 L35 74 L32 70 Z" />
        <path d="M65 65 L68 70 L65 74 L62 70 Z" />
      </g>

      {/* The Cross - Clean and bold */}
      <rect x="47.8" y="38" width="4.4" height="42" fill="white" />
      <rect x="39" y="49" width="22" height="4.4" fill="white" />

      {/* Book Base - More accurate wavy lines */}
      <path 
        d="M28 78 Q35 72 50 82 Q65 72 72 78" 
        stroke="white" 
        strokeWidth="2.5" 
        fill="none" 
        strokeLinecap="round" 
      />
      <path 
        d="M31 84 Q38 78 50 88 Q62 78 69 84" 
        stroke="white" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round" 
        opacity="0.8"
      />
    </svg>
  );
}
