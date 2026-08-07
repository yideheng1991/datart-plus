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

package datart.server.llm;

import datart.core.base.consts.ValueType;
import datart.core.data.provider.Column;
import datart.core.data.provider.SchemaInfo;
import datart.core.data.provider.SchemaItem;
import datart.core.data.provider.TableInfo;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NlSqlPromptBuilderTest {

    @Test
    void shouldIncludeDialectAndSchemaInSystemPrompt() {
        TableInfo table = new TableInfo();
        table.setTableName("orders");
        table.setPrimaryKeys(Collections.singletonList("region"));
        table.setColumns(new LinkedHashSet<>(Arrays.asList(
                Column.of(ValueType.STRING, "orders", "region"),
                Column.of(ValueType.NUMERIC, "orders", "amount")
        )));

        SchemaItem schemaItem = new SchemaItem();
        schemaItem.setDbName("analytics");
        schemaItem.setTables(Collections.singletonList(table));

        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Collections.singletonList(schemaItem));

        String prompt = new NlSqlPromptBuilder()
                .buildSystemPrompt(schemaInfo, "POSTGRESQL", null);

        assertTrue(prompt.contains("Target dialect: POSTGRESQL"));
        assertTrue(prompt.contains(
                "analytics.orders(region*:STRING,amount:NUMERIC)"
        ));
        assertTrue(prompt.contains("Return exactly one SELECT or WITH query"));
        assertTrue(prompt.contains("Represent variables as $variable_name$"));
        assertTrue(prompt.contains("WHERE region = $region$"));
        assertTrue(prompt.contains("never quote a variable placeholder"));
    }

    @Test
    void shouldIncludeOrganizationPromptBeforeSchema() {
        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Collections.emptyList());

        String prompt = new NlSqlPromptBuilder().buildSystemPrompt(
                schemaInfo,
                "MYSQL",
                "GMV is the sum of paid order amounts."
        );

        int rulesIndex = prompt.indexOf("Rules:");
        int organizationPromptIndex = prompt.indexOf(
                "Organization business context and metric definitions:"
        );
        int schemaIndex = prompt.indexOf("Database schema");
        assertTrue(rulesIndex < organizationPromptIndex);
        assertTrue(organizationPromptIndex < schemaIndex);
        assertTrue(prompt.contains("GMV is the sum of paid order amounts."));
        assertTrue(prompt.contains(
                "the rules above and database schema below"
        ));
    }

    @Test
    void shouldKeepFullColumnNamesAndAllColumns() {
        String longColumnName =
                "this_is_a_column_name_longer_than_forty_characters";
        LinkedHashSet<Column> columns = new LinkedHashSet<>();
        columns.add(Column.of(ValueType.STRING, "wide_table", longColumnName));
        for (int index = 0; index <= 80; index++) {
            columns.add(Column.of(
                    ValueType.NUMERIC,
                    "wide_table",
                    "column_" + index
            ));
        }

        TableInfo table = new TableInfo();
        table.setTableName("wide_table");
        table.setColumns(columns);

        SchemaItem schemaItem = new SchemaItem();
        schemaItem.setDbName("analytics");
        schemaItem.setTables(Collections.singletonList(table));

        SchemaInfo schemaInfo = new SchemaInfo();
        schemaInfo.setSchemaItems(Collections.singletonList(schemaItem));

        String schema = new NlSqlPromptBuilder().buildSchemaText(schemaInfo);

        assertTrue(schema.contains(longColumnName + ":STRING"));
        assertTrue(schema.contains("column_80:NUMERIC"));
        assertFalse(schema.contains("..."));
    }
}
