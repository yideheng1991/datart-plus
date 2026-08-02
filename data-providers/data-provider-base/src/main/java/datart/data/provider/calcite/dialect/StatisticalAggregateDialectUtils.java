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

import datart.core.data.provider.ExecuteParam;
import datart.core.data.provider.sql.AggregateOperator;
import datart.core.data.provider.sql.FilterOperator;
import datart.core.data.provider.sql.OrderOperator;
import org.apache.calcite.sql.SqlDialect;

import java.util.Collections;
import java.util.List;

public final class StatisticalAggregateDialectUtils {

    private StatisticalAggregateDialectUtils() {
    }

    public static boolean requiresLocalAggregation(
            SqlDialect dialect,
            ExecuteParam executeParam) {
        if (executeParam == null) {
            return false;
        }

        StatisticalAggregateDialectSupport support =
                dialect instanceof StatisticalAggregateDialectSupport
                        ? (StatisticalAggregateDialectSupport) dialect
                        : null;

        List<AggregateOperator> aggregators =
                defaultIfNull(executeParam.getAggregators());
        for (AggregateOperator aggregator : aggregators) {
            if (isUnsupported(support, aggregator.getSqlOperator())) {
                return true;
            }
        }

        List<FilterOperator> filters =
                defaultIfNull(executeParam.getFilters());
        for (FilterOperator filter : filters) {
            if (isUnsupported(support, filter.getAggOperator())) {
                return true;
            }
        }

        List<OrderOperator> orders =
                defaultIfNull(executeParam.getOrders());
        for (OrderOperator order : orders) {
            if (isUnsupported(support, order.getAggOperator())) {
                return true;
            }
        }

        return false;
    }

    private static boolean isUnsupported(
            StatisticalAggregateDialectSupport support,
            AggregateOperator.SqlOperator operator) {
        return operator != null
                && operator.isStatistical()
                && (support == null
                || !support.supportsStatisticalAggregate(operator));
    }

    private static <T> List<T> defaultIfNull(List<T> values) {
        return values == null ? Collections.emptyList() : values;
    }
}
