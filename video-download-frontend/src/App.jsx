import './App.css'
import React, { useState, useEffect } from 'react';
import { Download, Video, Music, Settings, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const VideoDownloader = () => {
    const [url, setUrl] = useState('');
    const [quality, setQuality] = useState('best');
    const [format, setFormat] = useState('auto');
    const [downloads, setDownloads] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE = 'http://localhost:8080/api/download';

    useEffect(() => {
        const interval = setInterval(() => {
            downloads.forEach(download => {
                if (download.status === 'processing' || download.status === 'queued') {
                    checkDownloadStatus(download.id);
                }
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [downloads]);

    const checkDownloadStatus = async (downloadId) => {
        try {
            const response = await fetch(`${API_BASE}/status/${downloadId}`);
            if (response.ok) {
                const status = await response.json();
                setDownloads(prev =>
                    prev.map(download =>
                        download.id === downloadId ? { ...download, ...status } : download
                    )
                );
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handleSubmit = async () => {
        if (!url.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url.trim(),
                    quality,
                    format: format === 'auto' ? null : format
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Backend response:', result); // Debug log

                const newDownload = {
                    id: result.downloadId,
                    url: url.trim(),
                    quality,
                    format,
                    status: 'queued',
                    filename: null,
                    downloadUrl: `/file/${result.downloadId}`,
                    error: null,
                    timestamp: new Date()
                };

                console.log('New download object:', newDownload); // Debug log
                setDownloads([newDownload]);
                setUrl('');
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Failed to start download'));
            }
        } catch (error) {
            alert('Network error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadFile = (downloadUrl, downloadId) => {
        console.log('Download URL:', downloadUrl); // Debug log
        console.log('Download ID:', downloadId); // Debug log

        try {
            if (!downloadId) {
                console.error('Download ID is undefined or null');
                alert('Download ID is missing');
                return;
            }

            const fullUrl = `${API_BASE}/file/${downloadId}`;
            console.log('Full URL:', fullUrl); // Debug log

            const a = document.createElement('a');
            a.href = fullUrl;
            a.download = '';
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed: ' + error.message);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'failed':
                return <XCircle className="text-red-500" size={20} />;
            case 'processing':
                return <Clock className="text-blue-500 animate-spin" size={20} />;
            case 'queued':
                return <Clock className="text-yellow-500" size={20} />;
            default:
                return <AlertCircle className="text-gray-500" size={20} />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Ready to download';
            case 'failed':
                return 'Download failed';
            case 'processing':
                return 'Processing...';
            case 'queued':
                return 'In queue';
            default:
                return 'Unknown';
        }
    };

    const truncateUrl = (url, maxLength = 50) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Video className="text-indigo-600 mr-3" size={40} />
                        <h1 className="text-4xl font-bold text-gray-800">Video Downloader</h1>
                    </div>
                    <p className="text-gray-600">Download videos from YouTube, Instagram, Twitter and more</p>
                </div>

                {/* Download Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video URL
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube, Instagram, or Twitter video URL here..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Settings className="inline mr-1" size={16} />
                                    Quality
                                </label>
                                <select
                                    value={quality}
                                    onChange={(e) => setQuality(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white"
                                >
                                    <option value="best">Best Quality</option>
                                    <option value="720p">720p</option>
                                    <option value="480p">480p</option>
                                    <option value="360p">360p</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Music className="inline mr-1" size={16} />
                                    Format
                                </label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="mp4">MP4 Video</option>
                                    <option value="webm">WebM Video</option>
                                    <option value="audio">Audio Only (MP3)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !url.trim()}
                            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Clock className="animate-spin mr-2" size={20} />
                                    Starting Download...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2" size={20} />
                                    Start Download
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Downloads List */}
                {downloads.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Downloads</h2>
                        <div className="space-y-4">
                            {downloads.map((download) => (
                                <div
                                    key={download.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-2">
                                                {getStatusIcon(download.status)}
                                                <span className="ml-2 text-sm font-medium text-gray-700">
                          {getStatusText(download.status)}
                        </span>
                                            </div>

                                            <p className="text-sm text-gray-600 truncate mb-1">
                                                {truncateUrl(download.url)}
                                            </p>

                                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                                                <span>Quality: {download.quality}</span>
                                                <span>Format: {download.format || 'auto'}</span>
                                                <span>{download.timestamp.toLocaleTimeString()}</span>
                                            </div>

                                            {download.error && (
                                                <p className="text-sm text-red-600 mt-2">
                                                    Error: {download.error}
                                                </p>
                                            )}
                                        </div>

                                        <div className="ml-4">
                                            {download.status === 'completed' && download.downloadUrl && (
                                                <button
                                                    onClick={() => handleDownloadFile(download.downloadUrl, download.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                                >
                                                    <Download size={16} className="mr-1" />
                                                    Download
                                                </button>
                                            )}

                                            {download.status === 'processing' && (
                                                <div className="flex items-center text-blue-600">
                                                    <Clock className="animate-spin mr-1" size={16} />
                                                    <span className="text-sm">Processing...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Supported Platforms:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• YouTube (videos, shorts, playlists)</li>
                        <li>• Instagram (posts, reels, stories, IGTV)</li>
                        <li>• Twitter/X (video tweets)</li>
                        <li>• TikTok, Facebook, Vimeo, and many more</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VideoDownloader;