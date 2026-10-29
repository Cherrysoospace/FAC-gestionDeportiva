import { describe, expect, it } from 'vitest';
import { APP_MODULES, getAllowedModules } from './navigation';

describe('getAllowedModules', () => {
    it('muestra solo Mi perfil cuando el usuario no tiene permisos', () => {
        const allowed = getAllowedModules(() => false);

        expect(allowed.map((module) => module.to)).toEqual(['/perfil']);
    });

    it('muestra todos los módulos cuando el usuario tiene todos los permisos', () => {
        const allowed = getAllowedModules(() => true);

        expect(allowed).toHaveLength(APP_MODULES.length);
    });

    it('exige todos los endpoints del módulo, no solo uno', () => {
        const allowed = getAllowedModules((url, method) => url === '/api/roles' && method === 'GET');

        expect(allowed.map((module) => module.to)).not.toContain('/roles/permisos');
    });
});
