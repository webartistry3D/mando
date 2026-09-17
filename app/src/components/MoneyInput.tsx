import { useState, useEffect } from 'react';
import { formatAmountInput, parseAmountInput } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function MoneyInput({ value, onChange, placeholder = '0.00', className = '', required }: Props) {
  const [display, setDisplay] = useState(value ? formatAmountInput(String(value)) : '');

  // Keep display in sync when value changes externally (e.g. form reset)
  useEffect(() => {
    if (value === 0) {
      setDisplay('');
    } else if (!display || parseAmountInput(display) !== value) {
      setDisplay(formatAmountInput(String(value)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatAmountInput(e.target.value);
    setDisplay(formatted);
    onChange(parseAmountInput(formatted));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={`w-full rounded-md border bg-background px-3 py-2 text-sm mt-1 font-mono placeholder:text-muted-foreground/50 ${className}`}
    />
  );
}
