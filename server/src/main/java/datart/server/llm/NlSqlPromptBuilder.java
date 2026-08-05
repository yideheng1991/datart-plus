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

import datart.core.data.provider.Column;
import datart.core.data.provider.SchemaInfo;
import datart.core.data.provider.SchemaItem;
import datart.core.data.provider.TableInfo;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Component
public class NlSqlPromptBuilder {

    private static final int MAX_SCHEMA_LENGTH = 60000;

    public String buildSystemPrompt(SchemaInfo schemaInfo, String dialect) {
        return "You generate SQL for Datart.\n"
                + "Target dialect: " + dialect + ".\n"
                + "Database schema:\n"
                + buildSchemaText(schemaInfo)
                + "\nRules:\n"
                + "1. Return exactly one SELECT or WITH query.\n"
                + "2. Never return DDL, DML, comments, markdown, or explanations.\n"
                + "3. Only use tables and columns listed in the schema.\n"
                + "4. Use identifier quoting and functions appropriate for the target dialect.\n"
                + "5. Use explicit aliases for calculated columns.\n"
                + "6. Represent variables as $variable_name$ in SQL, for example "
                + "WHERE region = $region$; never quote a variable placeholder "
                + "or replace it with a literal value.\n";
    }

    String buildSchemaText(SchemaInfo schemaInfo) {
        StringBuilder schema = new StringBuilder();
        List<SchemaItem> schemaItems = schemaInfo == null
                || schemaInfo.getSchemaItems() == null
                ? Collections.emptyList()
                : schemaInfo.getSchemaItems();

        outer:
        for (SchemaItem schemaItem : schemaItems) {
            List<TableInfo> tables = schemaItem.getTables() == null
                    ? Collections.emptyList()
                    : schemaItem.getTables();
            for (TableInfo table : tables) {
                appendTable(schema, schemaItem.getDbName(), table);
                if (schema.length() >= MAX_SCHEMA_LENGTH) {
                    schema.append("\n-- schema truncated");
                    break outer;
                }
            }
        }
        return schema.toString();
    }

    private void appendTable(StringBuilder schema, String database, TableInfo table) {
        schema.append("\nTABLE ");
        if (database != null && !database.trim().isEmpty()) {
            schema.append(database).append('.');
        }
        schema.append(table.getTableName()).append(" (\n");

        Set<Column> columns = table.getColumns() == null
                ? Collections.emptySet()
                : table.getColumns();
        int index = 0;
        for (Column column : columns) {
            if (index++ > 0) {
                schema.append(",\n");
            }
            schema.append("  ")
                    .append(column.columnName())
                    .append(' ')
                    .append(column.getType() == null ? "UNKNOWN" : column.getType().name());
        }
        schema.append("\n);");
    }
}
