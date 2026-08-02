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
package datart.data.provider.calcite.custom;

import datart.core.data.provider.sql.AggregateOperator;
import datart.data.provider.calcite.dialect.StatisticalAggregateDialectSupport;
import org.apache.calcite.sql.SqlAggFunction;
import org.apache.calcite.sql.SqlCall;
import org.apache.calcite.sql.SqlDialect;
import org.apache.calcite.sql.SqlFunctionCategory;
import org.apache.calcite.sql.SqlKind;
import org.apache.calcite.sql.SqlWriter;
import org.apache.calcite.sql.type.OperandTypes;
import org.apache.calcite.sql.type.ReturnTypes;

public class StatisticalAggregateFunction extends SqlAggFunction {

    public static final SqlAggFunction MEDIAN =
            new StatisticalAggregateFunction(
                    AggregateOperator.SqlOperator.MEDIAN);

    public static final SqlAggFunction QUARTILE_1 =
            new StatisticalAggregateFunction(
                    AggregateOperator.SqlOperator.QUARTILE_1);

    public static final SqlAggFunction QUARTILE_3 =
            new StatisticalAggregateFunction(
                    AggregateOperator.SqlOperator.QUARTILE_3);

    private final AggregateOperator.SqlOperator operator;

    private StatisticalAggregateFunction(
            AggregateOperator.SqlOperator operator) {
        super(
                operator.name(),
                SqlKind.OTHER_FUNCTION,
                ReturnTypes.DOUBLE_NULLABLE,
                null,
                OperandTypes.NUMERIC,
                SqlFunctionCategory.NUMERIC);
        this.operator = operator;
    }

    @Override
    public void unparse(
            SqlWriter writer,
            SqlCall call,
            int leftPrec,
            int rightPrec) {
        SqlDialect dialect = writer.getDialect();
        if (dialect instanceof StatisticalAggregateDialectSupport) {
            StatisticalAggregateDialectSupport support =
                    (StatisticalAggregateDialectSupport) dialect;
            support.unparseStatisticalAggregate(writer, call, operator);
            return;
        }
        throw new UnsupportedOperationException(
                "Statistical aggregate " + operator + " is not supported by "
                        + dialect.getClass().getSimpleName());
    }
}
