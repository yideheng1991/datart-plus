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

package datart.server.service.impl;

import datart.core.base.consts.Const;
import datart.core.base.exception.BaseException;
import datart.core.base.exception.ParamException;
import datart.core.common.UUIDGenerator;
import datart.core.entity.LlmConfig;
import datart.core.mappers.LlmConfigMapper;
import datart.security.util.AESUtil;
import datart.server.base.dto.LlmConfigDTO;
import datart.server.base.params.LlmConfigParam;
import datart.server.llm.LlmClient;
import datart.server.service.BaseService;
import datart.server.service.LlmConfigService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LlmConfigServiceImpl extends BaseService implements LlmConfigService {

    private static final Map<String, String> DEFAULT_BASE_URLS = new LinkedHashMap<>();

    static {
        DEFAULT_BASE_URLS.put("OPENAI", "https://api.openai.com/v1");
        DEFAULT_BASE_URLS.put("DOUBAO", "https://ark.cn-beijing.volces.com/api/v3");
        DEFAULT_BASE_URLS.put(
                "DASHSCOPE",
                "https://dashscope.aliyuncs.com/compatible-mode/v1"
        );
        DEFAULT_BASE_URLS.put("CUSTOM", null);
    }

    private final LlmConfigMapper llmConfigMapper;

    private final LlmClient llmClient;

    public LlmConfigServiceImpl(LlmConfigMapper llmConfigMapper, LlmClient llmClient) {
        this.llmConfigMapper = llmConfigMapper;
        this.llmClient = llmClient;
    }

    @Override
    public List<LlmConfigDTO> list(String orgId) {
        securityManager.requireOrgOwner(orgId);
        return llmConfigMapper.listByOrg(orgId)
                .stream()
                .map(LlmConfigDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LlmConfigDTO create(LlmConfigParam param) {
        securityManager.requireOrgOwner(param.getOrgId());
        if (StringUtils.isBlank(param.getApiKey())) {
            throw new ParamException("API Key cannot be empty");
        }

        LlmConfig config = new LlmConfig();
        config.setId(UUIDGenerator.generate());
        config.setOrgId(param.getOrgId());
        applyParam(config, param);
        config.setApiKey(encryptApiKey(param.getApiKey()));
        config.setCreateBy(getCurrentUser().getId());
        config.setCreateTime(new Date());

        if (Boolean.TRUE.equals(config.getActive())) {
            llmConfigMapper.deactivateByOrg(config.getOrgId());
        }
        llmConfigMapper.insert(config);
        return LlmConfigDTO.from(config);
    }

    @Override
    @Transactional
    public LlmConfigDTO update(String id, LlmConfigParam param) {
        LlmConfig config = requireConfig(id);
        securityManager.requireOrgOwner(config.getOrgId());
        if (!config.getOrgId().equals(param.getOrgId())) {
            throw new ParamException("Organization cannot be changed");
        }

        applyParam(config, param);
        if (StringUtils.isNotBlank(param.getApiKey())) {
            config.setApiKey(encryptApiKey(param.getApiKey()));
        }
        config.setUpdateBy(getCurrentUser().getId());
        config.setUpdateTime(new Date());

        if (Boolean.TRUE.equals(config.getActive())) {
            llmConfigMapper.deactivateByOrg(config.getOrgId());
        }
        llmConfigMapper.update(config);
        return LlmConfigDTO.from(config);
    }

    @Override
    public boolean delete(String id) {
        LlmConfig config = requireConfig(id);
        securityManager.requireOrgOwner(config.getOrgId());
        return llmConfigMapper.delete(id) == 1;
    }

    @Override
    @Transactional
    public boolean activate(String id) {
        LlmConfig config = requireConfig(id);
        securityManager.requireOrgOwner(config.getOrgId());
        llmConfigMapper.deactivateByOrg(config.getOrgId());
        return llmConfigMapper.activate(
                id,
                config.getOrgId(),
                getCurrentUser().getId()
        ) == 1;
    }

    @Override
    public boolean testConnection(String id) {
        LlmConfig config = requireConfig(id);
        securityManager.requireOrgOwner(config.getOrgId());
        return llmClient.testConnection(decryptConfig(config));
    }

    @Override
    public LlmConfig getActiveConfig(String orgId) {
        LlmConfig config = llmConfigMapper.selectActiveByOrg(orgId);
        if (config == null) {
            throw new BaseException("No active LLM configuration for this organization");
        }
        return decryptConfig(config);
    }

    private void applyParam(LlmConfig config, LlmConfigParam param) {
        String provider = param.getProvider().trim().toUpperCase(Locale.ROOT);
        if (!DEFAULT_BASE_URLS.containsKey(provider)) {
            throw new ParamException("Unsupported LLM provider: " + param.getProvider());
        }

        String apiBaseUrl = StringUtils.defaultIfBlank(
                param.getApiBaseUrl(),
                DEFAULT_BASE_URLS.get(provider)
        );
        validateBaseUrl(apiBaseUrl);

        config.setProvider(provider);
        config.setApiBaseUrl(StringUtils.removeEnd(apiBaseUrl.trim(), "/"));
        config.setModel(param.getModel().trim());
        config.setTemperature(param.getTemperature() == null ? 0.3D : param.getTemperature());
        config.setMaxTokens(param.getMaxTokens() == null ? 4096 : param.getMaxTokens());
        String defaultSystemPrompt = StringUtils.trimToNull(
                param.getDefaultSystemPrompt()
        );
        boolean defaultPromptEnabled = Boolean.TRUE.equals(
                param.getDefaultPromptEnabled()
        );
        if (defaultPromptEnabled && defaultSystemPrompt == null) {
            throw new ParamException(
                    "Default prompt cannot be empty when enabled"
            );
        }
        config.setDefaultSystemPrompt(defaultSystemPrompt);
        config.setDefaultPromptEnabled(defaultPromptEnabled);
        config.setActive(param.getActive() == null || param.getActive());
    }

    private void validateBaseUrl(String apiBaseUrl) {
        if (StringUtils.isBlank(apiBaseUrl)) {
            throw new ParamException("API Base URL cannot be empty");
        }
        try {
            URI uri = URI.create(apiBaseUrl);
            if (!"http".equalsIgnoreCase(uri.getScheme())
                    && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new ParamException("API Base URL must use HTTP or HTTPS");
            }
        } catch (IllegalArgumentException e) {
            throw new ParamException("Invalid API Base URL");
        }
    }

    private String encryptApiKey(String apiKey) {
        return Const.ENCRYPT_FLAG + AESUtil.encrypt(apiKey.trim());
    }

    private LlmConfig decryptConfig(LlmConfig source) {
        LlmConfig config = new LlmConfig();
        BeanUtils.copyProperties(source, config);
        try {
            String apiKey = config.getApiKey();
            if (StringUtils.startsWith(apiKey, Const.ENCRYPT_FLAG)) {
                apiKey = AESUtil.decrypt(
                        apiKey.substring(Const.ENCRYPT_FLAG.length())
                );
            }
            config.setApiKey(apiKey);
            return config;
        } catch (Exception e) {
            throw new BaseException("Failed to decrypt LLM API Key", e);
        }
    }

    private LlmConfig requireConfig(String id) {
        LlmConfig config = llmConfigMapper.selectById(id);
        if (config == null) {
            throw new BaseException("LLM configuration does not exist");
        }
        return config;
    }
}
