/**
 * Redirige al usuario a Discord para autorizar la app. Sirve tanto para
 * iniciar sesión como para registrarse: el backend crea la cuenta si no existe.
 * Devuelve un mensaje de error si no se pudo iniciar el flujo.
 */
export function startDiscordAuth(nextPath = '/'): string | null {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    if (!clientId) {
        return 'Falta NEXT_PUBLIC_DISCORD_CLIENT_ID';
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem('discordOAuthState', state);
    sessionStorage.setItem('discordOAuthNext', nextPath);

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify email',
        state
    });

    window.location.href = `https://discord.com/oauth2/authorize?${params}`;
    return null;
}
