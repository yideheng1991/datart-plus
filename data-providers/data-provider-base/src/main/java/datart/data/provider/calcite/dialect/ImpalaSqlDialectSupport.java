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
import datart.data.provider.jdbc.JdbcDriverInfo;
import org.apache.calcite.sql.SqlAbstractDateTimeLiteral;
import org.apache.calcite.sql.SqlCall;
import org.apache.calcite.sql.SqlNode;
import org.apache.calcite.sql.SqlWriter;

import java.util.EnumSet;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;

import static datart.core.data.provider.StdSqlOperator.*;
import static datart.core.data.provider.StdSqlOperator.AGG_DATE_DAY;

public class ImpalaSqlDialectSupport extends CustomSqlDialect
        implements SqlStdOperatorSupport, FetchAndOffsetSupport,
        StatisticalAggregateDialectSupport, DateOffsetDialectSupport {

    static ConcurrentSkipListSet<StdSqlOperator> OWN_SUPPORTED = new ConcurrentSkipListSet<>(
            EnumSet.of(AGG_DATE_YEAR, AGG_DATE_QUARTER, AGG_DATE_MONTH, AGG_DATE_WEEK, AGG_DATE_DAY));

    static {
        OWN_SUPPORTED.addAll(SUPPORTED);
    }

    public ImpalaSqlDialectSupport(JdbcDriverInfo driverInfo) {
        super(driverInfo);
    }

    @Override
    public void unparseOffsetFetch(SqlWriter writer, SqlNode offset, SqlNode fetch) {
        super.unparseFetchUsingLimit(writer, offset, fetch);
    }

    @Override
    public void unparseDateTimeLiteral(SqlWriter writer, SqlAbstractDateTimeLiteral literal, int leftPrec, int rightPrec) {
        writer.literal("'" + literal.toFormattedString() + "'");
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
                writer.print("CONCAT(CAST(YEAR("+columnName+") AS STRING), '-', CAST(QUARTER("+columnName+") AS STRING))");
                return true;
            }
            case AGG_DATE_MONTH: {
                String columnName = call.getOperandList().get(0).toSqlString(this).getSql();
                writer.print("FROM_UNIXTIME(UNIX_TIMESTAMP("+columnName+"), 'yyyy-MM')");
                return true;
            }
            case AGG_DATE_WEEK: {
                String columnName = call.getOperandList().get(0).toSqlString(this).getSql();
                writer.print("CONCAT(CAST(YEAR("+columnName+") AS STRING), '-', CAST(WEEK("+columnName+") AS STRING))");
                return true;
            }
            case AGG_DATE_DAY: {
                String columnName = call.getOperandList().get(0).toSqlString(this).getSql();
                writer.print("FROM_UNIXTIME(UNIX_TIMESTAMP("+columnName+"), 'yyyy-MM-dd')");
                return true;
            }
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
                return "days_sub(" + timeExpr + ", " + (offset * 7) + ")";
            case "DAY":
                return "days_sub(" + timeExpr + ", " + offset + ")";
            case "MONTH":
            default:
                return "add_months(" + timeExpr + ", -" + offset + ")";
        }
    }

    @Override
    public String dateOffsetFormatted(String timeExpr, int offset, String offsetUnit, String fmt) {
        // Impala 用 unix_timestamp/from_unixtime 把周期字符串转日期，再按单位偏移后格式化还原
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
                dateExpr = "days_sub(" + dateExpr + ", " + (offset * 7) + ")";
                break;
            case "DAY":
            default:
                dateExpr = "days_sub(" + dateExpr + ", " + offset + ")";
                break;
        }
        return "from_unixtime(unix_timestamp(" + dateExpr + ", 'yyyy-MM-dd'), '" + fmt + "')";
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
                // 季粒度：Impala 周期字符串 'YYYY-Q' 无法用 unix_timestamp 可靠解析
                return null;
        }
    }
}
