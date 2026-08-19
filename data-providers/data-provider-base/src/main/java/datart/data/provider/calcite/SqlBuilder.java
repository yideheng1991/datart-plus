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
package datart.data.provider.calcite;


import datart.core.base.consts.ValueType;
import datart.core.base.exception.Exceptions;
import datart.core.data.provider.ExecuteParam;
import datart.core.data.provider.SelectColumn;
import datart.core.data.provider.SingleTypedValue;
import datart.core.data.provider.sql.*;
import datart.data.provider.calcite.custom.CustomSqlBetweenOperator;
import datart.data.provider.calcite.custom.StatisticalAggregateFunction;
import datart.data.provider.calcite.dialect.DateOffsetDialectSupport;
import org.apache.calcite.sql.*;
import org.apache.calcite.sql.fun.SqlBetweenOperator;
import org.apache.calcite.sql.fun.SqlStdOperatorTable;
import org.apache.calcite.sql.parser.SqlParseException;
import org.apache.calcite.sql.parser.SqlParserPos;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;


public class SqlBuilder {

    private QueryScriptProcessResult queryScriptProcessResult;

    private final Map<String, SqlNode> functionColumnMap = new HashMap<>();

    private ExecuteParam executeParam;

    private SqlDialect dialect;

    private boolean withPage;

    private boolean quoteIdentifiers;

    private boolean withNamePrefix;

    private String namePrefix;


    private SqlBuilder() {
    }

    public static SqlBuilder builder() {
        return new SqlBuilder();
    }


    public SqlBuilder withAddDefaultNamePrefix(boolean withDefaultNamePrefix) {
        this.withNamePrefix = withDefaultNamePrefix;
        return this;
    }

    public SqlBuilder withDefaultNamePrefix(String defaultNamePrefix) {
        this.namePrefix = defaultNamePrefix;
        return this;
    }


    public SqlBuilder withQueryScriptProcessResult(QueryScriptProcessResult queryScriptProcessResult) {
        this.queryScriptProcessResult = queryScriptProcessResult;
        return this;
    }

    public SqlBuilder withExecuteParam(ExecuteParam executeParam) {
        this.executeParam = executeParam;
        return this;
    }


    public SqlBuilder withDialect(SqlDialect sqlDialect) {
        this.dialect = sqlDialect;
        return this;
    }


    public SqlBuilder withPage(boolean withPage) {
        this.withPage = withPage;
        return this;
    }

    public SqlBuilder withQuoteIdentifiers(boolean quoteIdentifiers) {
        this.quoteIdentifiers = quoteIdentifiers;
        return this;
    }


