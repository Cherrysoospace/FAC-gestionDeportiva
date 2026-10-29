import { InputText } from 'primereact/inputtext';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export default function SearchInput({
    value,
    onChange,
    ariaLabel,
    placeholder = 'Buscar…',
    disabled = false,
    className = ''
}: SearchInputProps) {
    return (
        <span className={`p-input-icon-left ${className}`}>
            <i className="pi pi-search" aria-hidden="true" />
            <InputText
                type="search"
                value={value}
                placeholder={placeholder}
                aria-label={ariaLabel}
                disabled={disabled}
                className="w-full"
                onChange={(event) => onChange(event.target.value)}
            />
        </span>
    );
}
