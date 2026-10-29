/** Resultado de una acción de la interfaz (guardar, desactivar...) para mostrar un aviso. */
export interface ActionResult {
    ok: boolean;
    error?: string;
}
