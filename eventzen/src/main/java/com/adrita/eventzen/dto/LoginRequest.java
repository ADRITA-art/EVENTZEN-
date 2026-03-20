package com.adrita.eventzen.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank @Email private String email;
    @NotBlank private String password;

    public LoginRequest() {}
    public String getEmail()    { return email; }
    public void setEmail(String e) { this.email = e; }
    public String getPassword()    { return password; }
    public void setPassword(String p) { this.password = p; }
}