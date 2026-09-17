import { useState, useEffect } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/** Integer input with thousand separators, no spinner arrows, greyed placeholder. */
export default function NumberInput({ value, onChange, placeholder = '0', className = '', required }: Props) {
  const [display, setDisplay] = useState(value ? value.toLocaleString('en-NG') : '');

  useEffect(() => {
    if (value === 0) {
      setDisplay('');
    } else if (!display || Number(display.replace(/,/g, '')) !== value) {
      setDisplay(value.toLocaleString('en-NG'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^\d]/g, '');
    const num = Number(digits) || 0;
    setDisplay(digits ? num.toLocaleString('en-NG') : '');
    onChange(num);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={`w-full rounded-md border bg-background px-3 py-2 text-sm mt-1 font-mono placeholder:text-muted-foreground/50 ${className}`}
    />
  );
}
