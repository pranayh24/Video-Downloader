package org.url.videodownloaderbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DownloadResponse {
    private String id;
    private String status;
    private String filename;
    private String downloadUrl;
    private String error;
}
