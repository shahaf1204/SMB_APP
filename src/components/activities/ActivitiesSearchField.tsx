import { Search, X } from 'lucide-react';
import { IconButton } from '../ds/IconButton';
import { SearchInput } from '../ds/Input';

interface ActivitiesSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ActivitiesSearchField({
  value,
  onChange,
  placeholder = 'חיפוש פעילויות, לקוחות, מיקום…',
}: ActivitiesSearchFieldProps) {
  return (
    <div className="activities-search">
      <SearchInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="חיפוש פעילויות"
        startIcon={<Search size={18} strokeWidth={1.75} aria-hidden />}
        endIcon={
          value.length > 0 ? (
            <IconButton
              icon={X}
              aria-label="נקה חיפוש"
              size="sm"
              variant="outline"
              onClick={() => onChange('')}
            />
          ) : undefined
        }
      />
    </div>
  );
}
