package datart.core.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LlmConfig extends BaseEntity {

    private String orgId;

    private String provider;

    private String apiBaseUrl;

    private String apiKey;

    private String model;

    private Double temperature;

    private Integer maxTokens;

    private String defaultSystemPrompt;

    private Boolean defaultPromptEnabled;

    private Boolean active;
}
