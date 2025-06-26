package org.url.videodownloaderbackend.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.url.videodownloaderbackend.dto.DownloadRequest;
import org.url.videodownloaderbackend.dto.DownloadResponse;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VideoDownloadService {

    private static final Logger logger = LoggerFactory.getLogger(VideoDownloadService.class);
    private final String DOWNLOAD_DIR = "downloads/";
    private final Map<String, DownloadResponse> downloadStatus = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        new File(DOWNLOAD_DIR).mkdirs();
    }

    public CompletableFuture<Void> downloadVideoAsync(String downloadId, DownloadRequest request) {
        DownloadResponse response = downloadStatus.get(downloadId);
        response.setStatus("processing");

        try {
            String fileName = downloadVideo(request.getUrl(), request.getQuality(), request.getFormat());
            response.setStatus("completed");
            response.setFilename(fileName);
            response.setDownloadUrl("/api/download/file/" + downloadId);
        } catch (Exception e) {
            logger.error("Download failed for ID: " + downloadId, e);
            response.setStatus("failed");
            response.setError(e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    private String downloadVideo(String url, String quality, String format) throws IOException, InterruptedException {
        String timeStamp = String.valueOf(System.currentTimeMillis());
        String outputTemplate = DOWNLOAD_DIR + "%(title)s_" + timeStamp + ".%(ext)s";

        List<String> command = new ArrayList<>();
        command.add("yt-dlp");
        command.add("--output");
        command.add(outputTemplate);

        if("audio".equals(format)) {
            command.add("--extract-audio");
            command.add("--audio-format");
            command.add("mp3");
        } else {
            String formatSelector = buildFormatSelector(quality, format);
            command.add("--format");
            command.add(formatSelector);
        }

        command.add("--no-playlist");
        command.add("--restrict-filenames");
        command.add(url);

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.directory(new File("."));
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();
        String downloadedFilename = null;

        try(BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                logger.info("yt-dlp: " + line);

                if(line.contains("[download] Destination")) {
                    String[] parts = line.split("Destination: ");
                    if(parts.length > 1) {
                        downloadedFilename = parts[1].trim();
                        downloadedFilename = new File(downloadedFilename).getName();
                    }
                }
            }
        }

        int exitCode = process.waitFor();
        if(exitCode != 0) {
            throw new RuntimeException("yt-dlp failed with exit code " + exitCode + "\nOutput: " + output.toString());
        }

        if (downloadedFilename == null) {
            downloadedFilename = findDownloadedFile();
        }

        return downloadedFilename;
    }

    private String findDownloadedFile() {
        File downloadDir = new File(DOWNLOAD_DIR);
        File[] files = downloadDir.listFiles();

        if(files != null && files.length > 0) {
            return Arrays.stream(files)
                    .max(Comparator.comparing(File::lastModified))
                    .map(File::getName)
                    .orElse(null);
        }
        return null;
    }

    private String buildFormatSelector(String quality, String format) {
        StringBuilder selector = new StringBuilder();

        if("best".equals(quality)) {
            selector.append("best");
        } else if(quality.endsWith("p")) {
            String height = quality.substring(0, quality.length() - 1);
            selector.append("best[height<=").append(height)
                    .append("]");
        } else {
            selector.append("best");
        }

        if(format != null && !format.isEmpty() && !"auto".equals(format)) {
            selector.append("[ext=").append(format).append("]");
        }

        return selector.toString();
    }

    public String initiateDownload(DownloadRequest request) {
        String downloadId = UUID.randomUUID().toString();

        DownloadResponse response = new DownloadResponse();
        response.setId(downloadId);
        response.setStatus("queued");

        downloadStatus.put(downloadId, response);

        downloadVideoAsync(downloadId, request);

        return downloadId;
    }

    public DownloadResponse getDownloadStatus(String downloadId) {
        return downloadStatus.get(downloadId);
    }

    public File getDownloadedFile(String downloadId) {
        DownloadResponse response = downloadStatus.get(downloadId);
        if(response != null && "completed".equals(response.getStatus())) {
            return new File(DOWNLOAD_DIR + response.getFilename());
        }

        return null;
    }

}
