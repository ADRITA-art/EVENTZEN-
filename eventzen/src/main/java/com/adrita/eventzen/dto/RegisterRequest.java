package com.adrita.eventzen.dto;
import com.adrita.eventzen.entity.Role;
import jakarta.validation.constraints.*;

public class RegisterRequest {
    @NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank @Size(min=6) private String password;
    @NotNull private Role role;

    public RegisterRequest() {}
    public String getName()    { return name; }
    public void setName(String n) { this.name = n; }
    public String getEmail()   { return email; }
    public void setEmail(String e) { this.email = e; }
    public String getPassword()    { return password; }
    public void setPassword(String p) { this.password = p; }
    public Role getRole()      { return role; }
    public void setRole(Role r) { this.role = r; }
}