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

package datart.server.controller;

import datart.core.base.annotations.SkipLogin;
import datart.core.common.FileUtils;
import datart.core.data.provider.Dataframe;
import datart.core.data.provider.StdSqlOperator;
import datart.core.entity.Download;
import datart.server.base.dto.ResponseData;
import datart.server.base.dto.ShareInfo;
import datart.server.base.params.*;
import datart.server.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import org.apache.tomcat.util.http.fileupload.util.Streams;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/shares")
public class ShareController extends BaseController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {

        this.shareService = shareService;
    }

    @Operation(summary = "create a share")
    @PostMapping
    public ResponseData<ShareToken> create(@Validated @RequestBody ShareCreateParam createParam) {
        return ResponseData.success(shareService.createShare(createParam));
    }

    @Operation(summary = "update a share")
    @PutMapping(value = "{shareId}")
    public ResponseData<ShareInfo> update(
            @PathVariable String shareId,
            @Validated @RequestBody ShareUpdateParam updateParam) {
        updateParam.setId(shareId);
        return ResponseData.success(shareService.updateShare(updateParam));
    }

    @Operation(summary = "delete a share")
    @DeleteMapping(value = "{shareId}")
    public ResponseData<Boolean> delete(@PathVariable String shareId) {
        return ResponseData.success(shareService.delete(shareId, false));
    }

    @Operation(summary = "list share")
    @GetMapping(value = "{vizId}")
    public ResponseData<List<ShareInfo>> list(@PathVariable String vizId) {
        return ResponseData.success(shareService.listShare(vizId));
    }


    @Operation(summary = "get viz detail")
    @PostMapping("{shareId}/viz")
    @SkipLogin
    public ResponseData<ShareVizDetail> vizDetail(@PathVariable String shareId,
                                                  @RequestBody ShareToken shareToken) {
        shareToken.setId(shareId);
        return ResponseData.success(shareService.getShareViz(shareToken));
    }


    @Operation(summary = "support std functions")
    @PostMapping("/function/support/{sourceId}")
    @SkipLogin
    public ResponseData<Set<StdSqlOperator>> supportFunctions(@PathVariable String sourceId,
                                                              @RequestBody ShareToken executeToken) {
        return ResponseData.success(shareService.supportedStdFunctions(executeToken, sourceId));
    }

    @Operation(summary = "execute with share token")
    @PostMapping("/execute")
    @SkipLogin
    public ResponseData<Dataframe> execute(@RequestParam String executeToken,
                                           @RequestBody ViewExecuteParam executeParam) throws Exception {
        return ResponseData.success(shareService.execute(ShareToken.create(executeToken), executeParam));
    }

    @Operation(summary = "create a download task")
    @PostMapping("/download")
    @SkipLogin
    public ResponseData<Download> createDownload(@RequestParam(required = false) String password,
                                                 @RequestParam String clientId,
                                                 @RequestBody ShareDownloadParam downloadCreateParam) {
        return ResponseData.success(shareService.createDownload(clientId, downloadCreateParam));
    }

    @Operation(summary = "get download task")
    @GetMapping("/download/task")
    @SkipLogin
    public ResponseData<List<Download>> downloadList(@RequestParam String shareToken,
                                                     @RequestParam String clientId) {
        return ResponseData.success(shareService.listDownloadTask(ShareToken.create(shareToken), clientId));
    }

    @Operation(summary = "download file")
    @GetMapping("/download")
    @SkipLogin
    public void downloadFile(@RequestParam String shareToken,
                             @RequestParam String downloadId,
                             HttpServletResponse response) throws IOException {
        Download download = shareService.download(ShareToken.create(shareToken), downloadId);

        response.setHeader("Content-Type", "application/octet-stream");
        File file = new File(FileUtils.withBasePath(download.getPath()));
        try (InputStream inputStream = new FileInputStream(file)) {
            response.setHeader("Content-Disposition", String.format("attachment; filename=\"%s\"", URLEncoder.encode(file.getName(), "utf-8")));
            Streams.copy(inputStream, response.getOutputStream(), true);
        }
    }

}
