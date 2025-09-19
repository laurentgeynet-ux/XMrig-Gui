import React from 'react';
import ReactDOM from 'react-dom';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  version: string;
  description: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, name, version, description }) => {
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full relative border border-slate-700 m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors duration-200"
          aria-label="Close modal"
        >
          <i className="fas fa-times fa-lg"></i>
        </button>
        
        <h2 id="about-modal-title" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-2">
          {name}
        </h2>
        
        <p className="text-sm text-slate-400 mb-6">
          Version {version}
        </p>
        
        <p className="text-slate-300 mb-8">
          {description}
        </p>
        
        <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row justify-around items-center gap-4">
          <a 
            href="https://github.com/xmrig/xmrig" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-slate-300 hover:text-indigo-400 transition-colors duration-200 flex items-center"
          >
            <i className="fab fa-github fa-fw mr-2"></i> XMRig on GitHub
          </a>
          <a 
            href="https://www.tari.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-slate-300 hover:text-purple-400 transition-colors duration-200 flex items-center"
          >
            <i className="fas fa-rocket fa-fw mr-2"></i> Tari Universe
          </a>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default AboutModal;
