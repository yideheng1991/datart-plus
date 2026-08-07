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

package datart.server.base.dto;

import datart.core.entity.LlmConfig;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

import java.util.Date;

@Data
public class LlmConfigDTO {

    private String id;

    private String orgId;

    private String provider;

    private String apiBaseUrl;

    private boolean apiKeyConfigured;

    private String model;

    private Double temperature;

    private Integer maxTokens;

    private String defaultSystemPrompt;

    private Boolean defaultPromptEnabled;

    private Boolean active;

    private Date createTime;

    private Date updateTime;

    public static LlmConfigDTO from(LlmConfig config) {
        LlmConfigDTO dto = new LlmConfigDTO();
        dto.setId(config.getId());
        dto.setOrgId(config.getOrgId());
        dto.setProvider(config.getProvider());
        dto.setApiBaseUrl(config.getApiBaseUrl());
        dto.setApiKeyConfigured(StringUtils.isNotBlank(config.getApiKey()));
        dto.setModel(config.getModel());
        dto.setTemperature(config.getTemperature());
        dto.setMaxTokens(config.getMaxTokens());
        dto.setDefaultSystemPrompt(config.getDefaultSystemPrompt());
        dto.setDefaultPromptEnabled(config.getDefaultPromptEnabled());
        dto.setActive(config.getActive());
        dto.setCreateTime(config.getCreateTime());
        dto.setUpdateTime(config.getUpdateTime());
        return dto;
    }
}
