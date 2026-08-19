/*
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package datart.data.provider.calcite;

import datart.core.base.consts.ValueType;
import datart.core.base.consts.VariableTypeEnum;
import datart.core.data.provider.ExecuteParam;
import datart.core.data.provider.QueryScript;
import datart.core.data.provider.ScriptType;
import datart.core.data.provider.ScriptVariable;
import datart.core.data.provider.SingleTypedValue;
import datart.core.data.provider.sql.AggregateOperator;
import datart.core.data.provider.sql.FilterOperator;
import datart.core.data.provider.sql.FunctionColumn;
import datart.core.data.provider.sql.GroupByOperator;
import datart.data.provider.calcite.dialect.H2Dialect;
import datart.data.provider.calcite.dialect.MysqlSqlStdOperatorSupport;
import datart.data.provider.jdbc.SqlScriptRender;
import org.apache.calcite.sql.SqlNode;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ComparisonAggregateSqlTest {

    @Test
    void shouldRenderMoMWithDateOffsetJoin() throws Exception {
        String sql = render(comparison(
                AggregateOperator.SqlOperator.MOM,
                AggregateOperator.ComparisonReturnType.VALUE));

        String normalized = normalize(sql);
        // 外层通过日期偏移自关联(LEFT JOIN)，而非 LAG 窗口函数
        assertTrue(normalized.contains("LEFTJOIN"), sql);
        assertTrue(normalized.contains("DATEADD('MONTH',-1,CUR.MONTH)"), sql);
        assertTrue(normalized.contains("P0.MONTH=DATEADD('MONTH',-1,CUR.MONTH)"), sql);
        assertTrue(normalized.contains("CUR.CATEGORY=P0.CATEGORY"), sql);
        // 结果列取 prev 侧基础聚合值
        assertTrue(normalized.contains("P0.MONTH_SALES__CURASMONTH_SALES"), sql);
        // 内层必须包含当前期的 SUM 聚合
        assertTrue(normalized.contains("SUM(DATART_VTABLE.AMOUNT)ASMONTH_SALES__CUR"), sql);
    }

    @Test
    void shouldRenderYoYOffsetOneYear() throws Exception {
        String sql = render(comparison(
                AggregateOperator.SqlOperator.YOY,
                AggregateOperator.ComparisonReturnType.VALUE));

        String normalized = normalize(sql);
        // 同比：按日期偏移 1 年
        assertTrue(normalized.contains("DATEADD('YEAR',-1,CUR.MONTH)"), sql);
    }

    @Test
    void shouldRenderSeparateJoinsForDifferentOffsets() throws Exception {
        // 多个同环比指标偏移不同(同比偏移1年、环比偏移1月)时，必须各自独立 JOIN，
        // 不能都按第一个指标的偏移对齐(否则环比会被同比带偏)。
        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator month = new GroupByOperator();
        month.setColumn("ym");
        month.setAlias("month");

        AggregateOperator yoy = new AggregateOperator();
        yoy.setSqlOperator(AggregateOperator.SqlOperator.YOY);
        yoy.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        yoy.setColumn("amount");
        yoy.setAlias("yoy_sales");
        yoy.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        yoy.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        yoy.setCompareColumn(new String[]{"ym"});

        AggregateOperator mom = new AggregateOperator();
        mom.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        mom.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        mom.setColumn("amount");
        mom.setAlias("mom_sales");
        mom.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        mom.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        mom.setCompareColumn(new String[]{"ym"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Arrays.asList(yoy, mom))
                .groups(Arrays.asList(category, month))
                .build();
        String sql = render(param);
        String normalized = normalize(sql);

        // 两个不同偏移 → 两个独立 JOIN：p0 为同比(YEAR 偏移)、p1 为环比(MONTH 偏移)
        assertTrue(normalized.contains("DATEADD('MONTH',-1,CUR.MONTH)"), sql);
        assertTrue(normalized.contains("DATEADD('YEAR',-1,CUR.MONTH)"), sql);
        // 同比(YOY)引用 p0(年偏移)，环比(MOM)引用 p1(月偏移)，各自对齐，不能共用同一个 JOIN
        assertTrue(normalized.contains("P0.YOY_SALES__CURASYOY_SALES"), sql);
        assertTrue(normalized.contains("P1.MOM_SALES__CURASMOM_SALES"), sql);
    }

    @Test
    void shouldRelaxDateFilterOnComparisonSide() throws Exception {
        // 日期过滤作用于同环比的时间维度列时，当前期(cur)应受过滤、对比侧(p)应放宽，
        // 从而对比侧能取到去年同期/上期数据，而最终返回数据仍在过滤范围内。
        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator month = new GroupByOperator();
        month.setColumn("ym");
        month.setAlias("month");

        AggregateOperator yoy = new AggregateOperator();
        yoy.setSqlOperator(AggregateOperator.SqlOperator.YOY);
        yoy.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        yoy.setColumn("amount");
        yoy.setAlias("yoy_sales");
        yoy.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        yoy.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        yoy.setCompareColumn(new String[]{"ym"});

        // 作用于时间维度列(ym)的日期过滤
        FilterOperator dateFilter = new FilterOperator();
        dateFilter.setColumn(new String[]{"ym"});
        dateFilter.setSqlOperator(FilterOperator.SqlOperator.GTE);
        dateFilter.setValues(new SingleTypedValue[]{new SingleTypedValue("2023-01-01", datart.core.base.consts.ValueType.DATE)});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Arrays.asList(yoy))
                .groups(Arrays.asList(category, month))
                .filters(Arrays.asList(dateFilter))
                .build();
        String sql = render(param);
        String normalized = normalize(sql);

        // 当前期(cur)内层应含日期过滤
        assertTrue(normalized.contains("DATART_VTABLE.YM>='2023-01-01'"), sql);
        // 对比侧(p0)内层不应含该日期过滤(已放宽)：取 p0 子查询块(LEFT JOIN (... ) p0 ON) 检查
        int p0BlockStart = normalized.indexOf("LEFTJOIN(");
        int p0BlockEnd = normalized.indexOf("P0ON", p0BlockStart);
        assertTrue(p0BlockStart > 0 && p0BlockEnd > p0BlockStart, sql);
        String p0Block = normalized.substring(p0BlockStart, p0BlockEnd);
        assertFalse(p0Block.contains("YM>='2023-01-01'"), "对比侧 p0 内层不应含时间维度日期过滤: " + sql);
    }

    @Test
    void shouldExecuteMoMValueInH2() throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection connection = DriverManager.getConnection(
                "jdbc:h2:mem:comparison_aggregate_test", "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE TABLE sales (ym DATE, category VARCHAR(10), amount DECIMAL(10, 2))");
            statement.execute(
                    "INSERT INTO sales (ym, category, amount) VALUES "
                            + "('2023-01-01','A',100),('2023-02-01','A',120),('2023-04-01','A',90),"
                            + "('2023-01-01','B',50),('2023-02-01','B',70)");

            ExecuteParam param = comparison(
                    AggregateOperator.SqlOperator.MOM,
                    AggregateOperator.ComparisonReturnType.VALUE);

            String sql = new SqlScriptRender(
                    QueryScript.builder()
                            .script("SELECT ym, category, amount FROM sales")
                            .scriptType(ScriptType.SQL)
                            .variables(Collections.emptyList())
                            .build(),
                    param,
                    new H2Dialect()).render(true, false, false);

            // 完整周期：A/2023-02 的环比上一期 = 2023-01 = 100
            assertValue(statement.executeQuery(sql), "A", "2023-02-01", "100.00");
            // 缺失周期(2023-03)时对齐真实日历：A/2023-04 上一期=2023-03 无数据 → prev 为 null
            assertNullValue(statement.executeQuery(sql), "A", "2023-04-01");
            // B/2023-02 环比上一期 = B/2023-01 = 50
            assertValue(statement.executeQuery(sql), "B", "2023-02-01", "50.00");
        }
    }

    @Test
    void shouldExecuteMoMValueWithDateLevelColumnInH2() throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection connection = DriverManager.getConnection(
                "jdbc:h2:mem:comparison_datelvl_test", "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE TABLE sales (ym DATE, category VARCHAR(10), amount DECIMAL(10, 2))");
            statement.execute(
                    "INSERT INTO sales (ym, category, amount) VALUES "
                            + "('2023-01-01','A',100),('2023-02-01','A',120),('2023-03-01','A',90)");

            FunctionColumn dateLevelColumn = new FunctionColumn();
            dateLevelColumn.setAlias("ym@date_level_delimiter@AGG_DATE_MONTH");
            dateLevelColumn.setSnippet("AGG_DATE_MONTH([ym])");

            GroupByOperator time = new GroupByOperator();
            time.setColumn("ym@date_level_delimiter@AGG_DATE_MONTH");
            time.setAlias("ym@date_level_delimiter@AGG_DATE_MONTH");

            AggregateOperator aggregate = new AggregateOperator();
            aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
            aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
            aggregate.setColumn("amount");
            aggregate.setAlias("month_sales");
            aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
            aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
            aggregate.setCompareColumn(new String[]{"ym"});

            ExecuteParam param = ExecuteParam.builder()
                    .aggregators(Collections.singletonList(aggregate))
                    .groups(Collections.singletonList(time))
                    .functionColumns(Collections.singletonList(dateLevelColumn))
                    .build();

            String sql = new SqlScriptRender(
                    QueryScript.builder()
                            .script("SELECT ym, category, amount FROM sales")
                            .scriptType(ScriptType.SQL)
                            .variables(Collections.emptyList())
                            .build(),
                    param,
                    new H2Dialect()).render(true, false, false);
            System.out.println("DATELVL_MOM_SQL>>>" + sql);

            // 时间列按 AGG_DATE_MONTH 输出 '2023-02'，环比上一期=DATEADD(月,-1)='2023-01' → 100
            try (ResultSet rs = statement.executeQuery(sql)) {
                boolean found = false;
                while (rs.next()) {
                    if ("2023-02".equals(rs.getString("ym@date_level_delimiter@AGG_DATE_MONTH"))) {
                        assertEquals("100.00",
                                rs.getBigDecimal("month_sales").setScale(2).toPlainString());
                        found = true;
                    }
                }
                assertTrue(found, "2023-02 row not found");
            }
        }
    }

    @Test
    void shouldExecuteMoMWeekDateLevelInH2() throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection connection = DriverManager.getConnection(
                "jdbc:h2:mem:comparison_week_test", "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "CREATE TABLE sales (ym DATE, category VARCHAR(10), amount DECIMAL(10, 2))");
            statement.execute(
                    "INSERT INTO sales (ym, category, amount) VALUES "
                            + "('2026-08-10','A',100),('2026-08-17','A',120)");

            FunctionColumn dateLevelColumn = new FunctionColumn();
            dateLevelColumn.setAlias("ym@date_level_delimiter@AGG_DATE_WEEK");
            dateLevelColumn.setSnippet("AGG_DATE_WEEK([ym])");

            GroupByOperator time = new GroupByOperator();
            time.setColumn("ym@date_level_delimiter@AGG_DATE_WEEK");
            time.setAlias("ym@date_level_delimiter@AGG_DATE_WEEK");

            AggregateOperator aggregate = new AggregateOperator();
            aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
            aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
            aggregate.setColumn("amount");
            aggregate.setAlias("week_sales");
            aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
            aggregate.setCompareColumn(new String[]{"ym"});

            ExecuteParam param = ExecuteParam.builder()
                    .aggregators(Collections.singletonList(aggregate))
                    .groups(Collections.singletonList(time))
                    .functionColumns(Collections.singletonList(dateLevelColumn))
                    .build();

            String sql = new SqlScriptRender(
                    QueryScript.builder()
                            .script("SELECT ym, category, amount FROM sales")
                            .scriptType(ScriptType.SQL)
                            .variables(Collections.emptyList())
                            .build(),
                    param,
                    new H2Dialect()).render(true, false, false);
            System.out.println("WEEK_MOM_SQL>>>" + sql);

            try (ResultSet rs = statement.executeQuery(sql)) {
                boolean found = false;
                while (rs.next()) {
                    String week = rs.getString("ym@date_level_delimiter@AGG_DATE_WEEK");
                    if (week != null && week.endsWith("-34")) {
                        assertEquals("100.00",
                                rs.getBigDecimal("week_sales").setScale(2).toPlainString());
                        found = true;
                    }
                }
                assertTrue(found, "week 34 row not found");
            }
        }
    }

    @Test
    void shouldRequireTimeColumnForComparison() {
        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        // 未设置 compareColumn
        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .build();
        assertThrows(
                RuntimeException.class,
                () -> render(param),
                "缺少时间维度时应抛出明确异常");
    }

    @Test
    void shouldRequireTimeColumnWhenTimeDimensionRemovedButCompareColumnLeft() {
        // 删除时间维度字段后 compareColumn 仍可能残留列名，必须明确报错而非 Unknown column
        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        // compareColumn 残留"ym"，但 groups 里已无 ym 分组（时间维度被删除）
        aggregate.setCompareColumn(new String[]{"ym"});
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Collections.singletonList(category))
                .build();
        assertThrows(
                RuntimeException.class,
                () -> render(param),
                "时间维度字段已删除但 compareColumn 残留时应抛出明确异常");
    }

    @Test
    void shouldRenderQuarterDateOffsetForNativeDateColumn() throws Exception {
        // 原生日期列 + 季粒度：DATEADD(QUARTER) 直接可行
        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setColumn("amount");
        aggregate.setAlias("quarter_sales");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.QUARTER);
        aggregate.setCompareColumn(new String[]{"ym"});

        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator month = new GroupByOperator();
        month.setColumn("ym");
        month.setAlias("month");

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Arrays.asList(category, month))
                .build();
        String normalized = normalize(render(param));
        assertTrue(normalized.contains("DATEADD('QUARTER',-1,CUR.MONTH)"), normalized);
    }

    @Test
    void shouldQuoteComposedTimeColumnAlias() throws Exception {
        // 粒度函数字段的列名/别名是合成名(含分隔符与函数名)，外层必须按方言 quote 后再引用，避免语法错误
        String composed = "统计日期@date_level_delimiter@AGG_DATE_MONTH";

        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator time = new GroupByOperator();
        time.setColumn("ym");
        time.setAlias(composed);

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        aggregate.setCompareColumn(new String[]{"ym"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Arrays.asList(category, time))
                .build();
        String sql = render(param);

        // 合成名必须被按方言 quote(此处 H2 为反引号)包裹，否则 MySQL 等库会语法报错
        assertTrue(sql.contains("`" + composed + "`"), sql);
    }

    @Test
    void shouldQuoteChineseTimeColumnAlias() throws Exception {
        // 原生中文列名"统计日期"作为时间维度，外层必须 quote，避免出现裸的 cur.统计日期
        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator time = new GroupByOperator();
        time.setColumn("ym");
        time.setAlias("统计日期");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        aggregate.setCompareColumn(new String[]{"ym"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Arrays.asList(category, time))
                .build();
        String sql = render(param);
        System.out.println("CHINESE_ALIAS_SQL>>>" + sql);
        // 外层透传列 cur.<中文> 必须被 quote
        assertTrue(sql.contains("cur.`统计日期` AS `统计日期`"), sql);
    }

    @Test
    void shouldUseDateLevelColumnForTimeDimension() throws Exception {
        // 模拟"统计日期(按月)"粒度函数字段真实场景：
        // group 输出列是合成名(ym@date_level_delimiter@AGG_DATE_MONTH)，而 compareColumn 是原始列(ym)。
        // 外层必须透传粒度函数列，不能透传内层不存在的原始列。
        FunctionColumn dateLevelColumn = new FunctionColumn();
        dateLevelColumn.setAlias("ym@date_level_delimiter@AGG_DATE_MONTH");
        dateLevelColumn.setSnippet("AGG_DATE_MONTH([ym])");

        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator time = new GroupByOperator();
        // group 的 columnKey 由 column 推导，与 functionColumn.alias 一致即可关联到 AGG_DATE_ 函数
        time.setColumn("ym@date_level_delimiter@AGG_DATE_MONTH");
        time.setAlias("ym@date_level_delimiter@AGG_DATE_MONTH");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        // compareColumn 是原始列 ym
        aggregate.setCompareColumn(new String[]{"ym"});

        // 普通指标列(非 YOY/MOM)也应透传到外层，避免图表丢失指标
        AggregateOperator plainSum = new AggregateOperator();
        plainSum.setSqlOperator(AggregateOperator.SqlOperator.SUM);
        plainSum.setColumn("amount");
        plainSum.setAlias("total_amount");

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Arrays.asList(aggregate, plainSum))
                .groups(Arrays.asList(category, time))
                .functionColumns(Collections.singletonList(dateLevelColumn))
                .build();
        String sql = render(param);

        // 外层透传的是粒度函数列(内层实际输出)，而不是原始列
        assertTrue(sql.contains("cur.`ym@date_level_delimiter@AGG_DATE_MONTH`"), sql);
        // 不应出现 cur.`ym`(内层不存在的原始列) 作为透传/引用
        assertFalse(sql.contains("cur.`ym`"), sql);
        // 普通指标列也要透传到外层
        assertTrue(sql.contains("cur.`total_amount` AS `total_amount`"), sql);
    }

    @Test
    void shouldRenderMySqlDateLevelMoMJoin() throws Exception {
        // 用 MySQL 方言生成粒度函数时间列的 MOM，验证 JOIN 条件(dateOffsetFormatted)生成正确
        FunctionColumn dateLevelColumn = new FunctionColumn();
        dateLevelColumn.setAlias("统计日期@date_level_delimiter@AGG_DATE_MONTH");
        dateLevelColumn.setSnippet("AGG_DATE_MONTH([统计日期])");

        GroupByOperator time = new GroupByOperator();
        time.setColumn("统计日期@date_level_delimiter@AGG_DATE_MONTH");
        time.setAlias("统计日期@date_level_delimiter@AGG_DATE_MONTH");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("计划书数量");
        aggregate.setAlias("MOM(计划书数量)");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        aggregate.setCompareColumn(new String[]{"统计日期"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Collections.singletonList(time))
                .functionColumns(Collections.singletonList(dateLevelColumn))
                .build();

        String sql = new SqlScriptRender(
                QueryScript.builder()
                        .script("SELECT 统计日期, 计划书数量 FROM business_data")
                        .scriptType(ScriptType.SQL)
                        .variables(Collections.emptyList())
                        .build(),
                param,
                new MysqlSqlStdOperatorSupport()).render(true, false, false);
        System.out.println("MYSQL_DATELVL_MOM_SQL>>>" + sql);

        // 即使未显式传 granularity，也要从 AGG_DATE_MONTH 推断为月粒度(INTERVAL 1 MONTH)，而不是默认 DAY
        assertTrue(sql.contains("INTERVAL 1 MONTH"), sql);
        assertFalse(sql.contains("INTERVAL 1 DAY"), sql);
        // 必须用 CONCAT('-01') 补齐到完整日期，避免 STR_TO_DATE('2026-08','%Y-%m') 产生零日期('2026-08-00')
        assertTrue(sql.contains("CONCAT(cur."), sql);
        assertTrue(sql.contains("'-01'"), sql);
    }

    @Test
    void shouldRenderYoyWithDateLevelColumnInMySql() throws Exception {
        // 同比(YOY)按月粒度：时间列是月格式'2026-08'，偏移 1 年(INTERVAL 1 YEAR)，必须按 %Y-%m 补齐，不能按 YEAR 格式补
        FunctionColumn dateLevelColumn = new FunctionColumn();
        dateLevelColumn.setAlias("统计日期@date_level_delimiter@AGG_DATE_MONTH");
        dateLevelColumn.setSnippet("AGG_DATE_MONTH([统计日期])");

        GroupByOperator time = new GroupByOperator();
        time.setColumn("统计日期@date_level_delimiter@AGG_DATE_MONTH");
        time.setAlias("统计日期@date_level_delimiter@AGG_DATE_MONTH");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.YOY);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("计划书数量");
        aggregate.setAlias("YOY(计划书数量)");
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        aggregate.setCompareColumn(new String[]{"统计日期"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Collections.singletonList(time))
                .functionColumns(Collections.singletonList(dateLevelColumn))
                .build();

        String sql = new SqlScriptRender(
                QueryScript.builder()
                        .script("SELECT 统计日期, 计划书数量 FROM business_data")
                        .scriptType(ScriptType.SQL)
                        .variables(Collections.emptyList())
                        .build(),
                param,
                new MysqlSqlStdOperatorSupport()).render(true, false, false);
        System.out.println("MYSQL_DATELVL_YOY_MONTH_SQL>>>" + sql);

        // 同比按月：补齐 '-01'(月粒度) + INTERVAL 1 YEAR + 输出 '%Y-%m'
        assertTrue(sql.contains("CONCAT(cur."), sql);
        assertTrue(sql.contains("'-01'"), sql);
        assertTrue(sql.contains("INTERVAL 1 YEAR"), sql);
        assertFalse(sql.contains("'-01-01'"), sql);
    }

    @Test
    void shouldRenderMoMDayDateLevelInMySql() throws Exception {
        // 环比(MOM)按日粒度：时间列是日格式'2026-08-01'，偏移 1 天(INTERVAL 1 DAY)
        FunctionColumn dateLevelColumn = new FunctionColumn();
        dateLevelColumn.setAlias("统计日期@date_level_delimiter@AGG_DATE_DAY");
        dateLevelColumn.setSnippet("AGG_DATE_DAY([统计日期])");

        GroupByOperator time = new GroupByOperator();
        time.setColumn("统计日期@date_level_delimiter@AGG_DATE_DAY");
        time.setAlias("统计日期@date_level_delimiter@AGG_DATE_DAY");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(AggregateOperator.SqlOperator.MOM);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("计划书数量");
        aggregate.setAlias("MOM(计划书数量)");
        aggregate.setReturnType(AggregateOperator.ComparisonReturnType.VALUE);
        aggregate.setCompareColumn(new String[]{"统计日期"});

        ExecuteParam param = ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Collections.singletonList(time))
                .functionColumns(Collections.singletonList(dateLevelColumn))
                .build();

        String sql = new SqlScriptRender(
                QueryScript.builder()
                        .script("SELECT 统计日期, 计划书数量 FROM business_data")
                        .scriptType(ScriptType.SQL)
                        .variables(Collections.emptyList())
                        .build(),
                param,
                new MysqlSqlStdOperatorSupport()).render(true, false, false);
        System.out.println("MYSQL_DATELVL_MOM_DAY_SQL>>>" + sql);

        // 环比按日：日格式 '%Y-%m-%d' 完整，无需 CONCAT 补齐；INTERVAL 1 DAY
        assertTrue(sql.contains("INTERVAL 1 DAY"), sql);
        assertFalse(sql.contains("CONCAT(cur."), sql);
    }

    @Test
    void shouldParseTwoStageComparisonSqlWithParser() throws Exception {
        // 两阶段同环比 SQL 必须能被 Calcite 解析，否则 SqlParserVariableResolver 会失败，
        // 导致变量替换不可靠（prev 是保留字，已改为 p 别名）
        String sql = render(comparison(
                AggregateOperator.SqlOperator.MOM,
                AggregateOperator.ComparisonReturnType.VALUE));
        assertTrue(SqlParserUtils.createParser(sql, new H2Dialect()).parseQuery() != null, sql);
    }

    @Test
    void shouldResolveVariablesInComparisonSql() throws Exception {
        // 同环比两阶段 SQL 里，脚本 WHERE 中的变量也必须被正确替换
        ScriptVariable variable = new ScriptVariable(
                "CAT", VariableTypeEnum.PERMISSION, ValueType.STRING,
                new HashSet<>(Collections.singletonList("A")), false);

        ExecuteParam param = comparison(
                AggregateOperator.SqlOperator.MOM,
                AggregateOperator.ComparisonReturnType.VALUE);

        String sql = null;
        try {
            sql = new SqlScriptRender(
                    QueryScript.builder()
                            .script("SELECT ym, category, amount FROM sales WHERE category = $CAT$")
                            .scriptType(ScriptType.SQL)
                            .variables(Collections.singletonList(variable))
                            .build(),
                    param,
                    new H2Dialect()).render(true, false, false);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }

        assertFalse(sql.contains("$CAT$"), "变量应被替换而非作为列名保留: " + sql);
    }

    @Test
    void shouldRejectUnsupportedFormattedGranularity() {
        // 季粒度周期字符串(如 AGG_DATE_QUARTER='2026-2')不是标准日期，无法可靠做日期偏移还原，
        // 方言 periodFormat 应对 QUARTER 返回 null（不可行）。
        H2Dialect h2 = new H2Dialect();
        assertNull(h2.periodFormat("QUARTER"));
        // 年/月/周/日可行(周为 ISO 周格式 'yyyy-ww')
        assertEquals("yyyy", h2.periodFormat("YEAR"));
        assertEquals("yyyy-MM", h2.periodFormat("MONTH"));
        assertEquals("yyyy-ww", h2.periodFormat("WEEK"));
        assertEquals("yyyy-MM-dd", h2.periodFormat("DAY"));
    }

    private void assertValue(ResultSet rs, String category, String ym, String expected) throws Exception {
        boolean found = false;
        while (rs.next()) {
            if (category.equals(rs.getString("category")) && ym.equals(rs.getString("month"))) {
                assertEquals(expected, rs.getBigDecimal("month_sales").setScale(2).toPlainString());
                found = true;
            }
        }
        assertTrue(found, "row for " + category + "/" + ym + " not found");
    }

    private void assertNullValue(ResultSet rs, String category, String ym) throws Exception {
        boolean found = false;
        while (rs.next()) {
            if (category.equals(rs.getString("category")) && ym.equals(rs.getString("month"))) {
                assertNull(rs.getBigDecimal("month_sales"), "缺失周期应返回 null");
                found = true;
            }
        }
        assertTrue(found, "row for " + category + "/" + ym + " not found");
    }

    private ExecuteParam comparison(
            AggregateOperator.SqlOperator operator,
            AggregateOperator.ComparisonReturnType returnType) {
        GroupByOperator category = new GroupByOperator();
        category.setColumn("category");
        category.setAlias("category");

        GroupByOperator month = new GroupByOperator();
        month.setColumn("ym");
        month.setAlias("month");

        AggregateOperator aggregate = new AggregateOperator();
        aggregate.setSqlOperator(operator);
        aggregate.setBaseAggregator(AggregateOperator.SqlOperator.SUM);
        aggregate.setColumn("amount");
        aggregate.setAlias("month_sales");
        aggregate.setGranularity(AggregateOperator.ComparisonGranularity.MONTH);
        aggregate.setReturnType(returnType);
        aggregate.setCompareColumn(new String[]{"ym"});

        return ExecuteParam.builder()
                .aggregators(Collections.singletonList(aggregate))
                .groups(Arrays.asList(category, month))
                .build();
    }

    private String render(ExecuteParam param) throws Exception {
        return new SqlScriptRender(
                QueryScript.builder()
                        .script("SELECT ym, category, amount FROM sales")
                        .scriptType(ScriptType.SQL)
                        .variables(Collections.emptyList())
                        .build(),
                param,
                new H2Dialect()).render(true, false, false);
    }

    private String normalize(String sql) {
        return sql.replace("`", "")
                .replace(" ", "")
                .replace("\n", "")
                .toUpperCase(Locale.ROOT);
    }
}
