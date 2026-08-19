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

import org.apache.calcite.sql.dialect.ClickHouseSqlDialect;

public class ClickHouseSqlDialectSupport extends ClickHouseSqlDialect
        implements FetchAndOffsetSupport, StatisticalAggregateDialectSupport,
        DateOffsetDialectSupport {

    private ClickHouseSqlDialectSupport(Context context) {
        super(context);
    }

    public ClickHouseSqlDialectSupport() {
        this(DEFAULT_CONTEXT);
    }

    @Override
    public Syntax statisticalAggregateSyntax() {
        return Syntax.CLICKHOUSE_EXACT_INCLUSIVE;
    }

    @Override
    public boolean supportsDateOffset() {
        return true;
    }

    @Override
    public String dateOffset(String timeExpr, int offset, String unit) {
        switch (unit) {
            case "YEAR":
                return "subtractYears(" + timeExpr + ", " + offset + ")";
            case "QUARTER":
                return "subtractQuarters(" + timeExpr + ", " + offset + ")";
            case "WEEK":
                return "subtractWeeks(" + timeExpr + ", " + offset + ")";
            case "DAY":
                return "subtractDays(" + timeExpr + ", " + offset + ")";
            case "MONTH":
            default:
                return "subtractMonths(" + timeExpr + ", " + offset + ")";
        }
    }

    @Override
    public String dateOffsetFormatted(String timeExpr, int offset, String unit, String fmt) {
        return "formatDateTime(" + dateOffset("parseDateTimeBestEffort(" + timeExpr + ")", offset, unit)
                + ", '" + fmt + "')";
    }

    @Override
    public String periodFormat(String granularity) {
        switch (granularity) {
            case "YEAR":
                return "%Y";
            case "MONTH":
                return "%Y-%m";
            case "DAY":
                return "%Y-%m-%d";
            default:
                return null;
        }
    }
}
