import { Button } from '@/components/ui/button';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  disabled?: boolean;
}

const mathSymbols = [
  { label: '√', value: '√' },
  { label: 'x²', value: '^2' },
  { label: 'xⁿ', value: '^' },
  { label: 'π', value: 'π' },
  { label: '∫', value: '∫' },
  { label: '∑', value: '∑' },
  { label: '∞', value: '∞' },
  { label: '±', value: '±' },
  { label: '÷', value: '÷' },
  { label: '×', value: '×' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
  { label: '≠', value: '≠' },
  { label: '≈', value: '≈' },
  { label: 'θ', value: 'θ' },
  { label: 'α', value: 'α' },
  { label: 'β', value: 'β' },
  { label: 'Δ', value: 'Δ' },
  { label: '∂', value: '∂' },
  { label: 'log', value: 'log' },
  { label: 'ln', value: 'ln' },
  { label: 'sin', value: 'sin' },
  { label: 'cos', value: 'cos' },
  { label: 'tan', value: 'tan' },
];

export const MathKeyboard = ({ onInsert, disabled }: MathKeyboardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-2 animate-fade-in">
      <div className="grid grid-cols-8 gap-1">
        {mathSymbols.map((symbol) => (
          <Button
            key={symbol.value}
            variant="ghost"
            size="sm"
            onClick={() => onInsert(symbol.value)}
            disabled={disabled}
            className="h-8 w-full text-sm font-mono hover:bg-primary/10 hover:text-primary"
          >
            {symbol.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
