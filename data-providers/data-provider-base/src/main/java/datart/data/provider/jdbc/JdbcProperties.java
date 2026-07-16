/*
 * Datart
 * <p>
 * Copyright 2021
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package datart.data.provider.jdbc;

import datart.core.base.exception.Exceptions;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

import javax.validation.constraints.NotBlank;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

@Data
public class JdbcProperties {

    @NotBlank
    private String dbType;

    @NotBlank
    private String url;

    private String user;

    private String password;

    @NotBlank
    private String driverClass;

    private Properties properties;

    private boolean enableSpecialSql;

    /**
     * Allow-listed H2 JDBC URL / Properties parameters.
     * Only these parameters are permitted for H2 connections.
     */
    private static final Set<String> H2_ALLOWED_PARAMS = new HashSet<>();

    static {
        // Connection mode & compatibility
        H2_ALLOWED_PARAMS.add("MODE");
        H2_ALLOWED_PARAMS.add("DATABASE_TO_LOWER");
        H2_ALLOWED_PARAMS.add("IGNORECASE");
        H2_ALLOWED_PARAMS.add("CASE_INSENSITIVE_IDENTIFIERS");

        // Database existence & lifecycle
        H2_ALLOWED_PARAMS.add("IFEXISTS");
        H2_ALLOWED_PARAMS.add("DB_CLOSE_DELAY");
        H2_ALLOWED_PARAMS.add("DB_CLOSE_ON_EXIT");

        // Server mode (restricted usage)
        H2_ALLOWED_PARAMS.add("AUTO_SERVER");
        H2_ALLOWED_PARAMS.add("AUTO_SERVER_PORT");

        // Lock & concurrency
        H2_ALLOWED_PARAMS.add("LOCK_TIMEOUT");
        H2_ALLOWED_PARAMS.add("MVCC");

        // Logging / tracing
        H2_ALLOWED_PARAMS.add("LOG");
        H2_ALLOWED_PARAMS.add("TRACE_LEVEL_SYSTEM_OUT");
        H2_ALLOWED_PARAMS.add("TRACE_LEVEL_FILE");

        // Security (safe subset only)
        H2_ALLOWED_PARAMS.add("CIPHER");
        H2_ALLOWED_PARAMS.add("FILE_LOCK");

        // Storage & performance
        H2_ALLOWED_PARAMS.add("COMPRESS");
        H2_ALLOWED_PARAMS.add("PAGE_SIZE");
        H2_ALLOWED_PARAMS.add("MAX_MEMORY_ROWS");
        H2_ALLOWED_PARAMS.add("MAX_LENGTH_INPLACE_LOB");
        H2_ALLOWED_PARAMS.add("MAX_FILE_SIZE");
        H2_ALLOWED_PARAMS.add("CACHE_TYPE");
        H2_ALLOWED_PARAMS.add("CACHE_SIZE");
        H2_ALLOWED_PARAMS.add("WRITE_DELAY");
        H2_ALLOWED_PARAMS.add("WRITE_DELAY_MULTIPLIER");

        // Query behavior
        H2_ALLOWED_PARAMS.add("QUERY_TIMEOUT");
        H2_ALLOWED_PARAMS.add("THROTTLE");
        H2_ALLOWED_PARAMS.add("OPTIMIZE_REUSE_RESULTS");
        H2_ALLOWED_PARAMS.add("RESULT_SET_MAX_MEMORY_ROWS");
        H2_ALLOWED_PARAMS.add("MAX_CACHED_RESULT_SIZE");
        H2_ALLOWED_PARAMS.add("QUERY_MEMORY_MAX");

        // Misc
        H2_ALLOWED_PARAMS.add("READ_ONLY");
        H2_ALLOWED_PARAMS.add("RECOVER");
        H2_ALLOWED_PARAMS.add("ACCESS_MODE_DATA");
        H2_ALLOWED_PARAMS.add("USE_DEFRAGMENTATION");
        H2_ALLOWED_PARAMS.add("REMOVE_DELAY");
        H2_ALLOWED_PARAMS.add("STORAGE_ENGINE");

        // Network (if needed, restrict in production)
        H2_ALLOWED_PARAMS.add("TCP_PORT");
        H2_ALLOWED_PARAMS.add("SSL");
        H2_ALLOWED_PARAMS.add("SSL_KEY");
        H2_ALLOWED_PARAMS.add("SSL_CERT");
        H2_ALLOWED_PARAMS.add("SSL_TRUSTSTORE");
        H2_ALLOWED_PARAMS.add("SSL_TRUSTSTORE_PASSWORD");

        // Authentication
        H2_ALLOWED_PARAMS.add("USER");
        H2_ALLOWED_PARAMS.add("PASSWORD");
        H2_ALLOWED_PARAMS.add("ALLOW_TO_LOGIN");

        /*
         * Explicitly excluded dangerous parameters:
         * - INIT
         * - RUNSCRIPT
         * - ALLOW_NATIVE_FUNCTIONS
         * - ALLOW_LITERALS_NONE
         * - DATABASE_EVENT_LISTENER
         */
    }

    /**
     * Unified validation entry point.
     * Call this method instead of validateUrl().
     */
    public void validate() {
        validateUrl();
        validateProperties();
    }

    private void validateUrl() {
        if (StringUtils.isBlank(url)) {
            return;
        }

        String lowerUrl = url.toLowerCase();
        if (!lowerUrl.startsWith("jdbc:h2:")) {
            return;
        }

        // Prevent remote TCP / SSL H2 usage unless explicitly required
        if (lowerUrl.startsWith("jdbc:h2:tcp:") || lowerUrl.startsWith("jdbc:h2:ssl:")) {
            Exceptions.msg("H2 remote TCP/SSL connections are not allowed");
        }

        // Parse URL parameters
        int paramStart = url.indexOf(';');
        if (paramStart < 0) {
            return;
        }

        String params = url.substring(paramStart);
        String[] paramPairs = params.split(";");
        for (String paramPair : paramPairs) {
            if (StringUtils.isBlank(paramPair)) {
                continue;
            }
            int eqIndex = paramPair.indexOf('=');
            String paramKey = (eqIndex > 0 ? paramPair.substring(0, eqIndex) : paramPair)
                    .trim()
                    .toUpperCase();

            if (!H2_ALLOWED_PARAMS.contains(paramKey)) {
                Exceptions.msg("H2 URL parameter '" + paramKey + "' is not allowed");
            }
        }
    }

    private void validateProperties() {
        if (properties == null || properties.isEmpty()) {
            return;
        }
        for (String key : properties.stringPropertyNames()) {
            if (!H2_ALLOWED_PARAMS.contains(key.toUpperCase())) {
                Exceptions.msg("H2 property '" + key + "' is not allowed");
            }
        }
    }

    @Override
    public String toString() {
        return "JdbcConnectionProperties{" +
                "dbType='" + dbType + '\'' +
                ", url='" + url + '\'' +
                ", user='" + user + '\'' +
                ", password='" + password + '\'' +
                '}';
    }
}