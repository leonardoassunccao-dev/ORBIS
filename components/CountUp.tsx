import React, { useEffect, useState } from 'react';
import { animate } from 'motion';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ value, duration = 0.8, formatter, className }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(latest),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {formatter ? formatter(displayValue) : displayValue.toFixed(2)}
    </span>
  );
};
