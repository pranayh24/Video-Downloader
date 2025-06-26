package org.url.videodownloaderbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.url.videodownloaderbackend.dto.DownloadRequest;
import org.url.videodownloaderbackend.dto.DownloadResponse;
import org.url.videodownloaderbackend.service.VideoDownloadService;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/download")
@CrossOrigin(origins = "http://localhost:5173")
public class VideoDownloadController {

    @Autowired
    private VideoDownloadService downloadService;

    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startDownload(@RequestBody DownloadRequest request) {
        try {
            String downloadId = downloadService.initiateDownload(request);
            return ResponseEntity.ok(Map.of("downloadId", downloadId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{downloadId}")
    public ResponseEntity<DownloadResponse> getStatus(@PathVariable String downloadId) {
        DownloadResponse response = downloadService.getDownloadStatus(downloadId);
        if (response != null) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/file/{downloadId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String downloadId) {
        try{
            File file = downloadService.getDownloadedFile(downloadId);
            if (file != null && file.exists()) {
                Resource resource = new FileSystemResource(file);

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + file.getName() + "\"")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch(Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
