import React, { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomKeypadProps {
  value: number;
  onChange: (value: number) => void;
}

export const CustomKeypad: React.FC<CustomKeypadProps> = ({ value, onChange }) => {
  const [internalValue, setInternalValue] = useState(Math.round(value * 100).toString());

  useEffect(() => {
    setInternalValue(Math.round(value * 100).toString());
  }, [value]);

  const handleKeyPress = (key: string) => {
    let newValue = internalValue;
    if (key === 'backspace') {
      newValue = newValue.slice(0, -1);
      if (newValue === '') newValue = '0';
    } else {
      if (newValue === '0') {
        newValue = key;
      } else {
        newValue += key;
      }
    }
    
    // Max 10 digits
    if (newValue.length > 10) return;

    setInternalValue(newValue);
    onChange(Number(newValue) / 100);
  };

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '00', '0', 'backspace'
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4">
      {keys.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleKeyPress(key)}
          className="h-14 md:h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xl md:text-2xl font-medium text-gray-900 dark:text-white active:bg-gray-200 dark:active:bg-white/10 transition-colors"
        >
          {key === 'backspace' ? <Delete size={24} /> : key}
        </motion.button>
      ))}
    </div>
  );
};
