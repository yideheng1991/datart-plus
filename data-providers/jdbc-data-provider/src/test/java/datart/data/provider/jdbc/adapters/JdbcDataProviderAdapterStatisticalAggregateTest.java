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
package datart.data.provider.jdbc.adapters;

import datart.core.base.PageInfo;
import datart.core.data.provider.ExecuteParam;
import datart.core.data.provider.QueryScript;
import datart.core.data.provider.ScriptType;
import datart.core.data.provider.sql.AggregateOperator;
import datart.data.provider.calcite.dialect.MysqlSqlStdOperatorSupport;
import datart.data.provider.jdbc.JdbcDriverInfo;
import datart.data.provider.jdbc.JdbcProperties;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JdbcDataProviderAdapterStatisticalAggregateTest {

    @Test
    void shouldGenerateQueryKeyUsingLocalDialectForMysqlStatisticalAggregate() {
        JdbcDataProviderAdapter adapter = mysqlAdapter();

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setColumn("value");
        aggregate.setAlias("q1_value");
        aggregate.setSqlOperator(
                AggregateOperator.SqlOperator.QUARTILE_1);

        ExecuteParam executeParam = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .pageInfo(PageInfo.builder()
                        .pageNo(1)
                        .pageSize(100)
                        .build())
                .build();
        QueryScript script = QueryScript.builder()
                .script("SELECT value FROM test_table")
                .scriptType(ScriptType.SQL)
                .variables(Collections.emptyList())
                .viewId("view-id")
                .test(false)
                .build();

        String queryKey = assertDoesNotThrow(
                () -> adapter.getQueryKey(script, executeParam));

        assertTrue(queryKey.startsWith("Q"));
    }

    private JdbcDataProviderAdapter mysqlAdapter() {
        JdbcProperties properties = new JdbcProperties();
        properties.setEnableSpecialSql(false);

        JdbcDriverInfo driverInfo = new JdbcDriverInfo();
        driverInfo.setQuoteIdentifiers(true);
        driverInfo.setSupportSqlLimit(true);

        JdbcDataProviderAdapter adapter = new JdbcDataProviderAdapter();
        adapter.setJdbcProperties(properties);
        adapter.setDriverInfo(driverInfo);
        adapter.setSqlDialect(new MysqlSqlStdOperatorSupport());
        return adapter;
    }
}
