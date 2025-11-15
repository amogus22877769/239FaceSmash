package com.backend.hackathon.auth;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Component
public class TelegramAuthFilter implements Filter {

    // add token to application.properties

    // @Value("${token}")
    private static String BOT_TOKEN;

    private static final List<String> SWAGGER_WHITELIST = List.of(
            "/swagger-ui",
            "/swagger-ui.html",
            "/swagger-ui/",
            "/v3/api-docs",
            "/v3/api-docs/",
            "/swagger-resources",
            "/swagger-resources/",
            "/webjars/"
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod()) || isSwaggerPath(path)) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("tma ")) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("Unauthorized: missing or invalid Authorization header");
            return;
        }

        String initData = authHeader.substring(4);
        if (!isTelegramDataValid(initData)) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("Unauthorized: invalid Telegram initData");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isSwaggerPath(String path) {
        return SWAGGER_WHITELIST.stream().anyMatch(path::startsWith);
    }

    private boolean isTelegramDataValid(String initData) {

        // ONLY FOR DEV!!!!!
        // ENABLE IN PRODUCTION!!!!!

//        try {
//            Map<String, String> params = new HashMap<>();
//            String[] pairs = initData.split("&");
//            for (String pair : pairs) {
//                int idx = pair.indexOf("=");
//                if (idx != -1) {
//                    String key = pair.substring(0, idx);
//                    String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
//                    params.put(key, value);
//                }
//            }
//
//            String hash = params.get("hash");
//            if (hash == null) return false;
//            params.remove("hash");
//
//            List<String> dataCheckList = new ArrayList<>();
//            params.keySet().stream().sorted().forEach(k -> dataCheckList.add(k + "=" + params.get(k)));
//            String dataCheckString = String.join("\n", dataCheckList);
//
//            MessageDigest digest = MessageDigest.getInstance("SHA-256");
//            byte[] secretKey = digest.digest(BOT_TOKEN.getBytes(StandardCharsets.UTF_8));
//
//            Mac mac = Mac.getInstance("HmacSHA256");
//            mac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
//            byte[] hmacBytes = mac.doFinal(dataCheckString.getBytes(StandardCharsets.UTF_8));
//
//            String computedHash = bytesToHex(hmacBytes);
//
//            return MessageDigest.isEqual(computedHash.getBytes(), hash.getBytes());
//        } catch (Exception e) {
//            e.printStackTrace();
//            return false;
//        }
        return true;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static Long getTelegramId(HttpServletRequest request) {
        String authHeader = request.getHeader("authorization");
        if (authHeader == null || !authHeader.startsWith("tma ")) return null;

        String initData = authHeader.substring(4);
        String[] parts = initData.split("&");

        for (String part : parts) {
            if (part.startsWith("user=")) {
                String json = URLDecoder.decode(part.substring(5), StandardCharsets.UTF_8);
                int idStart = json.indexOf("\"id\":");
                if (idStart != -1) {
                    int commaIndex = json.indexOf(",", idStart);
                    String idStr = (commaIndex != -1)
                            ? json.substring(idStart + 5, commaIndex)
                            : json.substring(idStart + 5, json.indexOf("}", idStart));
                    try {
                        System.out.println(Integer.valueOf(idStr.trim()));
                        return Long.valueOf(idStr.trim());
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return null;
    }
}
