// Convierte entre Date (calendario) y 'yyyy-MM-dd' (API) en hora local,
// para que la fecha no se corra un día por la zona horaria.

export function parseIsoDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date | null): string | null {
    if (!date) return null;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
