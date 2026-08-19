package datart.data.provider.calcite.dialect;

import org.apache.calcite.sql.dialect.PostgresqlSqlDialect;

public class PostgresqlSqlDialectSupport extends PostgresqlSqlDialect
        implements FetchAndOffsetSupport, StatisticalAggregateDialectSupport,
        DateOffsetDialectSupport {

    public PostgresqlSqlDialectSupport() {
        this(DEFAULT_CONTEXT);
    }
    private PostgresqlSqlDialectSupport(Context context) {
        super(context);
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
        return timeExpr + " - INTERVAL '" + offset + " " + unit.toLowerCase() + "'";
    }

    @Override
    public String dateOffsetFormatted(String timeExpr, int offset, String offsetUnit, String fmt) {
        // PostgreSQL 的 TO_DATE 对未指定 day 默认取 1(无 MySQL 的零日期问题)，且支持 ISO 周(IYYY-IW)
        return "TO_CHAR((TO_DATE(" + timeExpr + ", '" + fmt
                + "') - INTERVAL '" + offset + " " + offsetUnit.toLowerCase() + "'), '" + fmt + "')";
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
            default:
                // 季粒度：PostgreSQL 的 to_date 不支持 Q 格式，无法可靠还原
                return null;
        }
    }
}
