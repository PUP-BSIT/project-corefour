package com.recorever.recorever_backend.config;

import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

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
                        user.getAuthorities() 
                );

          authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
          );

          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      } else {
          response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
          return; 
      }
    } catch (Exception e) {
      System.err.println("JWT processing failed: " + e.getMessage());
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token format");
      return; 
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
      String path = request.getServletPath();
      
      boolean isPublicApi = path.matches("^/api/(login-user|register-user|refresh-token)/?$");
      boolean isErrorPath = path.equals("/error"); 
      
      return isPublicApi || isErrorPath;
  }
}