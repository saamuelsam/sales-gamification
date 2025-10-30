import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onValueChange: (value: string) => void;
  label?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, label, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const formatCurrency = (val: string | number): string => {
      // Se vazio, retornar vazio
      if (val === '' || val === null || val === undefined) return '';
      
      // Remover tudo que não é número
      const numericValue = val.toString().replace(/\D/g, '');
      
      // Se não tiver número, retornar vazio
      if (!numericValue || numericValue === '0') return '0,00';
      
      // Converter para número e dividir por 100 (centavos)
      const floatValue = parseFloat(numericValue) / 100;
      
      // Formatar no padrão brasileiro
      return floatValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Atualizar display quando value mudar (vindo de fora)
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remover tudo que não é número
      const numericValue = inputValue.replace(/\D/g, '');
      
      // Se vazio, passar 0
      if (!numericValue) {
        setDisplayValue('0,00');
        onValueChange('0');
        return;
      }
      
      // Converter para número decimal (dividir por 100)
      const floatValue = parseFloat(numericValue) / 100;
      
      // Atualizar display formatado
      setDisplayValue(formatCurrency(numericValue));
      
      // Passar valor numérico para o parent
      onValueChange(floatValue.toFixed(2));
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Garantir formatação ao sair do campo
      setDisplayValue(formatCurrency(value));
    };

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
            R$
          </span>
          <input
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${className}`}
          />
        </div>
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
