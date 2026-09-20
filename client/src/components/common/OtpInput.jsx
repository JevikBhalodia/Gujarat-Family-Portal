import React, { useRef } from 'react';

export function OtpInput({ length = 6, value = '', onChange, disabled = false }) {
  const inputRefs = useRef([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = val[val.length - 1];
    onChange(newDigits.join(''));

    // Move to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 max-w-[360px] mx-auto w-full">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-bold font-mono text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 disabled:bg-salt"
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
