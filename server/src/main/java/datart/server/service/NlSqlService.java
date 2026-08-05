package datart.server.service;

import datart.server.base.dto.NlSqlGenerateResult;
import datart.server.base.params.NlSqlGenerateParam;

public interface NlSqlService {

    NlSqlGenerateResult generate(NlSqlGenerateParam param);
}
