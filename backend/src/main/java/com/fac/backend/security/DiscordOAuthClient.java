package com.fac.backend.security;

import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * Estrategia OAuth 2.0 para Discord: intercambia el code por un access token
 * en el backend y consulta la identidad del usuario.
 */
@Component
public class DiscordOAuthClient implements OAuthCodeProviderStrategy {

    public static final String PROVIDER_ID = "discord";
    private static final String TOKEN_URL = "https://discord.com/api/oauth2/token";
    private static final String USER_URL = "https://discord.com/api/users/@me";

    private final String clientId;
    private final String clientSecret;
    private final List<String> allowedRedirectUris;
    private final RestClient restClient;

    @Autowired
    public DiscordOAuthClient(
            @Value("${discord.client-id:}") String clientId,
            @Value("${discord.client-secret:}") String clientSecret,
            @Value("${discord.allowed-redirect-uris:http://localhost:3000/auth/discord/callback}")
            List<String> allowedRedirectUris) {
        this(clientId, clientSecret, allowedRedirectUris, RestClient.create());
    }

    DiscordOAuthClient(
            String clientId,
            String clientSecret,
            List<String> allowedRedirectUris,
            RestClient restClient) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.allowedRedirectUris = allowedRedirectUris;
        this.restClient = restClient;
    }

    @Override
    public boolean supports(String provider) {
        return PROVIDER_ID.equalsIgnoreCase(provider);
    }

    @Override
    @SuppressWarnings("unchecked")
    public FirebaseIdentity authenticate(String code, String redirectUri) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new ApplicationException(
                    ErrorCase.UNAUTHORIZED,
                    "Discord OAuth no está configurado en el servidor");
        }
        if (!allowedRedirectUris.contains(redirectUri)) {
            throw new ApplicationException(
                    ErrorCase.UNAUTHORIZED, "redirectUri no permitido");
        }

        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("client_id", clientId);
            form.add("client_secret", clientSecret);
            form.add("grant_type", "authorization_code");
            form.add("code", code);
            form.add("redirect_uri", redirectUri);

            Map<String, Object> token = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            String accessToken = token == null
                    ? null : (String) token.get("access_token");
            if (accessToken == null) {
                throw invalid();
            }

            Map<String, Object> user = restClient.get()
                    .uri(USER_URL)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (user == null || user.get("id") == null) {
                throw invalid();
            }

            String email = (String) user.get("email");
            if (email == null || email.isBlank()
                    || !Boolean.TRUE.equals(user.get("verified"))) {
                throw new ApplicationException(
                        ErrorCase.UNAUTHORIZED,
                        "La cuenta de Discord debe tener un correo verificado");
            }

            String id = String.valueOf(user.get("id"));
            String name = user.get("global_name") != null
                    ? (String) user.get("global_name")
                    : (String) user.get("username");
            String avatar = user.get("avatar") == null ? null
                    : "https://cdn.discordapp.com/avatars/" + id + "/"
                            + user.get("avatar") + ".png";

            return new FirebaseIdentity(PROVIDER_ID, id, email, name, avatar);
        } catch (ApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw invalid();
        }
    }

    private ApplicationException invalid() {
        return new ApplicationException(
                ErrorCase.UNAUTHORIZED, "No se pudo autenticar con Discord");
    }
}
