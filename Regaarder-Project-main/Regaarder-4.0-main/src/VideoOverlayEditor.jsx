import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Link as LinkIcon, Image as ImageIcon, Trash2, Clock } from 'lucide-react';

/**
 * VideoOverlayEditor - Allows creators to add interactive overlays (links/images)
 * to their videos with frame-by-frame preview and time selection
 * 
 * Only available for PUBLIC videos
 */
const VideoOverlayEditor = ({ videoFile, isPublic, onOverlaysChange, getTranslation, selectedLanguage }) => {
  const [overlays, setOverlays] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedOverlayIdx, setSelectedOverlayIdx] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPositioningMode, setIsPositioningMode] = useState(false);
  const [formData, setFormData] = useState({
    timeSec: 0,
    durationSec: 3, // NEW: duration in seconds
    type: 'link', // 'link' or 'image'
    url: '',
    imageFile: null,
    imagePreview: null,
    linkText: 'Visit Link',
    linkColor: '#FFD700', // gold
    positionX: 20, // Position from left (pixels)
    positionY: 20, // Position from bottom (pixels)
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Extract video frames and update duration
  useEffect(() => {
    if (!videoFile) return;

    const url = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      setCurrentTime(0);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Draw current video frame on canvas
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    const drawFrame = () => {
      if (video.readyState === video.HAVE_FUTURE_DATA || video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }
    };

    video.addEventListener('seeked', drawFrame);
    drawFrame();

    return () => {
      video.removeEventListener('seeked', drawFrame);
    };
  }, [currentTime]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: ev.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOverlay = () => {
    if (formData.type === 'link' && (!formData.url || !formData.linkText)) {
      alert(getTranslation('Please fill in the link URL and text', selectedLanguage));
      return;
    }
    if (formData.type === 'image' && !formData.imagePreview) {
      alert(getTranslation('Please select an image', selectedLanguage));
      return;
    }

    const newOverlay = {
      id: Date.now(),
      timeSec: Math.round(currentTime * 10) / 10, // Round to 0.1 second
      durationSec: Math.max(0.5, formData.durationSec), // Minimum 0.5 seconds
      type: formData.type,
      positionX: formData.positionX || 20,
      positionY: formData.positionY || 20,
      ...(formData.type === 'link' ? {
        url: formData.url,
        linkText: formData.linkText,
        linkColor: formData.linkColor,
      } : {
        imageData: formData.imagePreview,
        imageName: formData.imageFile?.name,
      })
    };

    const updated = [...overlays, newOverlay];
    setOverlays(updated);
    onOverlaysChange(updated);
    resetForm();
  };

  const handleUpdateOverlay = (idx) => {
    if (selectedOverlayIdx !== idx) return;

    if (formData.type === 'link' && (!formData.url || !formData.linkText)) {
      alert(getTranslation('Please fill in the link URL and text', selectedLanguage));
      return;
    }
    if (formData.type === 'image' && !formData.imagePreview) {
      alert(getTranslation('Please select an image', selectedLanguage));
      return;
    }

    const updated = [...overlays];
    updated[idx] = {
      ...updated[idx],
      timeSec: Math.round(currentTime * 10) / 10,
      durationSec: Math.max(0.5, formData.durationSec),
      type: formData.type,
      positionX: formData.positionX || 20,
      positionY: formData.positionY || 20,
      ...(formData.type === 'link' ? {
        url: formData.url,
        linkText: formData.linkText,
        linkColor: formData.linkColor,
      } : {
        imageData: formData.imagePreview,
        imageName: formData.imageFile?.name,
      })
    };
    setOverlays(updated);
    onOverlaysChange(updated);
    setSelectedOverlayIdx(null);
    resetForm();
  };

  const handleDeleteOverlay = (idx) => {
    const updated = overlays.filter((_, i) => i !== idx);
    setOverlays(updated);
    onOverlaysChange(updated);
  };

  const handleEditOverlay = (idx) => {
    const ov = overlays[idx];
    setSelectedOverlayIdx(idx);
    setCurrentTime(ov.timeSec);
    setFormData({
      timeSec: ov.timeSec,
      durationSec: ov.durationSec || 3,
      type: ov.type,
      url: ov.type === 'link' ? ov.url : '',
      imageFile: null,
      imagePreview: ov.type === 'image' ? ov.imageData : null,
      linkText: ov.type === 'link' ? ov.linkText : 'Visit Link',
      linkColor: ov.type === 'link' ? ov.linkColor : '#FFD700',
      positionX: ov.positionX || 20,
      positionY: ov.positionY || 20,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      timeSec: 0,
      durationSec: 3,
      type: 'link',
      url: '',
      imageFile: null,
      imagePreview: null,
      linkText: 'Visit Link',
      linkColor: '#FFD700',
      positionX: 20,
      positionY: 20,
    });
    setShowAddForm(false);
    setIsPositioningMode(false);
  };

  if (!isPublic) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔒</div>
          <div>
            <div className="font-semibold text-blue-900">{getTranslation('Video Overlays Available for Public Videos Only', selectedLanguage)}</div>
            <div className="text-sm text-blue-800 mt-1">
              {getTranslation('Interactive overlays (links & images) can only be added to public videos. Change your video visibility to Public above to enable this feature.', selectedLanguage)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{getTranslation('Add Interactive Overlays', selectedLanguage)}</div>
          <div className="text-xs text-gray-500 mt-1">{getTranslation('Add clickable links or images that appear at specific moments in your video', selectedLanguage)}</div>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--color-gold)] text-white rounded-lg hover:opacity-90"
          >
            <Plus size={16} />
            <span className="text-sm">{getTranslation('Add Overlay', selectedLanguage)}</span>
          </button>
        )}
      </div>

      {/* Frame preview with timeline */}
      <div className="bg-black rounded-lg overflow-hidden mb-4">
        <div 
          className="aspect-video bg-gray-900 relative flex items-center justify-center"
          style={{ cursor: isPositioningMode ? 'crosshair' : 'default' }}
          onClick={(e) => {
            if (!isPositioningMode || !canvasRef.current) return;
            
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            setFormData(prev => ({
              ...prev,
              positionX: Math.max(0, Math.min(x, rect.width - 100)),
              positionY: Math.max(0, Math.min(rect.height - y, rect.height - 50))
            }));
            setIsPositioningMode(false);
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <video
            ref={videoRef}
            src={videoFile ? URL.createObjectURL(videoFile) : undefined}
            currentTime={currentTime}
            style={{ display: 'none' }}
          />

          {/* Overlay preview at current time with correct positioning */}
          {overlays.map((ov, idx) => {
            const isVisible = currentTime >= ov.timeSec && currentTime < (ov.timeSec + ov.durationSec);
            if (!isVisible) return null;

            return ov.type === 'link' ? (
              <div
                key={ov.id}
                className="absolute px-4 py-2 rounded-lg border-2 text-white font-semibold cursor-pointer transition-transform hover:scale-105"
                style={{
                  left: `${ov.positionX || 20}px`,
                  bottom: `${ov.positionY || 20}px`,
                  backgroundColor: `${ov.linkColor}33`,
                  borderColor: ov.linkColor,

                }}
              >
                🔗 {ov.linkText}
              </div>
            ) : (
              <div 
                key={ov.id} 
                className="absolute rounded-lg overflow-hidden border-2 border-white shadow-lg"
                style={{
                  left: `${ov.positionX || 20}px`,
                  bottom: `${ov.positionY || 20}px`,
                }}
              >
                <img
                  src={ov.imageData}
                  alt="Overlay"
                  className="w-32 h-auto max-h-32 object-contain"
                />
              </div>
            );
          })}
        </div>

        {/* Timeline scrubber */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={16} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max={videoDuration}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                setCurrentTime(newTime);
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime;
                }
              }}
              className="flex-1 cursor-pointer"
            />
            <span className="text-sm text-gray-300 w-16 text-right">
              {Math.floor(currentTime)}s / {Math.floor(videoDuration)}s
            </span>
          </div>

          {/* Frame thumbnails for quick navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Array.from({ length: Math.min(20, Math.ceil(videoDuration)) }).map((_, i) => {
              const t = (i / 20) * videoDuration;
              return (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  className={`w-12 h-9 rounded cursor-pointer flex-shrink-0 border-2 transition-colors ${
                    Math.abs(currentTime - t) < 0.5
                      ? 'border-[var(--color-gold)]'
                      : 'border-gray-600'
                  } hover:border-[var(--color-gold)]`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit overlay form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">
              {selectedOverlayIdx !== null
                ? getTranslation('Edit Overlay', selectedLanguage)
                : getTranslation('New Overlay', selectedLanguage)}
            </div>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Time is set by current position */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">{getTranslation('Time:', selectedLanguage)}</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(currentTime * 10) / 10}s {getTranslation('(adjust timeline above)', selectedLanguage)}
            </div>
          </div>

          {/* Position control */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Position on Video', selectedLanguage)}</div>
            <button
              onClick={() => setIsPositioningMode(!isPositioningMode)}
              className={`w-full px-3 py-2 rounded-lg border-2 transition-colors mb-3 text-sm font-semibold ${
                isPositioningMode
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)] text-[var(--color-gold)]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPositioningMode 
                ? getTranslation('Click on preview to set position', selectedLanguage)
                : getTranslation('Click to position on video', selectedLanguage)}
            </button>
            <div className="flex gap-2 text-xs text-gray-600">
              <span>↖ X: {Math.round(formData.positionX)}px</span>
              <span>↓ Y: {Math.round(formData.positionY)}px</span>
            </div>
          </div>

          {/* Duration control */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">{getTranslation('Display Duration (seconds)', selectedLanguage)}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={formData.durationSec}
                onChange={(e) => setFormData(prev => ({ ...prev, durationSec: parseFloat(e.target.value) }))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-lg font-semibold text-gray-900 w-12 text-right">{formData.durationSec}s</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">{getTranslation('How long the overlay appears on screen', selectedLanguage)}</div>
          </div>

          {/* Type selection */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">{getTranslation('Overlay Type', selectedLanguage)}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'link', imagePreview: null }))}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  formData.type === 'link'
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <LinkIcon size={18} />
                <span className="text-sm font-semibold">{getTranslation('Link', selectedLanguage)}</span>
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'image', url: '' }))}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  formData.type === 'image'
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <ImageIcon size={18} />
                <span className="text-sm font-semibold">{getTranslation('Image', selectedLanguage)}</span>
              </button>
            </div>
          </div>

          {/* Link form */}
          {formData.type === 'link' && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{getTranslation('Link URL', selectedLanguage)}</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{getTranslation('Button Text', selectedLanguage)}</label>
                <input
                  type="text"
                  placeholder={getTranslation('e.g., Visit Link, Learn More', selectedLanguage)}
                  value={formData.linkText}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value.slice(0, 50) }))}
                  maxLength="50"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">{formData.linkText.length}/50</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{getTranslation('Button Color', selectedLanguage)}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.linkColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{formData.linkColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Image form */}
          {formData.type === 'image' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{getTranslation('Upload Image', selectedLanguage)}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {formData.imagePreview ? (
                  <div>
                    <img src={formData.imagePreview} alt="Preview" className="max-h-20 mx-auto mb-2" />
                    <div className="text-xs text-gray-600">{getTranslation('Click to change image', selectedLanguage)}</div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                    <div className="text-sm text-gray-600">{getTranslation('Click to select image', selectedLanguage)}</div>
                    <div className="text-xs text-gray-400 mt-1">{getTranslation('PNG, JPG or WebP', selectedLanguage)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={
                selectedOverlayIdx !== null
                  ? () => handleUpdateOverlay(selectedOverlayIdx)
                  : handleAddOverlay
              }
              className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg font-semibold hover:opacity-90"
            >
              {selectedOverlayIdx !== null
                ? getTranslation('Update Overlay', selectedLanguage)
                : getTranslation('Add Overlay', selectedLanguage)}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {getTranslation('Cancel', selectedLanguage)}
            </button>
          </div>
        </div>
      )}

      {/* Overlay list */}
      {overlays.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">{getTranslation('Overlays', selectedLanguage)} ({overlays.length})</div>
          {overlays.map((ov, idx) => (
            <div
              key={ov.id}
              className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                selectedOverlayIdx === idx
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold-light-bg)]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                if (selectedOverlayIdx === idx) {
                  handleEditOverlay(idx);
                } else {
                  setCurrentTime(ov.timeSec);
                  if (videoRef.current) videoRef.current.currentTime = ov.timeSec;
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {ov.type === 'link' ? '🔗' : '🖼️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {ov.type === 'link' ? ov.linkText : getTranslation('Image Overlay', selectedLanguage)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      @ {ov.timeSec}s ({ov.durationSec}s)
                      {ov.type === 'link' && ` • ${ov.url}`}
                      {ov.type === 'image' && ` • ${ov.imageName}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditOverlay(idx);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--color-gold)] text-white rounded-lg hover:opacity-90 font-medium transition-opacity"
                >
                  {getTranslation('Edit', selectedLanguage)}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOverlay(idx);
                  }}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>{getTranslation('Delete', selectedLanguage)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoOverlayEditor;
