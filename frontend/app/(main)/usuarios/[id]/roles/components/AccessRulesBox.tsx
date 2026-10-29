import { Message } from 'primereact/message';

export default function AccessRulesBox() {
    return (
        <section className="card" aria-labelledby="access-rules-title">
            <h5 id="access-rules-title" className="mt-0 mb-3">
                Reglas de acceso
            </h5>
            <ul className="m-0 pl-3 text-600 text-sm line-height-3 mb-3">
                <li>
                    Si al menos uno de los roles del usuario posee el permiso,
                    la operación se permite.
                </li>
                <li>
                    Si ninguno de sus roles posee el permiso requerido, el
                    acceso se deniega.
                </li>
                <li>
                    Un usuario puede tener uno o varios roles, pero el mismo
                    rol no se asigna dos veces.
                </li>
            </ul>
            <Message
                severity="warn"
                className="w-full justify-content-start"
                text="Retirar un rol no elimina al usuario ni al rol del sistema: solo quita la asociación entre ambos."
            />
        </section>
    );
}
