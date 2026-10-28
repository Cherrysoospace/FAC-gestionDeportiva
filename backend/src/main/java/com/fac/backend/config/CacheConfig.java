package com.fac.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String EFFECTIVE_PERMISSIONS_CACHE = "effectivePermissions";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(EFFECTIVE_PERMISSIONS_CACHE);
    }
}
