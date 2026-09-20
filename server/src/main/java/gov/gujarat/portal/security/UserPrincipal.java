package gov.gujarat.portal.security;

import gov.gujarat.portal.entity.Family;
import gov.gujarat.portal.entity.Member;
import gov.gujarat.portal.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final User user;
    private final Member member;
    private final Family family;

    public UserPrincipal(User user, Member member, Family family) {
        this.user = user;
        this.member = member;
        this.family = family;
    }

    public User getUser() {
        return user;
    }

    public Member getMember() {
        return member;
    }

    public Family getFamily() {
        return family;
    }

    public Long getUserId() {
        return user.getId();
    }

    public String getMobile() {
        return user.getMobile();
    }

    public String getRole() {
        return user.getRole();
    }

    public Long getDepartmentId() {
        return user.getDepartmentId();
    }

    public Long getMemberId() {
        return member != null ? member.getId() : null;
    }

    public Long getFamilyId() {
        return family != null ? family.getId() : null;
    }

    public String getFamilyRole() {
        return member != null ? member.getFamilyRole() : null;
    }

    public String getAccess() {
        return member != null ? member.getAccess() : null;
    }

    public boolean isHead() {
        return "head".equalsIgnoreCase(getFamilyRole());
    }

    public boolean canApply() {
        return isHead() || "apply".equalsIgnoreCase(getAccess());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = "ROLE_" + (user.getRole() != null ? user.getRole().toUpperCase() : "CITIZEN");
        return List.of(new SimpleGrantedAuthority(roleName));
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return user.getMobile();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
