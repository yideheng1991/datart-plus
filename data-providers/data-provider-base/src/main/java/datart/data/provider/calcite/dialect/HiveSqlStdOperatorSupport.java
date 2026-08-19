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

import datart.core.data.provider.StdSqlOperator;
import org.apache.calcite.sql.SqlCall;
import org.apache.calcite.sql.SqlWriter;
import org.apache.calcite.sql.dialect.HiveSqlDialect;

import java.util.EnumSet;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;

import static datart.core.data.provider.StdSqlOperator.*;

public class HiveSqlStdOperatorSupport extends HiveSqlDialect
        implements SqlStdOperatorSupport, FetchAndOffsetSupport,
        StatisticalAggregateDialectSupport, DateOffsetDialectSupport {

    static ConcurrentSkipListSet<StdSqlOperator> OWN_SUPPORTED = new ConcurrentSkipListSet<>(
            EnumSet.of(AGG_DATE_YEAR, AGG_DATE_QUARTER, AGG_DATE_MONTH, AGG_DATE_WEEK, AGG_DATE_DAY));

    static {
        OWN_SUPPORTED.addAll(SUPPORTED);
    }

    public HiveSqlStdOperatorSupport() {
        this(DEFAULT_CONTEXT);
    }

    private HiveSqlStdOperatorSupport(Context context) {
        super(context);
    }

    @Override
    public void unparseCall(SqlWriter writer, SqlCall call, int leftPrec, int rightPrec) {
        if (isStdSqlOperator(call) && unparseStdSqlOperator(writer, call, leftPrec, rightPrec)) {
            return;
        }
        super.unparseCall(writer, call, leftPrec, rightPrec);
    }

    @Override
    public boolean unparseStdSqlOperator(SqlWriter writer, SqlCall call, int leftPrec, int rightPrec) {
        StdSqlOperator operator = symbolOf(call.getOperator().getName());
        switch (operator) {
            case AGG_DATE_YEAR:
                writer.print("YEAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ")");
                return true;
            case AGG_DATE_QUARTER: {
                String columnName = call.getOperandList().get(0).toSqlString(this).getSql();
                writer.print("CONCAT(DATE_FORMAT("+columnName+",'YYYY-'),QUARTER("+columnName+"))");
                return true;
            }
            case AGG_DATE_MONTH:
                writer.print("DATE_FORMAT(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-MM')");
                return true;
            case AGG_DATE_WEEK:
                writer.print("DATE_FORMAT(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-ww')");
                return true;
            case AGG_DATE_DAY:
                writer.print("DATE_FORMAT(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-MM-dd')");
                return true;
            default:
                break;
        }
        return false;
    }

    @Override
    public Set<StdSqlOperator> supportedOperators() {
        return OWN_SUPPORTED;
    }

    @Override
    public Syntax statisticalAggregateSyntax() {
        return Syntax.LOCAL_H2;
    }

    @Override
    public boolean supportsDateOffset() {
        return true;
    }

    @Override
    public String dateOffset(String timeExpr, int offset, String unit) {
        switch (unit) {
            case "YEAR":
                return "add_months(" + timeExpr + ", -" + (offset * 12) + ")";
            case "QUARTER":
                return "add_months(" + timeExpr + ", -" + (offset * 3) + ")";
            case "WEEK":
                return "date_sub(" + timeExpr + ", " + (offset * 7) + ")";
            case "DAY":
                return "date_sub(" + timeExpr + ", " + offset + ")";
            case "MONTH":
            default:
                return "add_months(" + timeExpr + ", -" + offset + ")";
        }
    }

    @Override
    public String dateOffsetFormatted(String timeExpr, int offset, String offsetUnit, String fmt) {
        // Hive 用 unix_timestamp/from_unixtime 把周期字符串转日期，再按单位偏移后格式化还原
        String dateExpr = "from_unixtime(unix_timestamp(" + timeExpr + ", '" + fmt + "'), 'yyyy-MM-dd')";
        switch (offsetUnit) {
            case "YEAR":
                dateExpr = "add_months(" + dateExpr + ", -" + (offset * 12) + ")";
                break;
            case "MONTH":
                dateExpr = "add_months(" + dateExpr + ", -" + offset + ")";
                break;
            case "QUARTER":
                dateExpr = "add_months(" + dateExpr + ", -" + (offset * 3) + ")";
                break;
            case "WEEK":
                dateExpr = "date_sub(" + dateExpr + ", " + (offset * 7) + ")";
                break;
            case "DAY":
            default:
                dateExpr = "date_sub(" + dateExpr + ", " + offset + ")";
                break;
        }
        return "date_format(" + dateExpr + ", '" + fmt + "')";
    }

    @Override
    public String periodFormat(String granularity) {
        switch (granularity) {
            case "YEAR":
                return "yyyy";
            case "MONTH":
                return "yyyy-MM";
            case "WEEK":
                return "yyyy-ww";
            case "DAY":
                return "yyyy-MM-dd";
            default:
                // 季粒度：Hive 周期字符串 'YYYY-Q' 无法用 unix_timestamp 可靠解析
                return null;
        }
    }
}
