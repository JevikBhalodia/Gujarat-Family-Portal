package gov.gujarat.portal.controller;

import gov.gujarat.portal.entity.User;
import gov.gujarat.portal.repository.UserRepository;
import gov.gujarat.portal.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final Map<String, String> mockOtpStore = new ConcurrentHashMap<>();

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public static class OtpRequest {
        public String mobile;
    }

    public static class VerifyRequest {
        public String mobile;
        public String otp;
    }

    @PostMapping("/otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        if (request == null || request.mobile == null || !request.mobile.trim().matches("^\\d{10}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid 10-digit mobile number."));
        }

        String cleanMobile = request.mobile.trim();
        String otp = "123456";
        mockOtpStore.put(cleanMobile, otp);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("OTP sent successfully to %s. (Demo OTP: 123456)", cleanMobile)
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyRequest request, HttpServletResponse response) {
        if (request == null || request.mobile == null || request.otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mobile and OTP are required."));
        }

        String cleanMobile = request.mobile.trim();
        String storedOtp = mockOtpStore.get(cleanMobile);

        if (!"123456".equals(request.otp.trim()) && !request.otp.trim().equals(storedOtp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP. For demo, use 123456."));
        }

        User user = userRepository.findByMobile(cleanMobile).orElseGet(() -> {
            User newUser = new User(cleanMobile, "citizen");
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getId(), user.getMobile(), user.getRole(), user.getDepartmentId());

        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // allow http in local dev
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("mobile", user.getMobile());
        userData.put("role", user.getRole());
        userData.put("departmentId", user.getDepartmentId());
        userData.put("memberId", user.getMemberId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "user", userData
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully."));
    }
}
