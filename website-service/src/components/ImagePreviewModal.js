import React, { useState } from 'react';
import { XMarkIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageName, onDownload }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-medium text-gray-900 truncate pr-4">
            {imageName}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CloudArrowDownIcon className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex items-center justify-center p-6 bg-gray-50 max-h-[calc(90vh-80px)] overflow-auto">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;