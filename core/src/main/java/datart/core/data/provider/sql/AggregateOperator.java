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

package datart.core.data.provider.sql;


import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AggregateOperator extends ColumnOperator implements Alias {

    private SqlOperator sqlOperator;

    private String alias;

    /**
     * Comparison (同比/环比) base aggregate applied to the current period.
     * When sqlOperator is YOY or MOM, this specifies how the current value is
     * aggregated before being compared with the previous period.
     */
    private SqlOperator baseAggregator;

    /**
     * Comparison (同比/环比) configuration, meaningful only when sqlOperator
     * is YOY or MOM.
     */
    private ComparisonGranularity granularity;

    private ComparisonReturnType returnType;

    /**
     * The time dimension column used to order periods.
     */
    private String[] compareColumn;

    public enum SqlOperator {

        MIN,

        AVG,

        MAX,

        SUM,

        COUNT,

        COUNT_DISTINCT,

        MEDIAN,

        QUARTILE_1,

        QUARTILE_3,

        YOY,

        MOM;

        // Statistical aggregates require dialect checks or local H2 fallback.
        public boolean isStatistical() {
            return this == MEDIAN || this == QUARTILE_1 || this == QUARTILE_3;
        }

        // Comparison aggregates (同比/环比) require two-stage SQL generation.
        public boolean isComparison() {
            return this == YOY || this == MOM;
        }
    }

    /**
     * The granularity of the time dimension which determines how far the
     * previous period is shifted.
     */
    public enum ComparisonGranularity {

        YEAR,

        QUARTER,

        MONTH,

        WEEK,

        DAY;

        /**
         * Offset for 环比(MOM): previous period is one granularity behind.
         */
        public int momOffset() {
            return 1;
        }
    }

    /**
     * What the comparison aggregation returns.
     */
    public enum ComparisonReturnType {

        // 对比值：返回上一期/去年同期值
        VALUE,

        // 差值：当前值 - 对比值
        DIFF,

        // 增长率：(当前值 - 对比值) / 对比值
        GROWTH;

        public boolean isDiffLike() {
            return this == DIFF || this == GROWTH;
        }
    }

    @Override
    public String toString() {
        return "AggregateOperator{" +
                "sqlOperator=" + sqlOperator +
                ", column='" + getColumnKey() + '\'' +
                '}';
    }
}
