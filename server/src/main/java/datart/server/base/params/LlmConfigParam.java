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

package datart.server.base.params;

import lombok.Data;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

@Data
public class LlmConfigParam {

    @NotBlank
    private String orgId;

    @NotBlank
    private String provider;

    private String apiBaseUrl;

    private String apiKey;

    @NotBlank
    private String model;

    @DecimalMin("0.0")
    @DecimalMax("2.0")
    private Double temperature = 0.3D;

    @Min(1)
    @Max(32768)
    private Integer maxTokens = 4096;

    private Boolean active = true;
}
