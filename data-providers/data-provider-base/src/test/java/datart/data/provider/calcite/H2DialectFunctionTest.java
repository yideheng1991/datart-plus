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
package datart.data.provider.calcite;

import datart.data.provider.calcite.dialect.H2Dialect;
import org.apache.calcite.sql.SqlNode;
import org.apache.calcite.sql.SqlSelect;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class H2DialectFunctionTest {

    private static final String DATE_RANGE_EXPRESSION =
            "IF(DATEDIFF(NOW(), [statistics_date]) <= 7, 'within 7 days', "
                    + "IF(DATEDIFF(NOW(), [statistics_date]) <= 15, "
                    + "'within 15 days', "
                    + "IF(DATEDIFF(NOW(), [statistics_date]) <= 30, "
                    + "'within 30 days', 'over 30 days')))";

    @Test
    void shouldTranslateMysqlIfAndDateDiffForH2() throws Exception {
        String sql = renderExpression();
        String normalized = normalize(sql);

        assertFalse(normalized.contains("IF("), sql);
        assertTrue(normalized.contains("CASEWHEN"), sql);
        assertTrue(normalized.contains(
                "DATEDIFF('DAY',STATISTICS_DATE,NOW())"), sql);
    }

    @Test
    void shouldExecuteTranslatedExpressionInH2() throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection connection = DriverManager.getConnection(
                "jdbc:h2:mem:h2_dialect_function_test", "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE TABLE metrics (`statistics_date` TIMESTAMP, "
                            + "`order_id` VARCHAR, `status` VARCHAR)");
            statement.execute(
                    "INSERT INTO metrics VALUES "
                            + "(DATEADD('DAY', -10, CURRENT_TIMESTAMP()), "
                            + "'order-1', 'processing'), "
                            + "(DATEADD('DAY', -10, CURRENT_TIMESTAMP()), "
                            + "'order-2', 'processing'), "
                            + "(DATEADD('DAY', -35, CURRENT_TIMESTAMP()), "
                            + "'order-3', 'waiting')");

            String expression = renderExpression();
            String query = "SELECT " + expression
                    + " AS date_range, COUNT(DISTINCT `order_id`) "
                    + "FROM metrics WHERE `status` IN ('processing', 'waiting') "
                    + "GROUP BY " + expression
                    + " ORDER BY COUNT(`order_id`) DESC";
            try (ResultSet resultSet = statement.executeQuery(query)) {
                assertTrue(resultSet.next());
                assertEquals("within 15 days", resultSet.getString(1));
                assertEquals(2, resultSet.getInt(2));
                assertTrue(resultSet.next());
                assertEquals("over 30 days", resultSet.getString(1));
                assertEquals(1, resultSet.getInt(2));
            }
        }
    }

    private String renderExpression() throws Exception {
        SqlSelect select = (SqlSelect) SqlParserUtils.parseSnippet(
                DATE_RANGE_EXPRESSION);
        SqlNode expression = select.getSelectList().get(0);
        return SqlNodeUtils.toSql(expression, new H2Dialect(), true);
    }

    private String normalize(String sql) {
        return sql.replace("`", "")
                .replace("\"", "")
                .replaceAll("\\s+", "")
                .toUpperCase(Locale.ROOT);
    }
}
