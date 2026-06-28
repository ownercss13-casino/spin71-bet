import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface DigitColumnProps {
  digit: number;
}

const DigitColumn: React.FC<DigitColumnProps> = ({ digit }) => {
  return (
    <span className="inline-block h-[1.3em] overflow-hidden relative leading-none align-baseline tabular-nums">
      <motion.span
        className="flex flex-col absolute top-0 left-0 w-full"
        animate={{ y: `-${digit * 10}%` }}
        transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.7 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span 
            key={n} 
            className="h-[1.3em] w-full flex items-center justify-center font-black select-none text-center"
          >
            {n}
          </span>
        ))}
      </motion.span>
      {/* Invisible spacer to reserve width and height */}
      <span className="invisible select-none px-[0.02em] leading-[1.3em]">0</span>
    </span>
  );
};

interface AnimatedBalanceProps {
  value: number;
  decimals?: number;
  className?: string;
  showCurrency?: boolean;
}

export const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({
  value,
  decimals = 0,
  className = '',
  showCurrency = true,
}) => {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const chars = formatted.split('');
  const len = chars.length;

  return (
    <span className={`inline-flex items-center select-none tabular-nums ${className}`}>
      {showCurrency && <span className="mr-1">৳</span>}
      {chars.map((char, index) => {
        // Calculate key from the right side of the list so it is stable when digit length is altered.
        const keyFromRight = len - 1 - index;
        const key = `char-${keyFromRight}`;

        if (/\d/.test(char)) {
          const digit = parseInt(char, 10);
          return <DigitColumn key={key} digit={digit} />;
        }

        return (
          <span key={key} className="inline-block relative leading-none align-bottom px-[0.02em]">
            {char}
          </span>
        );
      })}
    </span>
  );
};
