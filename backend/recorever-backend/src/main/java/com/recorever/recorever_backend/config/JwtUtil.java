package com.recorever.recorever_backend.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

  private static final String secret = 
      "my_super_secret_key_which_is_at_least_32_chars!";
  private final long expiration = 3600000; // 1 hour in milliseconds

  private Key getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  public String generateToken(int userId, String userName) {
    return Jwts.builder()
        .setSubject(String.valueOf(userId))
        .claim("name", userName)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public int getUserIdFromToken(String token) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
    return Integer.parseInt(claims.getSubject());
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(getSigningKey())
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (JwtException e) {
      System.out.println("JWT validation error: " + e.getMessage());
    }
    return false;
  }
}