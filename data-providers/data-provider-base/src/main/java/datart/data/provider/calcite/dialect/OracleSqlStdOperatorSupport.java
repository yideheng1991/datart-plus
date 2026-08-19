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
import org.apache.calcite.sql.dialect.OracleSqlDialect;

import java.util.EnumSet;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;

import static datart.core.data.provider.StdSqlOperator.*;

public class OracleSqlStdOperatorSupport extends OracleSqlDialect
        implements SqlStdOperatorSupport, StatisticalAggregateDialectSupport,
        DateOffsetDialectSupport {

    static ConcurrentSkipListSet<StdSqlOperator> OWN_SUPPORTED = new ConcurrentSkipListSet<>(
            EnumSet.of(STDDEV, ABS, CEILING, FLOOR, POWER, ROUND, SQRT, EXP, LOG10, RAND, DEGREES, RADIANS,
            SIGN, ACOS, ASIN, ATAN, ATAN2, SIN, COS, TAN, COT, LENGTH, CONCAT, REPLACE, SUBSTRING, LOWER, UPPER, LTRIM, RTRIM, TRIM,
            NOW, AGG_DATE_YEAR, AGG_DATE_QUARTER, AGG_DATE_MONTH, AGG_DATE_WEEK, AGG_DATE_DAY));

    static {
        OWN_SUPPORTED.addAll(SUPPORTED);
    }

    public OracleSqlStdOperatorSupport() {
        this(DEFAULT_CONTEXT);
    }

    private OracleSqlStdOperatorSupport(Context context) {
        super(context);
    }

    @Override
    public String quoteIdentifier(String val) {
        return val;
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
            case NOW:
                writer.print("SYSDATE");
                return true;
            case AGG_DATE_YEAR:
                writer.print("TO_CHAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY')");
                return true;
            case AGG_DATE_QUARTER:
                writer.print("TO_CHAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-Q')");
                return true;
            case AGG_DATE_MONTH:
                writer.print("TO_CHAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-MM')");
                return true;
            case AGG_DATE_WEEK:
                writer.print("TO_CHAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'IYYY-IW')");
                return true;
            case AGG_DATE_DAY:
                writer.print("TO_CHAR(" + call.getOperandList().get(0).toSqlString(this).getSql() + ",'YYYY-MM-DD')");
                return true;
            default:
                break;
        }
        return false;
    }

    @Override
    public void quoteStringLiteral(StringBuilder buf, String charsetName, String val) {
        buf.append(literalQuoteString);
        buf.append(val.replace(literalEndQuoteString, literalEscapedQuote));
        buf.append(literalEndQuoteString);
    }

    @Override
    public Set<StdSqlOperator> supportedOperators() {
        return OWN_SUPPORTED;
    }

    @Override
    public Syntax statisticalAggregateSyntax() {
        return Syntax.PERCENTILE_CONT;
    }

    @Override
    public boolean supportsDateOffset() {
        return true;
    }

    @Override
    public String dateOffset(String timeExpr, int offset, String unit) {
        switch (unit) {
            case "YEAR":
                return "ADD_MONTHS(" + timeExpr + ", -" + (offset * 12) + ")";
            case "QUARTER":
                return "ADD_MONTHS(" + timeExpr + ", -" + (offset * 3) + ")";
            case "WEEK":
                return timeExpr + " - INTERVAL '" + (offset * 7) + "' DAY";
            case "DAY":
                return timeExpr + " - INTERVAL '" + offset + "' DAY";
            case "MONTH":
            default:
                return "ADD_MONTHS(" + timeExpr + ", -" + offset + ")";
        }
    }

    @Override
    public String dateOffsetFormatted(String timeExpr, int offset, String offsetUnit, String fmt) {
        // 根据偏移单位生成不同的日期偏移：月/季/年用 ADD_MONTHS，周/日用 INTERVAL DAY
        String dateExpr = "TO_DATE(" + timeExpr + ", '" + fmt + "')";
        switch (offsetUnit) {
            case "YEAR":
                dateExpr = "ADD_MONTHS(" + dateExpr + ", -" + (offset * 12) + ")";
                break;
            case "MONTH":
                dateExpr = "ADD_MONTHS(" + dateExpr + ", -" + offset + ")";
                break;
            case "QUARTER":
                dateExpr = "ADD_MONTHS(" + dateExpr + ", -" + (offset * 3) + ")";
                break;
            case "WEEK":
                dateExpr = "(" + dateExpr + " - INTERVAL '" + (offset * 7) + "' DAY)";
                break;
            case "DAY":
            default:
                dateExpr = "(" + dateExpr + " - INTERVAL '" + offset + "' DAY)";
                break;
        }
        return "TO_CHAR(" + dateExpr + ", '" + fmt + "')";
    }

    @Override
    public String periodFormat(String granularity) {
        switch (granularity) {
            case "YEAR":
                return "YYYY";
            case "MONTH":
                return "YYYY-MM";
            case "WEEK":
                return "IYYY-IW";
            case "DAY":
                return "YYYY-MM-DD";
            case "QUARTER":
                // Oracle 的 TO_DATE 支持 YYYY-Q(季度) 格式
                return "YYYY-Q";
            default:
                return null;
        }
    }
}
