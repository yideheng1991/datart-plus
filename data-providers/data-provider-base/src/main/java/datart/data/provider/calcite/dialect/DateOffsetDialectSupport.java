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
package datart.data.provider.calcite.dialect;

import datart.core.base.exception.Exceptions;
import org.apache.calcite.sql.SqlDialect;

/**
 * 同环比日期偏移的方言支持。
 *
 * <p>日期偏移自关联需要把时间列向前/向后偏移（环比偏移 1 周期，同比偏移 1 年）。
 * 各数据库的日期偏移、日期解析/格式化函数语法不同，通过该接口按方言生成 SQL。</p>
 *
 * <p>不支持的数据库（或某库尚未实现）时，{@link #dateOffset} 直接抛出明确异常，
 * 避免静默生成错误 SQL。</p>
 */
public interface DateOffsetDialectSupport {

    /**
     * 是否支持该数据库的日期偏移。原生日期列可用时返回 true。
     */
    default boolean supportsDateOffset() {
        return false;
    }

    /**
     * 生成"把时间列向前偏移"的表达式（时间列是原生日期类型）。
     *
     * @param timeExpr 时间列表达式（cur 侧别名）
     * @param offset   偏移数量
     * @param unit     偏移单位：YEAR / MONTH / DAY
     * @return 偏移后的时间表达式
     */
    default String dateOffset(String timeExpr, int offset, String unit) {
        Exceptions.msg("message.provider.compare.date.offset.unsupported",
                dialectName());
        return null;
    }

    /**
     * 生成"把周期字符串列偏移"的表达式（时间列是粒度函数输出的周期字符串，如 '2023-01'）。
     * 需要先把字符串解析为日期、偏移、再格式化回同格式字符串，才能与 prev 侧的周期字符串匹配。
     *
     * @param timeExpr 周期字符串列表达式（cur 侧别名）
     * @param offset   偏移数量
     * @param unit     偏移单位：YEAR / MONTH / DAY
     * @param fmt      周期字符串格式掩码（各库风格，如 MySQL '%Y-%m'、PostgreSQL 'YYYY-MM'）
     * @return 偏移后的周期字符串表达式
     */
    default String dateOffsetFormatted(String timeExpr, int offset, String unit, String fmt) {
        Exceptions.msg("message.provider.compare.date.offset.unsupported",
                dialectName());
        return null;
    }

    /**
     * 返回某粒度周期字符串的格式化掩码（各库风格），用于对周期字符串做日期偏移。
     * 支持 YEAR/MONTH/DAY；QUARTER/WEEK 的周期字符串非标准日期，返回 null（不可行）。
     *
     * @param granularity 粒度：YEAR / MONTH / DAY
     * @return 格式化掩码；不支持返回 null
     */
    default String periodFormat(String granularity) {
        return null;
    }

    /**
     * 当前方言的名称，用于报错信息。
     */
    default String dialectName() {
        return getClass().getSimpleName();
    }

    static DateOffsetDialectSupport of(SqlDialect dialect) {
        if (dialect instanceof DateOffsetDialectSupport) {
            return (DateOffsetDialectSupport) dialect;
        }
        return null;
    }
}
