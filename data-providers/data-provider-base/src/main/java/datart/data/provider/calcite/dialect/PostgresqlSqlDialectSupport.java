package datart.data.provider.calcite.dialect;

import org.apache.calcite.sql.dialect.PostgresqlSqlDialect;

public class PostgresqlSqlDialectSupport extends PostgresqlSqlDialect
        implements FetchAndOffsetSupport, StatisticalAggregateDialectSupport {

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
}
