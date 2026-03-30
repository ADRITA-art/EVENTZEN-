package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.service.UserService;
import com.adrita.eventzen.util.PaginationUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) Integer page,
                                         @RequestParam(required = false) Integer size) {
        List<UserProfileResponse> users = userService.getAllUsers();
        if (page == null && size == null) {
            return ResponseEntity.ok(users);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(users, page, size));
    }
}
