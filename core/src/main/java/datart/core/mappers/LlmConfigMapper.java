package datart.core.mappers;

import datart.core.entity.LlmConfig;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.type.JdbcType;

import java.util.List;

@Mapper
public interface LlmConfigMapper {

    @Insert({
            "INSERT INTO llm_config (id, org_id, provider, api_base_url, api_key, model,",
            "temperature, max_tokens, is_active, create_by, create_time, update_by, update_time)",
            "VALUES (#{id}, #{orgId}, #{provider}, #{apiBaseUrl}, #{apiKey}, #{model},",
            "#{temperature}, #{maxTokens}, #{active}, #{createBy}, #{createTime}, #{updateBy}, #{updateTime})"
    })
    int insert(LlmConfig config);

    @Update({
            "UPDATE llm_config SET provider = #{provider}, api_base_url = #{apiBaseUrl},",
            "api_key = #{apiKey}, model = #{model}, temperature = #{temperature},",
            "max_tokens = #{maxTokens}, is_active = #{active}, update_by = #{updateBy},",
            "update_time = #{updateTime} WHERE id = #{id}"
    })
    int update(LlmConfig config);

    @Delete("DELETE FROM llm_config WHERE id = #{id}")
    int delete(String id);

    @Select({
            "SELECT id, org_id, provider, api_base_url, api_key, model, temperature,",
            "max_tokens, is_active, create_by, create_time, update_by, update_time",
            "FROM llm_config WHERE id = #{id}"
    })
    @Results(id = "llmConfigResult", value = {
            @Result(column = "id", property = "id", jdbcType = JdbcType.VARCHAR, id = true),
            @Result(column = "org_id", property = "orgId", jdbcType = JdbcType.VARCHAR),
            @Result(column = "provider", property = "provider", jdbcType = JdbcType.VARCHAR),
            @Result(column = "api_base_url", property = "apiBaseUrl", jdbcType = JdbcType.VARCHAR),
            @Result(column = "api_key", property = "apiKey", jdbcType = JdbcType.VARCHAR),
            @Result(column = "model", property = "model", jdbcType = JdbcType.VARCHAR),
            @Result(column = "temperature", property = "temperature", jdbcType = JdbcType.DOUBLE),
            @Result(column = "max_tokens", property = "maxTokens", jdbcType = JdbcType.INTEGER),
            @Result(column = "is_active", property = "active", jdbcType = JdbcType.TINYINT),
            @Result(column = "create_by", property = "createBy", jdbcType = JdbcType.VARCHAR),
            @Result(column = "create_time", property = "createTime", jdbcType = JdbcType.TIMESTAMP),
            @Result(column = "update_by", property = "updateBy", jdbcType = JdbcType.VARCHAR),
            @Result(column = "update_time", property = "updateTime", jdbcType = JdbcType.TIMESTAMP)
    })
    LlmConfig selectById(String id);

    @Select({
            "SELECT id, org_id, provider, api_base_url, api_key, model, temperature,",
            "max_tokens, is_active, create_by, create_time, update_by, update_time",
            "FROM llm_config WHERE org_id = #{orgId} ORDER BY create_time DESC"
    })
    @ResultMap("llmConfigResult")
    List<LlmConfig> listByOrg(String orgId);

    @Select({
            "SELECT id, org_id, provider, api_base_url, api_key, model, temperature,",
            "max_tokens, is_active, create_by, create_time, update_by, update_time",
            "FROM llm_config WHERE org_id = #{orgId} AND is_active = 1 LIMIT 1"
    })
    @ResultMap("llmConfigResult")
    LlmConfig selectActiveByOrg(String orgId);

    @Update("UPDATE llm_config SET is_active = 0 WHERE org_id = #{orgId}")
    int deactivateByOrg(String orgId);

    @Update({
            "UPDATE llm_config SET is_active = 1, update_by = #{userId},",
            "update_time = CURRENT_TIMESTAMP WHERE id = #{id} AND org_id = #{orgId}"
    })
    int activate(@Param("id") String id,
                 @Param("orgId") String orgId,
                 @Param("userId") String userId);
}
