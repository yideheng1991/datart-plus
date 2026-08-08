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

import datart.core.entity.*;
import datart.security.base.ResourceType;
import datart.server.base.dto.*;
import datart.server.base.params.*;
import datart.server.base.transfer.DashboardTemplateParam;
import datart.server.base.transfer.DatachartTemplateParam;
import datart.server.base.transfer.ImportStrategy;
import datart.server.base.transfer.ResourceTransferParam;
import datart.server.service.VizService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Tag(name = "Viz")
@Slf4j
@RestController
@RequestMapping(value = "/viz")
public class VizController extends BaseController {

    private final VizService vizService;

    public VizController(VizService vizService) {
        this.vizService = vizService;
    }


    @Operation(summary = "list viz folders")
    @PostMapping(value = "/check/name")
    public ResponseData<Boolean> checkVizName(@Validated @RequestBody CheckNameParam param) {
        return ResponseData.success(vizService.checkName(param.getOrgId(), param.getName(), param.getParentId(), ResourceType.valueOf(param.getVizType())));
    }

    @Operation(summary = "list viz folders")
    @GetMapping(value = "/folders")
    public ResponseData<List<Folder>> listVizFolders(String orgId) {
        return ResponseData.success(vizService.listViz(orgId));
    }


    @Operation(summary = "create a datachart")
    @PostMapping(value = "/datacharts")
    public ResponseData<Folder> createDatachart(@Validated @RequestBody DatachartCreateParam createParam) {
        return ResponseData.success(vizService.createDatachart(createParam));
    }

    @Operation(summary = "get a datachart")
    @GetMapping(value = "/datacharts/{datachartId}")
    public ResponseData<DatachartDetail> getDatachart(@PathVariable String datachartId) {
        checkBlank(datachartId, "datachartId");
        return ResponseData.success(vizService.getDatachart(datachartId));
    }

    @Operation(summary = "get datachart list")
    @GetMapping(value = "/datacharts")
    public ResponseData<DatachartDetailList> getDatachart(@RequestParam Set<String> datachartIds) {
        return ResponseData.success(vizService.getDatacharts(datachartIds));
    }


    @Operation(summary = "update a datachart")
    @PutMapping(value = "/datacharts/{datachartId}")
    public ResponseData<Boolean> updateDatachart(@PathVariable String datachartId, @Validated @RequestBody DatachartUpdateParam updateParam) {
        return ResponseData.success(vizService.updateDatachart(updateParam));
    }

    @Operation(summary = "delete a datachart")
    @DeleteMapping(value = "/datacharts/{datachartId}")
    public ResponseData<Boolean> deleteDatachart(@PathVariable String datachartId, @RequestParam boolean archive) {
        return ResponseData.success(vizService.deleteDatachart(datachartId, archive));
    }


    @Operation(summary = "create a dashboard")
    @PostMapping(value = "/dashboards")
    public ResponseData<Folder> createDashboard(@Validated @RequestBody DashboardCreateParam createParam) {
        return ResponseData.success(vizService.createDashboard(createParam));
    }

    @Operation(summary = "get a dashboard detail")
    @GetMapping(value = "/dashboards/{dashboardId}")
    public ResponseData<DashboardDetail> getDashboard(@PathVariable String dashboardId) {
        checkBlank(dashboardId, "dashboardId");
        return ResponseData.success(vizService.getDashboard(dashboardId));
    }

    @Operation(summary = "update a dashboard")
    @PutMapping(value = "/dashboards/{dashboardId}")
    public ResponseData<Boolean> updateDashboard(@PathVariable String dashboardId, @RequestBody DashboardUpdateParam updateParam) {
        return ResponseData.success(vizService.updateDashboard(updateParam));
    }

    @Operation(summary = "copy a dashboard")
    @PutMapping(value = "/dashboards/{dashboardId}/copy")
    public ResponseData<Folder> copyDashboard(@PathVariable String dashboardId, @RequestBody DashboardCreateParam createParam) throws IOException {
        return ResponseData.success(vizService.copyDashboard(createParam));
    }

