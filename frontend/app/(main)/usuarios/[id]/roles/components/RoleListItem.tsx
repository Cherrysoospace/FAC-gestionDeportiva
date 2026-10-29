import { Tag } from 'primereact/tag';

interface RoleListItemProps {
    name: string;
    description: string;
    active: boolean;
}

export default function RoleListItem({
    name,
    description,
    active
}: RoleListItemProps) {
    return (
        <div className="flex flex-column gap-1">
            <span className="flex align-items-center gap-2 flex-wrap">
                <span className="text-900 font-medium">{name}</span>
                {!active && <Tag value="Inactivo" severity="warning" />}
            </span>
            {description && (
                <span className="text-600 text-sm line-height-3">
                    {description}
                </span>
            )}
        </div>
    );
}
