package com.recorever.recorever_backend.config;

import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
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
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {

    String token = null;

    if (request.getCookies() != null) {
      for (Cookie cookie : request.getCookies()) {
        if ("accessToken".equals(cookie.getName())) {
          token = cookie.getValue();
        }
      }
    }

    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      if (jwtUtil.validateToken(token)) {
        int userId = jwtUtil.getUserIdFromToken(token);
        User user = repo.findByIdAndIsDeletedFalse(userId).orElse(null);

        if (user != null && 
            SecurityContextHolder.getContext().getAuthentication() == null) {

          var auth = new UsernamePasswordAuthenticationToken(
              user, null, user.getAuthorities());

          auth.setDetails(
              new WebAuthenticationDetailsSource().buildDetails(request)
          );

          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } else {
        response.sendError(
            HttpServletResponse.SC_UNAUTHORIZED, 
            "Invalid or expired token"
        );
        return;
      }
    } catch (ExpiredJwtException e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, 
          "Token has expired");
      return;
    } catch (SignatureException e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, 
          "Invalid token signature");
      return;
    } catch (Exception e) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, 
          "Invalid token format");
      return;
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    boolean isPublicApi = path.matches(
        "^/api/(login-user|register-user|refresh-token)/?$"
    );
    boolean isErrorPath = path.equals("/error");
    return isPublicApi || isErrorPath;
  }
}