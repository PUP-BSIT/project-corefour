package com.recorever.recorever_backend.config;

import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  @Autowired
  private JwtUtil jwtUtil;

  @Autowired
  private UserRepository repo;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
        throws ServletException, IOException {

    String headerAuth = request.getHeader("Authorization");

    if (headerAuth == null || !headerAuth.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = headerAuth.substring(7);

    try {
      if (jwtUtil.validateToken(token)) {
        int userId = jwtUtil.getUserIdFromToken(token);
        User user = repo.findById(userId);

        if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
          UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("USER"))
                );

          authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
          );

          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      }
    } catch (Exception e) {
        System.err.println("JWT validation failed: " + e.getMessage());
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
      String path = request.getServletPath();
      System.out.println("Filtering request path: " + path);

      return path.matches("^/api/(login-user|register-user|refresh-token)/?$");
  }
}