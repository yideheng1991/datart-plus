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

import datart.core.base.consts.ValueType;
import datart.core.data.provider.ExecuteParam;
import datart.core.data.provider.QueryScript;
import datart.core.data.provider.ScriptType;
import datart.core.data.provider.SingleTypedValue;
import datart.core.data.provider.sql.AggregateOperator;
import datart.core.data.provider.sql.FilterOperator;
import datart.core.data.provider.sql.GroupByOperator;
import datart.core.data.provider.sql.OrderOperator;
import datart.data.provider.calcite.custom.StatisticalAggregateFunction;
import datart.data.provider.calcite.dialect.ClickHouseSqlDialectSupport;
import datart.data.provider.calcite.dialect.H2Dialect;
import datart.data.provider.calcite.dialect.HiveSqlStdOperatorSupport;
import datart.data.provider.calcite.dialect.ImpalaSqlDialectSupport;
import datart.data.provider.calcite.dialect.MsSqlStdOperatorSupport;
import datart.data.provider.calcite.dialect.MysqlSqlStdOperatorSupport;
import datart.data.provider.calcite.dialect.OracleSqlStdOperatorSupport;
import datart.data.provider.calcite.dialect.PostgresqlSqlDialectSupport;
import datart.data.provider.calcite.dialect.StatisticalAggregateDialectUtils;
import datart.data.provider.jdbc.JdbcDriverInfo;
import datart.data.provider.jdbc.SqlScriptRender;
import org.apache.calcite.sql.SqlAggFunction;
import org.apache.calcite.sql.SqlDialect;
import org.apache.calcite.sql.SqlNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StatisticalAggregateSqlTest {

    @Test
    void shouldRenderAllContinuousPercentiles() {
        SqlDialect dialect = new H2Dialect();

        assertEquals(
                "PERCENTILE_CONT(0.5)WITHINGROUP(ORDERBYVALUE)",
                normalize(render(StatisticalAggregateFunction.MEDIAN, dialect)));
        assertEquals(
                "PERCENTILE_CONT(0.25)WITHINGROUP(ORDERBYVALUE)",
                normalize(render(StatisticalAggregateFunction.QUARTILE_1, dialect)));
        assertEquals(
                "PERCENTILE_CONT(0.75)WITHINGROUP(ORDERBYVALUE)",
                normalize(render(StatisticalAggregateFunction.QUARTILE_3, dialect)));
    }

    @Test
    void shouldRenderNativeDialectSyntax() {
        assertEquals(
                "PERCENTILE_CONT(0.5)WITHINGROUP(ORDERBYVALUE)",
                normalize(render(
                        StatisticalAggregateFunction.MEDIAN,
                        new PostgresqlSqlDialectSupport())));
        assertEquals(
                "PERCENTILE_CONT(0.5)WITHINGROUP(ORDERBYVALUE)",
                normalize(render(
                        StatisticalAggregateFunction.MEDIAN,
                        new OracleSqlStdOperatorSupport())));
        assertEquals(
                "QUANTILEEXACTINCLUSIVE(0.5)(VALUE)",
                normalize(render(
                        StatisticalAggregateFunction.MEDIAN,
                        new ClickHouseSqlDialectSupport())));
    }

    @Test
    void shouldExecuteContinuousPercentilesInH2() throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection connection = DriverManager.getConnection(
                "jdbc:h2:mem:statistical_aggregate_test", "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE TABLE metrics (`value` DECIMAL(10, 2))");
            statement.execute(
                    "INSERT INTO metrics (`value`) VALUES (1), (2), (3), (4), (NULL)");

            assertDecimalEquals(
                    "2.5",
                    executeAggregate(
                            statement, StatisticalAggregateFunction.MEDIAN));
            assertDecimalEquals(
                    "1.75",
                    executeAggregate(
                            statement, StatisticalAggregateFunction.QUARTILE_1));
            assertDecimalEquals(
                    "3.25",
                    executeAggregate(
                            statement, StatisticalAggregateFunction.QUARTILE_3));
        }
    }

    @Test
    void shouldUseStatisticalAggregatesInSelectHavingAndOrderBy()
            throws Exception {
        AggregateOperator aggregate = aggregate(
                AggregateOperator.SqlOperator.MEDIAN, "median_value");

        FilterOperator filter = new FilterOperator();
        filter.setColumn("value");
        filter.setAggOperator(AggregateOperator.SqlOperator.QUARTILE_1);
        filter.setSqlOperator(FilterOperator.SqlOperator.GT);
        filter.setValues(new SingleTypedValue[]{
                new SingleTypedValue(10, ValueType.NUMERIC)
        });

        OrderOperator order = new OrderOperator();
        order.setColumn("value");
        order.setAggOperator(AggregateOperator.SqlOperator.QUARTILE_3);
        order.setOperator(OrderOperator.SqlOperator.DESC);

        GroupByOperator group = new GroupByOperator();
        group.setColumn("category");
        group.setAlias("category");

        ExecuteParam executeParam = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .filters(Collections.singletonList(filter))
                .groups(Collections.singletonList(group))
                .orders(Collections.singletonList(order))
                .build();

        QueryScript script = QueryScript.builder()
                .script("SELECT category, value FROM test_table")
                .scriptType(ScriptType.SQL)
                .variables(Collections.emptyList())
                .build();

        String sql = new SqlScriptRender(
                script, executeParam, new H2Dialect())
                .render(true, false, false);
        String normalized = normalize(sql);

        assertTrue(normalized.contains(
                "PERCENTILE_CONT(0.5)WITHINGROUP(ORDERBYDATART_VTABLE.VALUE)"),
                sql);
        assertTrue(normalized.contains(
                "HAVINGPERCENTILE_CONT(0.25)WITHINGROUP"
                        + "(ORDERBYDATART_VTABLE.VALUE)>10"),
                sql);
        assertTrue(normalized.contains(
                "ORDERBYPERCENTILE_CONT(0.75)WITHINGROUP"
                        + "(ORDERBYDATART_VTABLE.VALUE)DESC"),
                sql);
    }

    @Test
    void shouldRouteUnsupportedDialectsToLocalH2() {
        FilterOperator filter = new FilterOperator();
        filter.setAggOperator(AggregateOperator.SqlOperator.QUARTILE_1);
        OrderOperator order = new OrderOperator();
        order.setAggOperator(AggregateOperator.SqlOperator.QUARTILE_3);

        List<ExecuteParam> executeParams = Arrays.asList(
                ExecuteParam.builder()
                        .aggregators(Collections.singletonList(aggregate(
                                AggregateOperator.SqlOperator.MEDIAN,
                                "median_value")))
                        .build(),
                ExecuteParam.builder()
                        .filters(Collections.singletonList(filter))
                        .build(),
                ExecuteParam.builder()
                        .orders(Collections.singletonList(order))
                        .build());
        List<SqlDialect> nativeDialects = Arrays.asList(
                new H2Dialect(),
                new PostgresqlSqlDialectSupport(),
                new OracleSqlStdOperatorSupport(),
                new ClickHouseSqlDialectSupport());
        List<SqlDialect> localDialects = Arrays.asList(
                new MysqlSqlStdOperatorSupport(),
                new MsSqlStdOperatorSupport(),
                new HiveSqlStdOperatorSupport(),
                new ImpalaSqlDialectSupport(impalaDriverInfo()));

        for (ExecuteParam executeParam : executeParams) {
            for (SqlDialect dialect : nativeDialects) {
                assertFalse(StatisticalAggregateDialectUtils
                        .requiresLocalAggregation(dialect, executeParam));
            }
            for (SqlDialect dialect : localDialects) {
                assertTrue(StatisticalAggregateDialectUtils
                        .requiresLocalAggregation(dialect, executeParam));
            }
        }
    }

    private AggregateOperator aggregate(
            AggregateOperator.SqlOperator operator,
            String alias) {
        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setColumn("value");
        aggregate.setSqlOperator(operator);
        aggregate.setAlias(alias);
        return aggregate;
    }

    private String render(SqlAggFunction function, SqlDialect dialect) {
        SqlNode call = SqlNodeUtils.createSqlBasicCall(
                function,
                Collections.singletonList(
                        SqlNodeUtils.createSqlIdentifier("value")));
        return SqlNodeUtils.toSql(call, dialect, true);
    }

    private BigDecimal executeAggregate(
            Statement statement,
            SqlAggFunction function) throws Exception {
        String sql = "SELECT " + render(function, new H2Dialect())
                + " FROM metrics";
        try (ResultSet resultSet = statement.executeQuery(sql)) {
            assertTrue(resultSet.next());
            return resultSet.getBigDecimal(1);
        }
    }

    private void assertDecimalEquals(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }

    private String normalize(String sql) {
        return sql.replace("`", "")
                .replace("\"", "")
                .replaceAll("\\s+", "")
                .toUpperCase(Locale.ROOT);
    }

    private JdbcDriverInfo impalaDriverInfo() {
        JdbcDriverInfo driverInfo = new JdbcDriverInfo();
        driverInfo.setDbType("IMPALA");
        driverInfo.setName("Impala");
        driverInfo.setDriverClass("com.cloudera.impala.jdbc.Driver");
        driverInfo.setLiteralQuote("'");
        driverInfo.setIdentifierQuote("`");
        driverInfo.setSupportSqlLimit(true);
        return driverInfo;
    }
}
