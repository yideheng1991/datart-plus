/*
 * Datart
 * <p>
 * Copyright 2021
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *        http://www.apache.org/licenses/LICENSE-2.0
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package datart.server.controller;

import datart.core.base.annotations.SkipLogin;
import datart.core.base.consts.Const;
import datart.security.base.PasswordToken;
import datart.server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "OAuth")
@RestController
@RequestMapping("/api/v1/oauth")
public class OAuthController {

    private final UserService userService;

    @Autowired
    public OAuthController(UserService userService) {
        this.userService = userService;
    }

    @SkipLogin
    @Operation(summary = "OAuth2 Password Token")
    @PostMapping(value = "/token", produces = "application/json")
    public Map<String, Object> token(@RequestParam String username,
                                     @RequestParam String password,
                                     HttpServletResponse response) {
        PasswordToken passwordToken = new PasswordToken(username, password, System.currentTimeMillis());
        String token = userService.login(passwordToken);
        response.setHeader(Const.TOKEN, token);

        // Strip "Bearer " prefix so Swagger UI's OAuth2 flow adds it back correctly
        String rawToken = StringUtils.removeStart(token, Const.TOKEN_HEADER_PREFIX);

        Map<String, Object> result = new HashMap<>();
        result.put("access_token", rawToken);
        result.put("token_type", "bearer");
        result.put("expires_in", 1800);
        return result;
    }

}
