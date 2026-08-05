package datart.server.llm;

import datart.core.entity.LlmConfig;

public interface LlmClient {

    String chat(LlmConfig config, String systemPrompt, String userPrompt);

    default boolean testConnection(LlmConfig config) {
        String result = chat(
                config,
                "You are a connectivity test. Reply with OK only.",
                "OK"
        );
        return result != null && !result.trim().isEmpty();
    }
}
