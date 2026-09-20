package gov.gujarat.portal.security;

import gov.gujarat.portal.entity.Family;
import gov.gujarat.portal.entity.Member;
import gov.gujarat.portal.entity.User;
import gov.gujarat.portal.repository.FamilyRepository;
import gov.gujarat.portal.repository.MemberRepository;
import gov.gujarat.portal.repository.UserRepository;
import gov.gujarat.portal.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final FamilyRepository familyRepository;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            MemberRepository memberRepository,
            FamilyRepository familyRepository
    ) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.familyRepository = familyRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtUtil.validateToken(token)) {
            try {
                Long userId = jwtUtil.getUserIdFromToken(token);
                Optional<User> userOpt = userRepository.findById(userId);

                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    Member member = null;
                    Family family = null;

                    if (user.getMemberId() != null) {
                        Optional<Member> memOpt = memberRepository.findById(user.getMemberId());
                        if (memOpt.isPresent() && "active".equalsIgnoreCase(memOpt.get().getStatus())) {
                            member = memOpt.get();
                            family = familyRepository.findById(member.getFamilyId()).orElse(null);
                        }
                    }

                    UserPrincipal principal = new UserPrincipal(user, member, family);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                logger.error("Could not set user authentication in security context", e);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        // 1. Try Cookie 'token'
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        // 2. Try Authorization Bearer Header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}
