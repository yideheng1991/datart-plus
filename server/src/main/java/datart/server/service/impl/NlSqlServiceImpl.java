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

import datart.core.base.exception.BaseException;
import datart.core.data.provider.DataProviderSource;
import datart.core.data.provider.SchemaInfo;
import datart.core.data.provider.SchemaItem;
import datart.core.data.provider.TableInfo;
import datart.core.entity.LlmConfig;
import datart.core.entity.Source;
import datart.data.provider.calcite.SqlValidateUtils;
import datart.data.provider.jdbc.SqlSplitter;
import datart.server.base.dto.NlSqlGenerateResult;
import datart.server.base.params.NlSqlGenerateParam;
import datart.server.base.params.NlSqlTableParam;
import datart.server.llm.LlmClient;
import datart.server.llm.NlSqlPromptBuilder;
import datart.server.service.DataProviderService;
import datart.server.service.LlmConfigService;
import datart.server.service.NlSqlService;
import datart.server.service.SourceService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class NlSqlServiceImpl implements NlSqlService {

    private static final String JDBC_PROVIDER_TYPE = "JDBC";

    private static final Pattern SQL_CODE_BLOCK = Pattern.compile(
            "```(?:sql)?\\s*([\\s\\S]*?)```",
            Pattern.CASE_INSENSITIVE
    );

    private final SourceService sourceService;

    private final DataProviderService dataProviderService;

    private final LlmConfigService llmConfigService;

    private final LlmClient llmClient;

    private final NlSqlPromptBuilder promptBuilder;

    public NlSqlServiceImpl(SourceService sourceService,
                            DataProviderService dataProviderService,
                            LlmConfigService llmConfigService,
                            LlmClient llmClient,
                            NlSqlPromptBuilder promptBuilder) {
        this.sourceService = sourceService;
        this.dataProviderService = dataProviderService;
        this.llmConfigService = llmConfigService;
        this.llmClient = llmClient;
        this.promptBuilder = promptBuilder;
    }

    @Override
    public NlSqlGenerateResult generate(NlSqlGenerateParam param) {
        Source source = sourceService.retrieve(param.getSourceId());
        if (Boolean.TRUE.equals(source.getIsFolder())) {
            throw new BaseException("A folder cannot be used as an NL2SQL data source");
        }
        if (!JDBC_PROVIDER_TYPE.equalsIgnoreCase(source.getType())) {
            throw new BaseException("NL2SQL only supports JDBC data sources");
        }

        SchemaInfo schemaInfo = sourceService.getSourceSchemaInfo(source.getId());
        if (schemaInfo.getSchemaItems() == null || schemaInfo.getSchemaItems().isEmpty()) {
            throw new BaseException("The data source schema is empty; synchronize it first");
        }
        SchemaInfo selectedSchemaInfo = filterSchema(
                schemaInfo,
                param.getSelectedTables()
        );

        LlmConfig config = llmConfigService.getActiveConfig(source.getOrgId());
        String dialect = resolveDialect(source);
        String systemPrompt = promptBuilder.buildSystemPrompt(
                selectedSchemaInfo,
                dialect,
                Boolean.TRUE.equals(config.getDefaultPromptEnabled())
                        ? config.getDefaultSystemPrompt()
                        : null
        );
        String output = llmClient.chat(config, systemPrompt, param.getPrompt().trim());
        String sql = extractAndValidateSql(output);

        return new NlSqlGenerateResult(
                sql,
                config.getId(),
                config.getModel(),
                new Date(),
                schemaInfo.getUpdateTime()
        );
    }

    SchemaInfo filterSchema(SchemaInfo schemaInfo,
                            List<NlSqlTableParam> selectedTables) {
        if (selectedTables == null || selectedTables.isEmpty()) {
            return schemaInfo;
        }

        Set<String> requestedKeys = new LinkedHashSet<>();
        for (NlSqlTableParam selectedTable : selectedTables) {
            if (selectedTable == null
                    || StringUtils.isBlank(selectedTable.getDatabase())
                    || StringUtils.isBlank(selectedTable.getTable())) {
                throw new BaseException("Invalid NL2SQL table selection");
            }
            requestedKeys.add(tableKey(
                    selectedTable.getDatabase(),
                    selectedTable.getTable()
            ));
        }

        Set<String> matchedKeys = new HashSet<>();
        List<SchemaItem> filteredItems = new ArrayList<>();
        List<SchemaItem> schemaItems = schemaInfo.getSchemaItems() == null
                ? Collections.emptyList()
                : schemaInfo.getSchemaItems();
        for (SchemaItem schemaItem : schemaItems) {
            List<TableInfo> filteredTables = new ArrayList<>();
            List<TableInfo> tables = schemaItem.getTables() == null
                    ? Collections.emptyList()
                    : schemaItem.getTables();
            for (TableInfo table : tables) {
                String key = tableKey(
                        schemaItem.getDbName(),
                        table.getTableName()
                );
                if (requestedKeys.contains(key)) {
                    filteredTables.add(table);
                    matchedKeys.add(key);
                }
            }
            if (!filteredTables.isEmpty()) {
                SchemaItem filteredItem = new SchemaItem();
                filteredItem.setDbName(schemaItem.getDbName());
                filteredItem.setTables(filteredTables);
                filteredItems.add(filteredItem);
            }
        }

        if (matchedKeys.size() != requestedKeys.size()) {
            NlSqlTableParam missingTable = null;
            for (NlSqlTableParam selectedTable : selectedTables) {
                String key = tableKey(
                        selectedTable.getDatabase(),
                        selectedTable.getTable()
                );
                if (!matchedKeys.contains(key)) {
                    missingTable = selectedTable;
                    break;
                }
            }
            throw new BaseException(
                    "Selected table does not exist in the data source schema: "
                            + missingTable.getDatabase()
                            + "."
                            + missingTable.getTable()
            );
        }

        SchemaInfo filteredSchemaInfo = new SchemaInfo();
        filteredSchemaInfo.setSchemaItems(filteredItems);
        filteredSchemaInfo.setUpdateTime(schemaInfo.getUpdateTime());
        return filteredSchemaInfo;
    }

    private String tableKey(String database, String table) {
        return database + "\u0000" + table;
    }

    private String resolveDialect(Source source) {
        DataProviderSource providerSource = dataProviderService.parseDataProviderConfig(source);
        Object dbType = providerSource.getProperties().get("dbType");
        return dbType == null ? source.getType() : dbType.toString();
    }

    String extractAndValidateSql(String output) {
        if (StringUtils.isBlank(output)) {
            throw new BaseException("LLM returned empty SQL");
        }

        Matcher matcher = SQL_CODE_BLOCK.matcher(output.trim());
        String sql = matcher.find() ? matcher.group(1).trim() : output.trim();
        List<String> statements = SqlSplitter
                .splitEscaped(sql, SqlSplitter.DEFAULT_DELIMITER)
                .stream()
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());

        if (statements.size() != 1) {
            throw new BaseException("LLM must return exactly one SQL query");
        }
        sql = statements.get(0).trim();
        if (!SqlValidateUtils.validateQuery(sql, false)) {
            throw new BaseException("LLM returned an invalid SQL query");
        }
        return sql;
    }
}