    @Operation(summary = "delete a dashboard")
    @DeleteMapping(value = "/dashboards/{dashboardId}")
    public ResponseData<Boolean> deleteDashboard(@PathVariable String dashboardId, @RequestParam Boolean archive) {
        checkBlank(dashboardId, "dashboardId");
        return ResponseData.success(vizService.deleteDashboard(dashboardId, archive));
    }

    @Operation(summary = "list storyboards")
    @GetMapping(value = "/storyboards")
    public ResponseData<List<Storyboard>> listStoryboards(String orgId) {

        checkBlank(orgId, "orgId");
        return ResponseData.success(vizService.listStoryboards(orgId));
    }

    @Operation(summary = "get storyboard detail")
    @GetMapping(value = "/storyboards/{storyboardId}")
    public ResponseData<StoryboardDetail> getStoryboard(@PathVariable String storyboardId) {
        checkBlank(storyboardId, "storyboardId");
        return ResponseData.success(vizService.getStoryboard(storyboardId));
    }

    @Operation(summary = "list stories")
    @GetMapping(value = "/storypages/{storyboardId}")
    public ResponseData<List<Storypage>> listStorypages(@PathVariable String storyboardId) {
        checkBlank(storyboardId, "storyboardId");
        return ResponseData.success(vizService.listStorypages(storyboardId));
    }

    @Operation(summary = "get storypage detail")
    @GetMapping(value = "/storypages/{storypageId}")
    public ResponseData<StorypageDetail> getStorypage(@PathVariable String storypageId) {
        checkBlank(storypageId, "storypageId");
        return ResponseData.success(vizService.getStorypage(storypageId));
    }


    @Operation(summary = "create storyboards")
    @PostMapping(value = "/storyboards")
    public ResponseData<Storyboard> createStoryboard(@Validated @RequestBody StoryboardCreateParam createParam) {
        return ResponseData.success(vizService.createStoryboard(createParam));
    }


    @Operation(summary = "create a storypage")
    @PostMapping(value = "/storypages")
    public ResponseData<Storypage> createStory(@Validated @RequestBody StorypageCreateParam createParam) {
        return ResponseData.success(vizService.createStorypage(createParam));
    }

    @Operation(summary = "update a storyboard")
    @PutMapping(value = "/storyboards/{storyboardId}")
    public ResponseData<Boolean> updateStoryboard(@PathVariable String storyboardId, @Validated @RequestBody StoryboardUpdateParam updateParam) {
        return ResponseData.success(vizService.updateStoryboard(updateParam));
    }

    @Operation(summary = "update a storyboard base info")
    @PutMapping(value = "/{storyboardId}/base")
    public ResponseData<Boolean> updateStoryboardBaseInfo(@PathVariable String storyboardId,
                                                          @Validated @RequestBody StoryboardBaseUpdateParam updateParam) {
        checkBlank(storyboardId, "storyboardId");
        return ResponseData.success(vizService.updateStoryboardBase(updateParam));
    }

    @Operation(summary = "update a story")
    @PutMapping(value = "/storypages/{storyId}")
    public ResponseData<Boolean> updateStory(@PathVariable String storyId, @Validated @RequestBody StorypageUpdateParam updateParam) {
        return ResponseData.success(vizService.updateStorypage(updateParam));
    }

    @Operation(summary = "delete a storyboard")
    @DeleteMapping(value = "/storyboards/{storyboardId}")
    public ResponseData<Boolean> deleteStoryboard(@PathVariable String storyboardId, @RequestParam boolean archive) {

        checkBlank(storyboardId, "storyboardId");
        return ResponseData.success(vizService.deleteStoryboard(storyboardId, archive));
    }

    @Operation(summary = "delete a story")
    @DeleteMapping(value = "/storypages/{storypageId}")
    public ResponseData<Boolean> deleteStory(@PathVariable String storypageId) {
        checkBlank(storypageId, "storypageId");
        return ResponseData.success(vizService.deleteStorypage(storypageId));
    }


    @Operation(summary = "create a folder")
    @PostMapping(value = "/folders")
    public ResponseData<Folder> createFolder(@Validated @RequestBody FolderCreateParam createParam) {
        return ResponseData.success(vizService.createFolder(createParam));
    }


