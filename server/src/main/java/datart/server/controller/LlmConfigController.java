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

package datart.server.controller;

import datart.server.base.dto.LlmConfigDTO;
import datart.server.base.dto.ResponseData;
import datart.server.base.params.LlmConfigParam;
import datart.server.service.LlmConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "LlmConfig")
@RestController
@RequestMapping("/llm/configs")
public class LlmConfigController extends BaseController {

    private final LlmConfigService llmConfigService;

    public LlmConfigController(LlmConfigService llmConfigService) {
        this.llmConfigService = llmConfigService;
    }

    @Operation(summary = "list LLM configurations")
    @GetMapping
    public ResponseData<List<LlmConfigDTO>> list(@RequestParam String orgId) {
        checkBlank(orgId, "orgId");
        return ResponseData.success(llmConfigService.list(orgId));
    }

    @Operation(summary = "create an LLM configuration")
    @PostMapping
    public ResponseData<LlmConfigDTO> create(
            @Validated @RequestBody LlmConfigParam param) {
        return ResponseData.success(llmConfigService.create(param));
    }

    @Operation(summary = "update an LLM configuration")
    @PutMapping("/{id}")
    public ResponseData<LlmConfigDTO> update(
            @PathVariable String id,
            @Validated @RequestBody LlmConfigParam param) {
        checkBlank(id, "id");
        return ResponseData.success(llmConfigService.update(id, param));
    }

    @Operation(summary = "delete an LLM configuration")
    @DeleteMapping("/{id}")
    public ResponseData<Boolean> delete(@PathVariable String id) {
        checkBlank(id, "id");
        return ResponseData.success(llmConfigService.delete(id));
    }

    @Operation(summary = "activate an LLM configuration")
    @PostMapping("/{id}/activate")
    public ResponseData<Boolean> activate(@PathVariable String id) {
        checkBlank(id, "id");
        return ResponseData.success(llmConfigService.activate(id));
    }

    @Operation(summary = "test an LLM configuration")
    @PostMapping("/{id}/test")
    public ResponseData<Boolean> testConnection(@PathVariable String id) {
        checkBlank(id, "id");
        return ResponseData.success(llmConfigService.testConnection(id));
    }
}
