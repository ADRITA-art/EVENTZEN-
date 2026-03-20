package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.ChangePasswordRequest;
import com.adrita.eventzen.dto.LoginRequest;
import com.adrita.eventzen.dto.RegisterRequest;
import com.adrita.eventzen.dto.UpdateProfileRequest;
import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.entity.User;

import java.util.List;

public interface UserService {

    String register(RegisterRequest request);

    User login(LoginRequest request);

    UserProfileResponse getProfile(String email);

    List<UserProfileResponse> getAllUsers();

    void changePassword(String email, ChangePasswordRequest request);

    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);

    UserProfileResponse getUserById(Long id);

    void deleteUserById(Long id);
}