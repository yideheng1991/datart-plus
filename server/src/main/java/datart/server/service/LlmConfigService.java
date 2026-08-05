package datart.server.service;

import datart.core.entity.LlmConfig;
import datart.server.base.dto.LlmConfigDTO;
import datart.server.base.params.LlmConfigParam;

import java.util.List;

public interface LlmConfigService {

    List<LlmConfigDTO> list(String orgId);

    LlmConfigDTO create(LlmConfigParam param);

    LlmConfigDTO update(String id, LlmConfigParam param);

    boolean delete(String id);

    boolean activate(String id);

    boolean testConnection(String id);

    LlmConfig getActiveConfig(String orgId);
}
