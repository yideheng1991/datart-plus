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
package datart.data.provider.calcite.dialect;

import datart.core.data.provider.sql.AggregateOperator;
import org.apache.calcite.sql.SqlCall;
import org.apache.calcite.sql.SqlWriter;

public interface StatisticalAggregateDialectSupport {

    enum Syntax {
        LOCAL_H2,
        PERCENTILE_CONT,
        CLICKHOUSE_EXACT_INCLUSIVE
    }

    default Syntax statisticalAggregateSyntax() {
        return Syntax.LOCAL_H2;
    }

    default boolean supportsStatisticalAggregate(
            AggregateOperator.SqlOperator operator) {
        return operator != null
                && operator.isStatistical()
                && statisticalAggregateSyntax() != Syntax.LOCAL_H2;
    }

    default void unparseStatisticalAggregate(
            SqlWriter writer,
            SqlCall call,
            AggregateOperator.SqlOperator operator) {
        if (!supportsStatisticalAggregate(operator)) {
            throw new UnsupportedOperationException(
                    "Statistical aggregate " + operator + " is not supported by "
                            + writer.getDialect().getClass().getSimpleName());
        }

        String percentile = percentile(operator);
        switch (statisticalAggregateSyntax()) {
            case PERCENTILE_CONT:
                SqlWriter.Frame functionFrame =
                        writer.startFunCall("PERCENTILE_CONT");
                writer.print(percentile);
                writer.endFunCall(functionFrame);
                writer.keyword("WITHIN GROUP");
                SqlWriter.Frame orderFrame = writer.startList("(", ")");
                writer.keyword("ORDER BY");
                call.operand(0).unparse(writer, 0, 0);
                writer.endList(orderFrame);
                return;
            case CLICKHOUSE_EXACT_INCLUSIVE:
                SqlWriter.Frame percentileFrame =
                        writer.startFunCall("quantileExactInclusive");
                writer.print(percentile);
                writer.endFunCall(percentileFrame);
                SqlWriter.Frame valueFrame = writer.startList("(", ")");
                call.operand(0).unparse(writer, 0, 0);
                writer.endList(valueFrame);
                return;
            default:
                throw new UnsupportedOperationException(
                        "Unsupported statistical aggregate syntax "
                                + statisticalAggregateSyntax());
        }
    }

    static String percentile(AggregateOperator.SqlOperator operator) {
        switch (operator) {
            case MEDIAN:
                return "0.5";
            case QUARTILE_1:
                return "0.25";
            case QUARTILE_3:
                return "0.75";
            default:
                throw new IllegalArgumentException(
                        operator + " is not a statistical aggregate");
        }
    }
}
