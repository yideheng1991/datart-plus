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
import datart.core.data.provider.SchemaInfo;
import datart.core.data.provider.SchemaItem;
import datart.core.data.provider.TableInfo;
import datart.core.entity.Source;
import datart.server.base.params.NlSqlGenerateParam;
import datart.server.base.params.NlSqlTableParam;
import datart.server.service.SourceService;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NlSqlServiceImplTest {

    private final NlSqlServiceImpl service =
            new NlSqlServiceImpl(null, null, null, null, null);

    @Test
    void shouldExtractSqlFromMarkdownCodeBlock() {
        String sql = service.extractAndValidateSql(
                "```sql\nSELECT region, SUM(amount) FROM orders GROUP BY region\n```"
        );

        assertEquals(
                "SELECT region, SUM(amount) FROM orders GROUP BY region",
                sql
        );
    }

    @Test
    void shouldRejectMultipleStatements() {
        assertThrows(
                BaseException.class,
                () -> service.extractAndValidateSql("SELECT 1; SELECT 2")
        );
    }

    @Test
    void shouldRejectWriteStatement() {
        assertThrows(
                BaseException.class,
                () -> service.extractAndValidateSql("DELETE FROM orders")
        );
    }

    @Test
    void shouldRejectNonJdbcSourceBeforeLoadingSchema() {
        SourceService sourceService = mock(SourceService.class);
        Source source = new Source();
        source.setId("source-id");
        source.setType("HTTP");
        source.setIsFolder(false);
        when(sourceService.retrieve("source-id")).thenReturn(source);

        NlSqlGenerateParam param = new NlSqlGenerateParam();
        param.setSourceId("source-id");
        param.setPrompt("List all orders");
        NlSqlServiceImpl serviceWithSource =
                new NlSqlServiceImpl(sourceService, null, null, null, null);

        BaseException exception = assertThrows(
                BaseException.class,
                () -> serviceWithSource.generate(param)
        );

        assertEquals(
                "NL2SQL only supports JDBC data sources",
                exception.getMessage()
        );
        verify(sourceService, never()).getSourceSchemaInfo("source-id");
    }

    @Test
    void shouldKeepOnlySelectedTablesInSchema() {
        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Arrays.asList(
                schemaItem("analytics", "orders", "customers"),
                schemaItem("warehouse", "inventory")
        ));

        SchemaInfo filtered = service.filterSchema(
                schemaInfo,
                Arrays.asList(
                        selectedTable("analytics", "orders"),
                        selectedTable("warehouse", "inventory")
                )
        );

        assertEquals(2, filtered.getSchemaItems().size());
        assertEquals(
                "orders",
                filtered.getSchemaItems().get(0).getTables().get(0).getTableName()
        );
        assertEquals(
                "inventory",
                filtered.getSchemaItems().get(1).getTables().get(0).getTableName()
        );
    }

    @Test
    void shouldKeepFullSchemaWhenNoTableIsSelected() {
        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Collections.singletonList(
                schemaItem("analytics", "orders", "customers")
        ));

        assertSame(
                schemaInfo,
                service.filterSchema(schemaInfo, Collections.emptyList())
        );
        assertSame(schemaInfo, service.filterSchema(schemaInfo, null));
    }

    @Test
    void shouldRejectTableOutsideSourceSchema() {
        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Collections.singletonList(
                schemaItem("analytics", "orders")
        ));

        BaseException exception = assertThrows(
                BaseException.class,
                () -> service.filterSchema(
                        schemaInfo,
                        Collections.singletonList(
                                selectedTable("analytics", "missing")
                        )
                )
        );

        assertEquals(
                "Selected table does not exist in the data source schema: "
                        + "analytics.missing",
                exception.getMessage()
        );
    }

    private SchemaItem schemaItem(String database, String... tableNames) {
        SchemaItem schemaItem = new SchemaItem();
        schemaItem.setDbName(database);
        schemaItem.setTables(
                Arrays.stream(tableNames)
                        .map(tableName -> {
                            TableInfo table = new TableInfo();
                            table.setTableName(tableName);
                            return table;
                        })
                        .collect(java.util.stream.Collectors.toList())
        );
        return schemaItem;
    }

    private NlSqlTableParam selectedTable(String database, String table) {
        NlSqlTableParam selectedTable = new NlSqlTableParam();
        selectedTable.setDatabase(database);
        selectedTable.setTable(table);
        return selectedTable;
    }
}
