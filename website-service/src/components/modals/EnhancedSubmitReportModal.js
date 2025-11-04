import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

const EnhancedSubmitReportModal = ({ 
  isOpen, 
  task, 
  onClose, 
  onSubmit, 
  reportData, 
  setReportData 
}) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDescriptionChange = (e) => {
    setReportData({
      ...reportData,
      description: e.target.value
    });
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has an unsupported format.`);
        return false;
      }
      
      return true;
    });

    // Create file objects with preview
    const newAttachments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Revoke object URL to prevent memory leaks
      const toRemove = prev.find(att => att.id === id);
      if (toRemove && toRemove.preview) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!reportData.description?.trim()) {
      alert('Please provide a description of your work.');
      return;
    }

    setUploading(true);
    try {
      // Prepare submission data
      const submissionData = {
        taskId: task.id,
        description: reportData.description,
        attachments: attachments
      };

      await onSubmit(submissionData);
      
      // Clean up
      attachments.forEach(att => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });
      setAttachments([]);
      setReportData({ description: '' });
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Submit Task Report</h3>
            <p className="text-sm text-gray-600 mt-1">{task?.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={reportData.description || ''}
              onChange={handleDescriptionChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Describe the work you have completed, challenges faced, and next steps..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a detailed description of your progress and any important notes.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Supports: Images (JPG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
              </p>
              <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </div>

            {/* Attached Files */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Attached Files ({attachments.length})
                </h4>
                <div className="space-y-2">
                  {attachments.map(attachment => (
                    <div 
                      key={attachment.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      {/* File Preview/Icon */}
                      <div className="flex-shrink-0">
                        {attachment.preview ? (
                          <img 
                            src={attachment.preview} 
                            alt={attachment.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : attachment.type.startsWith('image/') ? (
                          <PhotoIcon className="h-10 w-10 text-green-500" />
                        ) : (
                          <DocumentTextIcon className="h-10 w-10 text-blue-500" />
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={uploading || !reportData.description?.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <PaperClipIcon className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubmitReportModal;