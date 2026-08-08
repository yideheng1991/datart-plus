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

import datart.core.entity.RelVariableSubject;
import datart.core.entity.Variable;
import datart.security.base.SubjectType;
import datart.server.base.dto.ResponseData;
import datart.server.base.params.CheckNameParam;
import datart.server.base.params.VariableCreateParam;
import datart.server.base.params.VariableRelUpdateParam;
import datart.server.base.params.VariableUpdateParam;
import datart.server.service.VariableService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;


@Tag(name = "Variable")
@Slf4j
@RestController
@RequestMapping(value = "/variables")
public class VariableController extends BaseController {

    private final VariableService variableService;

    public VariableController(VariableService variableService) {
        this.variableService = variableService;
    }

    @Operation(summary = "check variable name")
    @PostMapping(value = "/check/name")
    public ResponseData<Boolean> checkName(@Validated @RequestBody CheckNameParam param) {
        return ResponseData.success(variableService.checkUnique(param.getOrgId(), null, param.getName()));
    }

    @Operation(summary = "list org variables")
    @GetMapping(value = "/org")
    public ResponseData<List<Variable>> listOrgVariables(@RequestParam String orgId) {
        return ResponseData.success(variableService.listOrgVariables(orgId));
    }

    @Operation(summary = "list view variables")
    @GetMapping(value = "/view")
    public ResponseData<List<Variable>> listViewVariables(@RequestParam String viewId) {
        return ResponseData.success(variableService.listByView(viewId));
    }

    @Operation(summary = "create a variable")
    @PostMapping()
    public ResponseData<Variable> create(@RequestBody VariableCreateParam createParam) {
        return ResponseData.success(variableService.create(createParam));
    }

    @Operation(summary = "delete variables")
    @DeleteMapping()
    public ResponseData<Boolean> deleteVariables(@RequestParam Set<String> variables) {
        return ResponseData.success(variableService.deleteByIds(variables));
    }

    @Operation(summary = "update variables")
    @PutMapping()
    public ResponseData<Boolean> updateVariables(@RequestBody List<VariableUpdateParam> updateParams) {
        return ResponseData.success(variableService.batchUpdate(updateParams));
    }

    @Operation(summary = "update variables rels")
    @PutMapping(value = "/rel")
    public ResponseData<Boolean> updateVariableRel(@RequestBody VariableRelUpdateParam updateParam) {
        return ResponseData.success(variableService.updateRels(updateParam));
    }

    @Operation(summary = "list subject variable values")
    @GetMapping(value = "/subject/value")
    public ResponseData<List<RelVariableSubject>> getSubjectVariableValues(@RequestParam String orgId,
                                                                           @RequestParam SubjectType subjectType,
                                                                           @RequestParam String subjectId) {
        return ResponseData.success(variableService.listSubjectValues(subjectType, subjectId, orgId));
    }

    @Operation(summary = "list variable values")
    @GetMapping(value = "/value")
    public ResponseData<List<RelVariableSubject>> getSubjectVariableValues(@RequestParam String variableId) {
        return ResponseData.success(variableService.listVariableValues(variableId));
    }

}