    @Operation(summary = "update a folder")
    @PutMapping(value = "/folders/{folderId}")
    public ResponseData<Boolean> updateFolder(@PathVariable String folderId, @Validated @RequestBody FolderUpdateParam updateParam) {
        return ResponseData.success(vizService.updateFolder(updateParam));
    }

    @Operation(summary = "delete a folder")
    @DeleteMapping(value = "/folders/{folderId}")
    public ResponseData<Boolean> deleteFolder(@PathVariable String folderId) {
        return ResponseData.success(vizService.deleteFolder(folderId));
    }

    @Operation(summary = "list archived dashboard")
    @GetMapping(value = "/archived/dashboard/{orgId}")
    public ResponseData<List<Dashboard>> listArchiveDashboard(@PathVariable String orgId) {
        return ResponseData.success(vizService.listArchivedDashboard(orgId));
    }

    @Operation(summary = "list archived datachart")
    @GetMapping(value = "/archived/datachart/{orgId}")
    public ResponseData<List<Datachart>> listArchiveDatachart(@PathVariable String orgId) {
        return ResponseData.success(vizService.listArchivedDatachart(orgId));
    }

    @Operation(summary = "list archived datachart")
    @GetMapping(value = "/archived/storyboard/{orgId}")
    public ResponseData<List<Storyboard>> listArchiveStoryboard(@PathVariable String orgId) {
        return ResponseData.success(vizService.listArchivedStoryboard(orgId));
    }

    @Operation(summary = "unarchive viz")
    @PutMapping(value = "/unarchive/{vizId}")
    public ResponseData<Boolean> unarchiveViz(@PathVariable String vizId,
                                              @RequestParam String vizType,
                                              @RequestParam String newName,
                                              @RequestParam(required = false) String parentId,
                                              @RequestParam Double index) {
        return ResponseData.success(vizService.unarchiveViz(vizId, ResourceType.valueOf(vizType), newName, parentId, index));
    }

    @Operation(summary = "publish viz")
    @PutMapping(value = "/publish/{vizId}")
    public ResponseData<Boolean> publishViz(@PathVariable String vizId,
                                            @RequestParam String vizType) {
        return ResponseData.success(vizService.publish(ResourceType.valueOf(vizType), vizId));
    }


    @Operation(summary = "unpublish viz")
    @PutMapping(value = "/unpublish/{vizId}")
    public ResponseData<Boolean> unpublishViz(@PathVariable String vizId,
                                              @RequestParam String vizType) {
        return ResponseData.success(vizService.unpublish(ResourceType.valueOf(vizType), vizId));
    }

    @Operation(summary = "export viz")
    @PostMapping(value = "/export")
    public ResponseData<Download> exportViz(@RequestBody ResourceTransferParam param) throws IOException {
        return ResponseData.success(vizService.exportResource(param));
    }

    @Operation(summary = "import viz")
    @PostMapping(value = "/import")
    public ResponseData<Boolean> importViz(@RequestParam("file") MultipartFile file, ImportStrategy strategy, String orgId) throws IOException {
        return ResponseData.success(vizService.importResource(file, strategy, orgId));
    }


    @Operation(summary = "export dashboard template")
    @PostMapping(value = "/export/dashboard/template")
    public ResponseData<Download> exportDashboardTemplate(@Validated @RequestBody DashboardTemplateParam param) throws IOException {
        return ResponseData.success(vizService.exportDashboardTemplate(param));
    }

    @Operation(summary = "export datachart template")
    @PostMapping(value = "/export/datachart/template")
    public ResponseData<Download> exportDatachartTemplate(@Validated @RequestBody DatachartTemplateParam param) throws IOException {
        return ResponseData.success(vizService.exportDatachartTemplate(param));

    }


    @Operation(summary = "import viz template")
    @PostMapping(value = "/import/template")
    public ResponseData<Folder> importVizTemplate(@RequestParam("file") MultipartFile file, @RequestParam String parentId, @RequestParam String orgId, @RequestParam String name) throws Exception {
        return ResponseData.success(vizService.importVizTemplate(file, orgId, parentId, name));
    }

}
