import { useState, useRef } from 'react';

export function AddImageModal({ onClose, onUpload, onUploadFromUrl }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const messagesEndRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      await onUpload(file);
    }
    setUploading(false);
    e.target.value = '';
    onClose();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || generating) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setGenerating(true);

    try {
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText,
          history: messages
        })
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error,
          isError: true
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.text || '',
          images: data.images || []
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to the AI service. Make sure the server is running.',
        isError: true
      }]);
    }

    setGenerating(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleImageSelection = (imageUrl) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageUrl)) {
        next.delete(imageUrl);
      } else {
        next.add(imageUrl);
      }
      return next;
    });
  };

  const handleUploadSelected = async () => {
    if (selectedImages.size === 0) return;

    setUploading(true);
    for (const imageUrl of selectedImages) {
      await onUploadFromUrl(imageUrl);
    }
    setUploading(false);
    setSelectedImages(new Set());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-image-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Image</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`modal-tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate with AI
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'upload' && (
            <div className="upload-tab">
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📁</div>
                <p>Click to select PNG files</p>
                <p className="hint">or drag and drop</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {uploading && <p className="uploading-text">Uploading...</p>}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="generate-tab">
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-placeholder">
                    <p>Chat with Gemini to generate images</p>
                    <p className="hint">Describe the image you want to create</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    {msg.role === 'user' ? (
                      <div className="message-content user-message">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="message-content assistant-message">
                        {msg.isError ? (
                          <span className="error-text">{msg.content}</span>
                        ) : (
                          <>
                            {msg.content && <p>{msg.content}</p>}
                            {msg.images && msg.images.length > 0 && (
                              <div className="generated-images">
                                {msg.images.map((img, j) => (
                                  <div
                                    key={j}
                                    className={`generated-image ${selectedImages.has(img.url) ? 'selected' : ''}`}
                                    onClick={() => toggleImageSelection(img.url)}
                                  >
                                    <img src={img.url} alt={img.alt || 'Generated image'} />
                                    <div className="image-select-indicator">
                                      {selectedImages.has(img.url) ? '✓' : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {generating && (
                  <div className="chat-message assistant">
                    <div className="message-content assistant-message">
                      <span className="generating-indicator">Generating...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the image you want..."
                  rows={2}
                  disabled={generating}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || generating}
                >
                  Send
                </button>
              </div>

              {selectedImages.size > 0 && (
                <div className="selected-images-bar">
                  <span>{selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected</span>
                  <button onClick={handleUploadSelected} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Add to Project'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
