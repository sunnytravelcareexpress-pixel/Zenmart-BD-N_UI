import React from 'react';

interface ZenMartLogoProps {
  className?: string;
  size?: number | string;
}

export const ZenMartLogo: React.FC<ZenMartLogoProps> = ({
  className = "w-10 h-10",
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={`rounded-full shrink-0 ${className}`}
    >
      <defs>
        {/* Outer Ring Gradient: Teal to Amber Orange */}
        <linearGradient id="zenRingGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#14959E" />
          <stop offset="35%" stopColor="#2DA0A7" />
          <stop offset="70%" stopColor="#DE8C1D" />
          <stop offset="100%" stopColor="#EA9116" />
        </linearGradient>

        {/* Arrow Gradient */}
        <linearGradient id="zenArrowGrad" x1="20%" y1="80%" x2="100%" y2="20%">
          <stop offset="0%" stopColor="#EA8B12" />
          <stop offset="100%" stopColor="#F29815" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="250" cy="250" r="238" fill="#FFFFFF" />

      {/* Outer Gradient Ring */}
      <circle
        cx="250"
        cy="250"
        r="228"
        fill="none"
        stroke="url(#zenRingGrad)"
        strokeWidth="14"
      />

      {/* Shopping Cart Body (Teal) */}
      <g id="cart">
        {/* Handle & Outer Frame */}
        <path
          d="M 162 148 
             C 152 148, 146 154, 150 162
             L 194 266
             C 198 274, 206 278, 218 278
             L 310 278
             C 318 278, 322 272, 322 265
             C 322 258, 318 253, 310 253
             L 223 253
             C 217 253, 213 250, 210 244
             L 204 230
             L 262 230
             C 272 230, 278 223, 274 213
             L 248 184
             C 244 180, 238 178, 230 178
             L 198 178
             C 192 178, 186 174, 184 168
             L 180 156
             C 177 150, 170 148, 162 148 Z"
          fill="#14959E"
        />

        {/* Upper Cart Rim Segment */}
        <path
          d="M 196 166
             L 264 166
             C 274 166, 280 172, 276 182
             L 245 220
             C 242 224, 236 226, 230 226
             L 200 226
             C 194 226, 188 222, 186 216
             L 182 206
             C 180 200, 184 194, 190 194
             L 240 194
             L 254 178
             L 194 178
             C 186 178, 184 170, 188 166 Z"
          fill="#14959E"
        />

        {/* Front Bumper Bar */}
        <path
          d="M 215 258 
             L 302 258
             C 308 258, 312 262, 312 266
             C 312 270, 308 274, 302 274
             L 215 274
             Z"
          fill="#14959E"
        />

        {/* Cart Wheel Left */}
        <circle cx="225" cy="304" r="18" fill="none" stroke="#14959E" strokeWidth="8" />
        <circle cx="225" cy="304" r="7" fill="#14959E" />

        {/* Cart Wheel Right */}
        <circle cx="288" cy="304" r="18" fill="none" stroke="#14959E" strokeWidth="8" />
        <circle cx="288" cy="304" r="7" fill="#14959E" />
      </g>

      {/* Growth Arrow Zig-Zag (Amber Orange) */}
      <g id="growth-arrow">
        <path
          d="M 194 250
             L 226 214
             C 230 210, 236 210, 240 214
             L 258 238
             C 262 243, 269 243, 273 238
             L 336 156
             L 348 140
             C 350 137, 354 139, 353 143
             L 344 196
             C 343 200, 338 202, 335 199
             L 326 190
             L 272 258
             C 268 263, 260 263, 256 258
             L 238 234
             C 235 230, 229 230, 226 234
             L 204 258
             C 200 262, 192 258, 194 250 Z"
          fill="url(#zenArrowGrad)"
        />

        {/* Arrow Head Polygon */}
        <polygon
          points="334,130 366,134 352,168 344,152 334,142"
          fill="url(#zenArrowGrad)"
        />
      </g>

      {/* Brand Name: ZenMart */}
      <text
        x="250"
        y="368"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', sans-serif"
        fontSize="50"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="#0C4A5A"
      >
        ZenMart
      </text>

      {/* Brand Subtitle: স্মার্ট কেনাকাটা, সহজ সমাধান */}
      <text
        x="250"
        y="408"
        textAnchor="middle"
        fontFamily="'Hind Siliguri', 'Kalpurush', system-ui, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="#0C4A5A"
        letterSpacing="0.01em"
      >
        স্মার্ট কেনাকাটা, সহজ সমাধান
      </text>
    </svg>
  );
};
