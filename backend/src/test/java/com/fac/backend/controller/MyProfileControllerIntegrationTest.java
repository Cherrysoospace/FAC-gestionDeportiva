package com.fac.backend.controller;

import com.fac.backend.entity.User;
import com.fac.backend.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HU-SE-02 contra la base H2 y la seguridad real: el propietario gestiona su
 * perfil, otro usuario no puede ver el ajeno y el administrador sí.
 */
@SpringBootTest
@AutoConfigureMockMvc
class MyProfileControllerIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void ownerManagesOwnProfileAndPhoto() throws Exception {
        createLocalUser("perfil.dueno@uc.edu.co");
        String token = login("perfil.dueno@uc.edu.co", "Clave123!");

        mockMvc.perform(get("/api/profile/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("perfil.dueno@uc.edu.co"))
                .andExpect(jsonPath("$.phone").doesNotExist());

        mockMvc.perform(put("/api/profile/me")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"3001234567\",\"birthDate\":\"2000-05-20\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("3001234567"))
                .andExpect(jsonPath("$.birthDate").value("2000-05-20"));

        String body = mockMvc.perform(photoUpload(PNG).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photoUrl", startsWith("/api/profile/photos/")))
                .andExpect(jsonPath("$.phone").value("3001234567"))
                .andReturn().getResponse().getContentAsString();

        String photoUrl = JsonPath.read(body, "$.photoUrl");
        mockMvc.perform(get(photoUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(PNG));
    }

    @Test
    void uploadRejectsFilesThatAreNotImages() throws Exception {
        createLocalUser("perfil.texto@uc.edu.co");
        String token = login("perfil.texto@uc.edu.co", "Clave123!");

        mockMvc.perform(photoUpload("hola".getBytes()).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCase").value("INVALID_OPERATION"));
    }

    @Test
    void userCannotReadAnotherUsersProfileButAdminCan() throws Exception {
        User owner = createLocalUser("perfil.ajeno@uc.edu.co");
        createLocalUser("perfil.curioso@uc.edu.co");
        String ownerToken = login("perfil.ajeno@uc.edu.co", "Clave123!");
        String otherToken = login("perfil.curioso@uc.edu.co", "Clave123!");
        String adminToken = login("admin@uc.edu.co", "Admin123!");

        mockMvc.perform(put("/api/profile/me")
                        .header(HttpHeaders.AUTHORIZATION, ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"3109876543\"}"))
                .andExpect(status().isOk());

        String ownerProfile = "/api/users/" + owner.getId() + "/profile";

        mockMvc.perform(get(ownerProfile).header(HttpHeaders.AUTHORIZATION, otherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(ownerProfile).header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("3109876543"));
    }

    @Test
    void ownProfileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/profile/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void photoEndpointReturns404ForUnknownOrMaliciousNames() throws Exception {
        mockMvc.perform(get("/api/profile/photos/no-existe.png"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/profile/photos/..%2F..%2Fapplication.properties"))
                .andExpect(status().is4xxClientError());
    }

    private User createLocalUser(String email) {
        User user = new User();
        user.setName("Perfil");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("Clave123!"));
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.accessToken");
    }

    private org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder photoUpload(byte[] content) {
        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", content);
        org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder builder =
                multipart(HttpMethod.PUT, "/api/profile/me/photo");
        builder.file(file);
        return builder;
    }
}
