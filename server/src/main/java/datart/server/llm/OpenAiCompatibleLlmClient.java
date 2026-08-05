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

package datart.server.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import datart.core.base.exception.BaseException;
import datart.core.entity.LlmConfig;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class OpenAiCompatibleLlmClient implements LlmClient {

    private static final MediaType JSON_MEDIA_TYPE =
            MediaType.parse("application/json; charset=utf-8");

    private static final int ERROR_BODY_LIMIT = 500;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build();

    @Override
    public String chat(LlmConfig config, String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", config.getModel());
            payload.put("temperature", config.getTemperature());
            payload.put("max_tokens", config.getMaxTokens());
            payload.put("messages", Arrays.asList(
                    message("system", systemPrompt),
                    message("user", userPrompt)
            ));

            Request request = new Request.Builder()
                    .url(chatCompletionsUrl(config.getApiBaseUrl()))
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .header("Content-Type", JSON_MEDIA_TYPE.toString())
                    .post(RequestBody.create(
                            JSON_MEDIA_TYPE,
                            objectMapper.writeValueAsString(payload)
                    ))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                ResponseBody responseBody = response.body();
                String body = responseBody == null ? "" : responseBody.string();
                if (!response.isSuccessful()) {
                    throw new BaseException(
                            "LLM request failed with HTTP " + response.code() + ": "
                                    + abbreviate(body)
                    );
                }
                JsonNode root = objectMapper.readTree(body);
                JsonNode content = root.path("choices").path(0).path("message").path("content");
                if (!content.isTextual() || content.asText().trim().isEmpty()) {
                    throw new BaseException("LLM response does not contain message content");
                }
                return content.asText();
            }
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            throw new BaseException("LLM request failed: " + e.getMessage(), e);
        }
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String chatCompletionsUrl(String baseUrl) {
        String normalized = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        return normalized.endsWith("/chat/completions")
                ? normalized
                : normalized + "/chat/completions";
    }

    private String abbreviate(String body) {
        if (body == null || body.length() <= ERROR_BODY_LIMIT) {
            return body;
        }
        return body.substring(0, ERROR_BODY_LIMIT);
    }
}
