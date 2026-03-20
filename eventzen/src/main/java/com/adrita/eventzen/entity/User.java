package com.adrita.eventzen.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    public User() {}

    public User(Long id, String name, String email, String password, Role role) {
        this.id = id; this.name = name; this.email = email;
        this.password = password; this.role = role;
    }

    public Long getId()         { return id; }
    public String getName()     { return name; }
    public String getEmail()    { return email; }
    public String getPassword() { return password; }
    public Role getRole()       { return role; }

    public void setId(Long id)           { this.id = id; }
    public void setName(String name)     { this.name = name; }
    public void setEmail(String email)   { this.email = email; }
    public void setPassword(String p)    { this.password = p; }
    public void setRole(Role role)       { this.role = role; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id; private String name, email, password; private Role role;
        public Builder id(Long id)         { this.id = id;       return this; }
        public Builder name(String n)      { this.name = n;      return this; }
        public Builder email(String e)     { this.email = e;     return this; }
        public Builder password(String p)  { this.password = p;  return this; }
        public Builder role(Role r)        { this.role = r;      return this; }
        public User build() { return new User(id, name, email, password, role); }
    }
}