    /** 依据 Aggregator/Filter/GroupBy/OrderBy 重新构建 SQL：SELECT [groups],[agg] FROM (SQL) T <filters> <groups> <orders> */
    public String build() throws SqlParseException {

        if (executeParam != null && hasComparisonAggregator()) {
            return buildWithComparison(); // 同环比走两阶段自关联
        }

        final SqlNodeList selectList = new SqlNodeList(SqlParserPos.ZERO);

        final SqlNodeList orderBy = new SqlNodeList(SqlParserPos.ZERO);

        final SqlNodeList groupBy = new SqlNodeList(SqlParserPos.ZERO);

        SqlNode where = null;

        SqlNode having = null;

        //function columns
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getFunctionColumns())) {
            for (FunctionColumn functionColumn : executeParam.getFunctionColumns()) {
                functionColumnMap.put(functionColumn.getAlias(), parseSnippet(functionColumn, namePrefix, true));
            }
        }

        //columns
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getColumns())) {
            for (SelectColumn column : executeParam.getColumns()) {
                if (functionColumnMap.containsKey(column.getColumnKey())) {
                    selectList.add(SqlNodeUtils.createAliasNode(functionColumnMap.get(column.getColumnKey()), column.getAlias()));
                } else {
                    selectList.add(SqlNodeUtils.createAliasNode(SqlNodeUtils.createSqlIdentifier(column.getColumnNames(withNamePrefix, namePrefix)), column.getAlias()));
                }
            }
        }

        // filters
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getFilters())) {
            for (FilterOperator filter : executeParam.getFilters()) {
                SqlNode filterSqlNode = filterSqlNode(filter);
                if (filter.getAggOperator() != null) {
                    if (having == null) {
                        having = filterSqlNode;
                    } else {
                        having = new SqlBasicCall(SqlStdOperatorTable.AND, new SqlNode[]{having, filterSqlNode}, SqlParserPos.ZERO);
                    }
                } else {
                    if (where == null) {
                        where = filterSqlNode;
                    } else {
                        where = new SqlBasicCall(SqlStdOperatorTable.AND, new SqlNode[]{where, filterSqlNode}, SqlParserPos.ZERO);
                    }
                }
            }
        }

        //group by
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getGroups())) {
            for (GroupByOperator group : executeParam.getGroups()) {
                SqlNode sqlNode = null;
                if (functionColumnMap.containsKey(group.getColumnKey())) {
                    sqlNode = functionColumnMap.get(group.getColumnKey());
                    selectList.add(SqlNodeUtils.createAliasNode(sqlNode, group.getAlias()));
                } else {
                    sqlNode = SqlNodeUtils.createSqlIdentifier(group.getColumnNames(withNamePrefix, namePrefix));
                    selectList.add(SqlNodeUtils.createAliasNode(sqlNode, group.getAlias()));
                }
                groupBy.add(sqlNode);
            }
        }

        // aggregators
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getAggregators())) {
            for (AggregateOperator aggregator : executeParam.getAggregators()) {
                selectList.add(createAggNode(aggregator));
            }
        }

        //order
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getOrders())) {
            for (OrderOperator order : executeParam.getOrders()) {
                orderBy.add(createOrderNode(order));
            }
        }

        //keywords
        SqlNodeList keywordList = new SqlNodeList(SqlParserPos.ZERO);
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getKeywords())) {
            for (SelectKeyword keyword : executeParam.getKeywords()) {
                keywordList.add(SqlLiteral.createSymbol(SqlSelectKeyword.valueOf(keyword.name()), SqlParserPos.ZERO));
            }
        }

        // fetch &　offset
        SqlNode fetch = null;
        SqlNode offset = null;
        if (executeParam != null && withPage && executeParam.getPageInfo() != null) {
            fetch = SqlLiteral.createExactNumeric(Math.min(executeParam.getPageInfo().getPageSize(), Integer.MAX_VALUE) + "", SqlParserPos.ZERO);
            offset = SqlLiteral.createExactNumeric(Math.min((executeParam.getPageInfo().getPageNo() - 1) * executeParam.getPageInfo().getPageSize(), Integer.MAX_VALUE) + "", SqlParserPos.ZERO);
        }

        if (selectList.size() == 0) {
            selectList.add(SqlIdentifier.star(SqlParserPos.ZERO));
        }
        SqlSelect sqlSelect = new SqlSelect(SqlParserPos.ZERO,
                keywordList,
                selectList,
                queryScriptProcessResult.getFrom(),
                where,
                groupBy.size() > 0 ? groupBy : null,
                having,
                null,
                orderBy.size() > 0 ? orderBy : null,
                offset,
                fetch,
                null);
        return SqlNodeUtils.toSql(sqlSelect, this.dialect, quoteIdentifiers);
    }

    // 是否存在同环比(YOY/MOM)聚合算子
    private boolean hasComparisonAggregator() {
        return !CollectionUtils.isEmpty(executeParam.getAggregators())
                && executeParam.getAggregators().stream()
                .anyMatch(a -> a.getSqlOperator() != null && a.getSqlOperator().isComparison());
    }

    /**
     * 两阶段生成同环比 SQL：内层按 [groups] 聚合，外层通过日期偏移 LEFT JOIN 自关联取对比周期值。
     * 对比侧缺失周期返回 null（不报错位），跨库统一、不依赖 LAG 窗口函数。
     */
    private String buildWithComparison() throws SqlParseException {

        // build() 提前进入本方法时未填充 functionColumnMap，外层解析时间维度依赖它，需在此补齐
        if (executeParam != null && !CollectionUtils.isEmpty(executeParam.getFunctionColumns())) {
            for (FunctionColumn functionColumn : executeParam.getFunctionColumns()) {
                functionColumnMap.put(functionColumn.getAlias(), parseSnippet(functionColumn, namePrefix, true));
            }
        }

        List<AggregateOperator> comparisons = executeParam.getAggregators().stream()
                .filter(a -> a.getSqlOperator() != null && a.getSqlOperator().isComparison())
                .collect(Collectors.toList());

        for (AggregateOperator cmp : comparisons) {
            if (cmp.getCompareColumn() == null || cmp.getCompareColumn().length == 0) {
                Exceptions.msg("message.provider.compare.time.column.required", cmp.getSqlOperator().name());
            }
            // 时间维度字段需实际存在于分组中：删除后 compareColumn 可能残留，需提前给出明确提示
            if (!hasTimeDimensionGroup(cmp.getCompareColumn())) {
                Exceptions.msg("message.provider.compare.time.column.required", cmp.getSqlOperator().name());
            }
        }

        // 内层移除 comparison 算子，并为每个 comparison 追加基础聚合列（cur）
        List<AggregateOperator> innerAggregators = executeParam.getAggregators().stream()
                .filter(a -> a.getSqlOperator() == null || !a.getSqlOperator().isComparison())
                .collect(Collectors.toList());
        Map<String, String> curAliasByCmpAlias = new HashMap<>();
        for (AggregateOperator cmp : comparisons) {
            AggregateOperator cur = new AggregateOperator();
            cur.setSqlOperator(resolveBaseAggregator(cmp));
            cur.setColumn(cmp.getColumn());
            cur.setAlias(cmp.getAlias() + "__cur");
            innerAggregators.add(cur);
            curAliasByCmpAlias.put(cmp.getAlias(), cur.getAlias());
        }

        // 收集所有同环比的时间维度原始列名，用于识别"作用于时间维度的日期过滤"
        List<String[]> timeColumns = comparisons.stream()
                .map(AggregateOperator::getCompareColumn)
                .filter(c -> c != null && c.length > 0)
                .distinct()
                .collect(Collectors.toList());

        // cur 内层：应用全部 filter，保证最终返回数据只在过滤范围内
        ExecuteParam innerParamCur = buildInnerParam(innerAggregators, executeParam.getFilters());

        // p 内层：去掉作用于同环比时间维度列的 filter，使对比侧不被当前日期过滤截断。
        // 仅对 executeParam.getFilters() 生效；脚本内 WHERE 过滤(如 $START_DATE$)需改为图表 Filter 或放宽起始日期
        List<FilterOperator> pFilters = CollectionUtils.isEmpty(executeParam.getFilters())
                ? executeParam.getFilters()
                : executeParam.getFilters().stream()
                .filter(f -> !isTimeDimensionFilter(f, timeColumns))
                .collect(Collectors.toList());
        ExecuteParam innerParamP = buildInnerParam(innerAggregators, pFilters);

        String innerSqlCur = SqlBuilder.builder()
                .withExecuteParam(innerParamCur)
                .withDialect(dialect)
                .withQueryScriptProcessResult(queryScriptProcessResult)
                .withAddDefaultNamePrefix(withNamePrefix)
                .withDefaultNamePrefix(namePrefix)
                .withPage(false)
                .withQuoteIdentifiers(quoteIdentifiers)
                .build();

        String innerSqlP = SqlBuilder.builder()
                .withExecuteParam(innerParamP)
                .withDialect(dialect)
                .withQueryScriptProcessResult(queryScriptProcessResult)
                .withAddDefaultNamePrefix(withNamePrefix)
                .withDefaultNamePrefix(namePrefix)
                .withPage(false)
                .withQuoteIdentifiers(quoteIdentifiers)
                .build();

        return buildComparisonOuter(innerSqlCur, innerSqlP, comparisons, curAliasByCmpAlias);
    }

    // 构造内层 ExecuteParam：组装除 aggregators 外的其余字段（移除 comparison、追加基础列由调用方完成）
    private ExecuteParam buildInnerParam(List<AggregateOperator> innerAggregators, List<FilterOperator> filters) {
        ExecuteParam innerParam = new ExecuteParam();
        innerParam.setKeywords(executeParam.getKeywords());
        innerParam.setColumns(executeParam.getColumns());
        innerParam.setAggregators(innerAggregators);
        innerParam.setFilters(filters);
        innerParam.setGroups(executeParam.getGroups());
        innerParam.setOrders(executeParam.getOrders());
        innerParam.setFunctionColumns(executeParam.getFunctionColumns());
        innerParam.setIncludeColumns(executeParam.getIncludeColumns());
        innerParam.setPageInfo(executeParam.getPageInfo());
        innerParam.setServerAggregate(executeParam.isServerAggregate());
        innerParam.setConcurrencyOptimize(executeParam.isConcurrencyOptimize());
        innerParam.setCacheEnable(executeParam.isCacheEnable());
        innerParam.setCacheExpires(executeParam.getCacheExpires());
        return innerParam;
    }

    // filter 列与任一 comparison 的 compareColumn 完全匹配时，视为时间维度日期过滤，对比侧应放宽
    private boolean isTimeDimensionFilter(FilterOperator filter, List<String[]> timeColumns) {
        if (filter == null || filter.getColumn() == null || CollectionUtils.isEmpty(timeColumns)) {
            return false;
        }
        for (String[] tc : timeColumns) {
            if (Arrays.equals(filter.getColumn(), tc)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 构造外层 SELECT，通过"日期偏移自关联"取对比周期值，缺失周期也能对准真实日历周期。
     * <pre>
     * SELECT cur.[groups], <result columns>
     * FROM (innerSqlCur) cur
     * LEFT JOIN (innerSqlP) p0 ON <非时间维度分组列相等> AND p0.[time] = <偏移1>
     * LEFT JOIN (innerSqlP) p1 ON <非时间维度分组列相等> AND p1.[time] = <偏移2>
     * ...
     * </pre>
     * p0/p1/... 复用同一份 innerSqlP（仅别名与偏移表达式不同）；同偏移复用一次 JOIN，不同偏移各自 JOIN。
     * 注：prev/p 为 Calcite 保留字，会导致 SqlParserVariableResolver 解析失败，故用 p0/p1/... 作别名。
     */
    private String buildComparisonOuter(
            String innerSqlCur,
            String innerSqlP,
            List<AggregateOperator> comparisons,
            Map<String, String> curAliasByCmpAlias) {

        AggregateOperator first = comparisons.get(0);
        // 时间维度/分组列别名可能含粒度函数合成名(分隔符、中文)，需按方言 quote
        String timeAlias = quote(resolveTimeDimensionAlias(first.getCompareColumn()));
        List<String> partitionAliases = resolvePartitionAliases(first.getCompareColumn())
                .stream().map(this::quote).collect(Collectors.toList());

        boolean formatted = resolveTimeColumnFormatted(first.getCompareColumn());

        StringBuilder outer = new StringBuilder("SELECT ");

        // 透传列：时间维度 + 非时间维度分组列 + 普通指标列（非同环比，否则图表会丢指标）
        List<String> passthrough = new ArrayList<>();
        passthrough.add(timeAlias);
        passthrough.addAll(partitionAliases);
        if (!CollectionUtils.isEmpty(executeParam.getAggregators())) {
            executeParam.getAggregators().stream()
                    .filter(a -> !(a.getSqlOperator() != null && a.getSqlOperator().isComparison()))
                    .map(a -> quote(a.getAlias()))
                    .distinct()
                    .forEach(passthrough::add);
        }
        if (!passthrough.isEmpty()) {
            outer.append(passthrough.stream()
                    .map(a -> "cur." + a + " AS " + a)
                    .collect(Collectors.joining(", ")));
            outer.append(", ");
        }

        // 按偏移表达式分组：相同偏移复用同一 JOIN，不同偏移各自 JOIN
        List<String> joinClauses = new ArrayList<>();
        Map<String, String> offsetToPAlias = new LinkedHashMap<>();
        Map<AggregateOperator, String> cmpToPAlias = new HashMap<>();
        for (AggregateOperator cmp : comparisons) {
            // 计算上一周期/去年同期的时间偏移表达式，并校验库支持与粒度可行
            String prevTimeExpr = resolvePrevTimeExpr(cmp, timeAlias, formatted);
            String pAlias = offsetToPAlias.computeIfAbsent(prevTimeExpr, k -> {
                String alias = "p" + joinClauses.size();
                // JOIN 条件：非时间维度分组列相等 + prev 时间列 = cur 时间列偏移后的周期
                List<String> conditions = new ArrayList<>();
                partitionAliases.forEach(a -> conditions.add("cur." + a + " = " + alias + "." + a));
                conditions.add(alias + "." + timeAlias + " = " + k);
                joinClauses.add(" LEFT JOIN (" + innerSqlP + ") " + alias
                        + " ON " + String.join(" AND ", conditions));
                return alias;
            });
            cmpToPAlias.put(cmp, pAlias);
        }

        // 结果列：按各自 p 别名取对比周期值，按返回值类型(值/差/增长率)生成
        List<String> resultColumns = new ArrayList<>();
        for (AggregateOperator cmp : comparisons) {
            String rawResultAlias = StringUtils.isNotBlank(cmp.getAlias())
                    ? cmp.getAlias() : curAliasByCmpAlias.get(cmp.getAlias());
            String curAlias = quote(curAliasByCmpAlias.get(cmp.getAlias()));
            String resultAlias = quote(rawResultAlias);
            String prevExpr = cmpToPAlias.get(cmp) + "." + curAlias;
            switch (cmp.getReturnType() == null
                    ? AggregateOperator.ComparisonReturnType.GROWTH : cmp.getReturnType()) {
                case VALUE:
                    resultColumns.add(prevExpr + " AS " + resultAlias);
                    break;
                case DIFF:
                    resultColumns.add("(cur." + curAlias + " - " + prevExpr + ") AS " + resultAlias);
                    break;
                case GROWTH:
                default:
                    resultColumns.add("((cur." + curAlias + " - " + prevExpr + ") / NULLIF(" + prevExpr + ", 0)) AS " + resultAlias);
                    break;
            }
        }

        outer.append(String.join(", ", resultColumns));
        outer.append(" FROM (").append(innerSqlCur).append(") cur");
        joinClauses.forEach(outer::append);

        return outer.toString();
    }

    // 非时间维度分组列别名，用于外层透传与 JOIN 等值条件
    private List<String> resolvePartitionAliases(String[] timeColumn) {
        if (CollectionUtils.isEmpty(executeParam.getGroups())) {
            return Collections.emptyList();
        }
        return executeParam.getGroups().stream()
                .filter(g -> !isDateLevelGroup(g))        // 排除日期粒度函数时间维度 group
                .filter(g -> !Arrays.equals(g.getColumn(), timeColumn))  // 排除 compareColumn 匹配的 group
                .map(this::aliasOf)
                .distinct()
                .collect(Collectors.toList());
    }

    // 时间维度分组别名：优先取日期粒度函数 group(AGG_DATE_*)，否则取 compareColumn 匹配的 group
    private String resolveTimeDimensionAlias(String[] timeColumn) {
        if (CollectionUtils.isEmpty(executeParam.getGroups())) {
            return String.join(".", timeColumn);
        }
        Optional<GroupByOperator> dateLevel = executeParam.getGroups().stream()
                .filter(this::isDateLevelGroup)
                .findFirst();
        if (dateLevel.isPresent()) {
            return aliasOf(dateLevel.get());
        }
        return executeParam.getGroups().stream()
                .filter(g -> Arrays.equals(g.getColumn(), timeColumn))
                .findFirst()
                .map(this::aliasOf)
                .orElse(String.join(".", timeColumn));
    }

    // 分组中是否存在同环比所需的时间维度列（日期粒度函数或 compareColumn 匹配），用于提前校验
    private boolean hasTimeDimensionGroup(String[] timeColumn) {
        if (CollectionUtils.isEmpty(executeParam.getGroups())) {
            return false;
        }
        if (executeParam.getGroups().stream().anyMatch(this::isDateLevelGroup)) {
            return true;
        }
        return executeParam.getGroups().stream()
                .anyMatch(g -> Arrays.equals(g.getColumn(), timeColumn));
    }

    // 分组列是否使用日期粒度函数(AGG_DATE_*)，即内层是否输出周期字符串列
    private boolean isDateLevelGroup(GroupByOperator g) {
        if (functionColumnMap.isEmpty() || g.getColumnKey() == null) {
            return false;
        }
        SqlNode node = functionColumnMap.get(g.getColumnKey());
        return node != null && node.toString().contains("AGG_DATE_");
    }

    private String aliasOf(GroupByOperator g) {
        return StringUtils.isNotBlank(g.getAlias())
                ? g.getAlias()
                : (g.getColumnKey() != null ? g.getColumnKey() : String.join(".", g.getColumn()));
    }

    // 强制 quote 标识符：dialect.quoteIdentifier 默认只对需转义名加引号，中文/普通列名会原样返回
    // 导致外层出现裸的 cur.统计日期；故用 SqlNodeUtils.toSql(..., withQuoteAllIdentifiers=true)
    private String quote(String identifier) {
        if (StringUtils.isBlank(identifier)) {
            return identifier;
        }
        if (isQuoted(identifier)) {
            return identifier;
        }
        return SqlNodeUtils.toSql(new SqlIdentifier(identifier, SqlParserPos.ZERO), dialect, true);
    }

    private boolean isQuoted(String identifier) {
        return (identifier.startsWith("`") && identifier.endsWith("`"))
                || (identifier.startsWith("\"") && identifier.endsWith("\""));
    }

    // 时间维度列是否由粒度函数(AGG_DATE_*)生成（周期字符串如 '2023-01'，需先转日期再偏移）
    private boolean resolveTimeColumnFormatted(String[] timeColumn) {
        return !CollectionUtils.isEmpty(executeParam.getGroups())
                && executeParam.getGroups().stream().anyMatch(this::isDateLevelGroup);
    }

    /**
     * 计算"上一周期/去年同期"的时间偏移表达式，并做可行性校验。
     * <ul>
     *   <li>环比(MOM)：偏移 1 个当前粒度单位</li>
     *   <li>同比(YOY)：偏移 1 年</li>
     * </ul>
     */
    private String resolvePrevTimeExpr(AggregateOperator cmp, String timeAlias, boolean formatted) {
        DateOffsetDialectSupport support = DateOffsetDialectSupport.of(dialect);
        if (support == null || !support.supportsDateOffset()) {
            Exceptions.msg("message.provider.compare.date.offset.unsupported",
                    dialect.getClass().getSimpleName());
        }
        // 时间列的实际粒度(决定周期字符串格式)，如 MONTH -> '%Y-%m'
        String timeUnit = formatted ? resolveDateLevelUnit() : null;
        // 偏移单位：同比固定偏移 1 年；环比偏移 1 个时间列粒度单位
        String offsetUnit = cmp.getSqlOperator() == AggregateOperator.SqlOperator.YOY
                ? "YEAR" : (formatted ? timeUnit : offsetUnitForNative(cmp));

        // 周期字符串列(AGG_DATE_* 输出)需先解析为日期再偏移再还原；QUARTER/WEEK 无法可靠还原
        if (formatted) {
            String fmt = support.periodFormat(timeUnit);
            if (fmt == null) {
                Exceptions.msg("message.provider.compare.date.offset.granularity.unsupported",
                        cmp.getSqlOperator().name(), timeUnit);
            }
            String expr = support.dateOffsetFormatted("cur." + timeAlias, 1, offsetUnit, fmt);
            if (expr == null) {
                Exceptions.msg("message.provider.compare.date.offset.granularity.unsupported",
                        cmp.getSqlOperator().name(), timeUnit);
            }
            return expr;
        }
        return support.dateOffset("cur." + timeAlias, 1, offsetUnit);
    }

    /**
     * 偏移单位(原生日期列)：环比取当前粒度单位；同比固定为 YEAR。
     */
    private String offsetUnitForNative(AggregateOperator cmp) {
        if (cmp.getSqlOperator() == AggregateOperator.SqlOperator.YOY) {
            return "YEAR";
        }
        String unit = granularityUnit(cmp.getGranularity());
        return unit == null ? "DAY" : unit;
    }

    /**
     * 时间列的实际粒度，从时间维度粒度函数(AGG_DATE_*)推断。
     * 决定周期字符串格式与环比偏移单位。
     */
    private String resolveDateLevelUnit() {
        if (CollectionUtils.isEmpty(executeParam.getFunctionColumns())) {
            return null;
        }
        for (FunctionColumn fc : executeParam.getFunctionColumns()) {
            String snippet = fc.getSnippet();
            if (snippet == null) {
                continue;
            }
            if (snippet.contains("AGG_DATE_YEAR")) {
                return "YEAR";
            }
            if (snippet.contains("AGG_DATE_QUARTER")) {
                return "QUARTER";
            }
            if (snippet.contains("AGG_DATE_MONTH")) {
                return "MONTH";
            }
            if (snippet.contains("AGG_DATE_WEEK")) {
                return "WEEK";
            }
            if (snippet.contains("AGG_DATE_DAY")) {
                return "DAY";
            }
        }
        return null;
    }

    private String granularityUnit(AggregateOperator.ComparisonGranularity g) {
        if (g == null) {
            return null;
        }
        switch (g) {
            case YEAR:
                return "YEAR";
            case QUARTER:
                return "QUARTER";
            case MONTH:
                return "MONTH";
            case WEEK:
                return "WEEK";
            case DAY:
            default:
                return "DAY";
        }
    }

    /**
     * 同环比默认基于 SUM 聚合当前期值，可用 baseAggregator 覆盖。
     */
    private AggregateOperator.SqlOperator resolveBaseAggregator(AggregateOperator cmp) {
        return cmp.getBaseAggregator() != null
                ? cmp.getBaseAggregator()
                : AggregateOperator.SqlOperator.SUM;
    }

    private SqlNode createAggNode(AggregateOperator operator) {
        SqlNode sqlNode;
        String columnKey = operator.getColumnKey();
        if (functionColumnMap.containsKey(columnKey)) {
            sqlNode = functionColumnMap.get(columnKey);
        } else {
            sqlNode = SqlNodeUtils.createSqlIdentifier(operator.getColumnNames(withNamePrefix, namePrefix));
        }
        SqlOperator sqlOp = mappingSqlAggFunction(operator.getSqlOperator());
        SqlNode aggCall;
        if (operator.getSqlOperator() == null) {
            aggCall = sqlNode;
        } else if (operator.getSqlOperator() == AggregateOperator.SqlOperator.COUNT_DISTINCT) {
            aggCall = SqlNodeUtils
                    .createSqlBasicCall(sqlOp, Collections.singletonList(sqlNode),
                            SqlLiteral.createSymbol(SqlSelectKeyword.DISTINCT, SqlParserPos.ZERO));
        } else {
            aggCall = SqlNodeUtils
                    .createSqlBasicCall(sqlOp, Collections.singletonList(sqlNode));
        }

        if (StringUtils.isNotBlank(operator.getAlias())) {
            return SqlNodeUtils.createAliasNode(aggCall, operator.getAlias());
        } else {
            return aggCall;
        }
    }

    private SqlNode createOrderNode(OrderOperator operator) {
        SqlNode sqlNode;
        if (functionColumnMap.containsKey(operator.getColumnKey())) {
            sqlNode = functionColumnMap.get(operator.getColumnKey());
        } else {
            if (operator.getColumnKey() == null) {
                sqlNode = SqlLiteral.createNull(SqlParserPos.ZERO);
            } else {
                sqlNode = SqlNodeUtils.createSqlIdentifier(operator.getColumnNames(withNamePrefix, namePrefix));
            }
        }
        if (operator.getAggOperator() != null) {
            SqlOperator aggOperator = mappingSqlAggFunction(operator.getAggOperator());
            sqlNode = new SqlBasicCall(aggOperator,
                    new SqlNode[]{sqlNode}, SqlParserPos.ZERO);
        }
        if (operator.getOperator() == OrderOperator.SqlOperator.DESC) {
            return new SqlBasicCall(SqlStdOperatorTable.DESC,
                    new SqlNode[]{sqlNode}, SqlParserPos.ZERO);
        } else {
            return sqlNode;
        }
    }


    private SqlNode filterSqlNode(FilterOperator operator) {
        SqlNode column;
        if (operator.getAggOperator() != null) {
            AggregateOperator agg = new AggregateOperator();
            agg.setSqlOperator(operator.getAggOperator());
            agg.setColumn(operator.getColumnNames(false, null));
            column = createAggNode(agg);
        } else {
            if (functionColumnMap.containsKey(operator.getColumnKey())) {
                column = functionColumnMap.get(operator.getColumnKey());
            } else {
                column = SqlNodeUtils.createSqlIdentifier(operator.getColumnNames(withNamePrefix, namePrefix));
            }
        }
        List<SqlNode> nodes = Arrays.stream(operator.getValues())
                .map(this::convertTypedValue)
                .collect(Collectors.toList());

        SqlNode[] sqlNodes = null;

        org.apache.calcite.sql.SqlOperator sqlOp = null;
        switch (operator.getSqlOperator()) {
            case IN:
                sqlOp = SqlStdOperatorTable.IN;
                sqlNodes = new SqlNode[]{column, new SqlNodeList(nodes, SqlParserPos.ZERO)};
                break;
            case NOT_IN:
                sqlOp = SqlStdOperatorTable.NOT_IN;
                sqlNodes = new SqlNode[]{column, new SqlNodeList(nodes, SqlParserPos.ZERO)};
                break;
            case EQ:
                sqlOp = SqlStdOperatorTable.EQUALS;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case GT:
                sqlOp = SqlStdOperatorTable.GREATER_THAN;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case LT:
                sqlOp = SqlStdOperatorTable.LESS_THAN;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case NE:
                sqlOp = SqlStdOperatorTable.NOT_EQUALS;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case GTE:
                sqlOp = SqlStdOperatorTable.GREATER_THAN_OR_EQUAL;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case LTE:
                sqlOp = SqlStdOperatorTable.LESS_THAN_OR_EQUAL;
                sqlNodes = new SqlNode[]{column, nodes.get(0)};
                break;
            case LIKE:
                operator.getValues()[0].setValue("%" + operator.getValues()[0].getValue() + "%");
                sqlOp = SqlStdOperatorTable.LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case PREFIX_LIKE:
                operator.getValues()[0].setValue(operator.getValues()[0].getValue() + "%");
                sqlOp = SqlStdOperatorTable.LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case SUFFIX_LIKE:
                operator.getValues()[0].setValue("%" + operator.getValues()[0].getValue());
                sqlOp = SqlStdOperatorTable.LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case NOT_LIKE:
                operator.getValues()[0].setValue("%" + operator.getValues()[0].getValue() + "%");
                sqlOp = SqlStdOperatorTable.NOT_LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case PREFIX_NOT_LIKE:
                operator.getValues()[0].setValue(operator.getValues()[0].getValue() + "%");
                sqlOp = SqlStdOperatorTable.NOT_LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case SUFFIX_NOT_LIKE:
                operator.getValues()[0].setValue("%" + operator.getValues()[0].getValue());
                sqlOp = SqlStdOperatorTable.NOT_LIKE;
                sqlNodes = new SqlNode[]{column, convertTypedValue(operator.getValues()[0])};
                break;
            case IS_NULL:
                sqlOp = SqlStdOperatorTable.IS_NULL;
                sqlNodes = new SqlNode[]{column};
                break;
            case NOT_NULL:
                sqlOp = SqlStdOperatorTable.IS_NOT_NULL;
                sqlNodes = new SqlNode[]{column};
                break;
            case BETWEEN:
                sqlOp = new CustomSqlBetweenOperator(
                        SqlBetweenOperator.Flag.ASYMMETRIC,
                        false);
                nodes.add(0, column);
                sqlNodes = nodes.toArray(new SqlNode[0]);
                break;
            case NOT_BETWEEN:
                sqlOp = new CustomSqlBetweenOperator(
                        SqlBetweenOperator.Flag.ASYMMETRIC,
                        true);
                nodes.add(0, column);
                sqlNodes = nodes.toArray(new SqlNode[0]);
                break;
            default:
                Exceptions.msg("message.provider.sql.type.unsupported", operator.getSqlOperator().name());
        }
        return new SqlBasicCall(sqlOp, sqlNodes, SqlParserPos.ZERO);
    }

    /**
     * parse function column ,and register the column functions
     *
     * @param column    function column
     * @param tableName table where function to execute
     * @param register  whether register this function as build function
     */
    private SqlNode parseSnippet(FunctionColumn column, String tableName, boolean register) throws SqlParseException {
        SqlSelect sqlSelect = (SqlSelect) SqlParserUtils.parseSnippet(column.getSnippet());
        SqlNode sqlNode = sqlSelect.getSelectList().get(0);
        if (!(sqlNode instanceof SqlCall)) {
            return sqlNode;
        }
        if (withNamePrefix && StringUtils.isNotBlank(tableName)) {
            completionIdentifier((SqlCall) sqlNode, tableName);
        }
        if (register) {
            SqlFunctionRegisterVisitor visitor = new SqlFunctionRegisterVisitor();
            visitor.visit((SqlCall) sqlNode);
        }
        return sqlNode;
    }

    private void completionIdentifier(SqlCall call, String tableName) {
        List<SqlNode> operandList = call.getOperandList();
        for (int i = 0; i < operandList.size(); i++) {
            SqlNode sqlNode = operandList.get(i);
            if (sqlNode instanceof SqlIdentifier) {
                SqlIdentifier identifier = (SqlIdentifier) sqlNode;
                if (identifier.names.size() == 1) {
                    call.setOperand(i, SqlNodeUtils.createSqlIdentifier(tableName, identifier.names.get(0)));
                }
            } else if (sqlNode instanceof SqlCall) {
                completionIdentifier((SqlCall) sqlNode, tableName);
            }
        }
    }

    private SqlNode convertTypedValue(SingleTypedValue typedValue) {
        if (typedValue.getValueType().equals(ValueType.SNIPPET) && functionColumnMap.containsKey(typedValue.getValue().toString())) {
            return functionColumnMap.get(typedValue.getValue().toString());
        }
        return SqlNodeUtils.createSqlNode(typedValue);
    }

    private SqlAggFunction mappingSqlAggFunction(AggregateOperator.SqlOperator sqlOperator) {
        if (sqlOperator == null) {
            return null;
        }
        switch (sqlOperator) {
            case AVG:
                return SqlStdOperatorTable.AVG;
            case MAX:
                return SqlStdOperatorTable.MAX;
            case MIN:
                return SqlStdOperatorTable.MIN;
            case SUM:
                return SqlStdOperatorTable.SUM;
            case COUNT:
            case COUNT_DISTINCT:
                return SqlStdOperatorTable.COUNT;
            case MEDIAN:
                return StatisticalAggregateFunction.MEDIAN;
            case QUARTILE_1:
                return StatisticalAggregateFunction.QUARTILE_1;
            case QUARTILE_3:
                return StatisticalAggregateFunction.QUARTILE_3;
            default:
                Exceptions.msg("message.provider.sql.type.unsupported", sqlOperator.name());
        }
        return null;
    }

}
