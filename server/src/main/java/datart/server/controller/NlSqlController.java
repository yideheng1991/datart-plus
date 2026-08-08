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

import datart.server.base.dto.NlSqlGenerateResult;
import datart.server.base.dto.ResponseData;
import datart.server.base.params.NlSqlGenerateParam;
import datart.server.service.NlSqlService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "NlSql")
@RestController
@RequestMapping("/views/nl-sql")
public class NlSqlController extends BaseController {

    private final NlSqlService nlSqlService;

    public NlSqlController(NlSqlService nlSqlService) {
        this.nlSqlService = nlSqlService;
    }

    @Operation(summary = "generate SQL from natural language")
    @PostMapping("/generate")
    public ResponseData<NlSqlGenerateResult> generate(
            @Validated @RequestBody NlSqlGenerateParam param) {
        return ResponseData.success(nlSqlService.generate(param));
    }
}
