import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../design-system/cn';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('ds-field', className)}>
      {label && (
        <label className="ds-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className="ds-field__error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && <span className="ds-field__hint">{hint}</span>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Input({
  error,
  startIcon,
  endIcon,
  className,
  id,
  ...rest
}: InputProps) {
  return (
    <div className="ds-input-wrap">
      {startIcon && <span className="ds-input-wrap__icon">{startIcon}</span>}
      <input
        id={id}
        className={cn(
          'ds-input',
          startIcon != null && 'ds-input--with-icon',
          error && 'ds-input--error',
          className,
        )}
        {...rest}
      />
      {endIcon && (
        <span className="ds-input-wrap__icon ds-input-wrap__icon--end">{endIcon}</span>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  error,
  options,
  placeholder,
  className,
  id,
  ...rest
}: SelectProps) {
  return (
    <select
      id={id}
      className={cn('ds-select', error && 'ds-select--error', className)}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void;
}

export function SearchInput({ startIcon, className, ...rest }: SearchInputProps) {
  return (
    <Input
      type="search"
      startIcon={startIcon}
      className={className}
      autoComplete="off"
      {...rest}
    />
  );
}

export function DateInput(props: Omit<InputProps, 'type'>) {
  return <Input type="date" {...props} />;
}

export function TimeInput(props: Omit<InputProps, 'type'>) {
  return <Input type="time" {...props} />;
}

export interface ToggleProps {
  id?: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function Toggle({
  id,
  label,
  checked,
  disabled,
  onChange,
  className,
}: ToggleProps) {
  return (
    <label className={cn('ds-toggle', className)}>
      <input
        id={id}
        type="checkbox"
        className="ds-toggle__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="ds-toggle__track" aria-hidden />
      {label && <span className="ds-body">{label}</span>}
    </label>
  );
}

export interface CheckboxProps {
  id?: string;
  label?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({
  id,
  label,
  checked,
  disabled,
  onChange,
  className,
}: CheckboxProps) {
  return (
    <label className={cn('ds-checkbox', className)}>
      <input
        id={id}
        type="checkbox"
        className="ds-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="ds-checkbox__box" aria-hidden>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label && <span className="ds-checkbox__label">{label}</span>}
    </label>
  );
}
