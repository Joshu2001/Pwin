import React, { useState, useRef } from 'react';
import { X, Send, Upload, Check, AlertCircle, Loader, FileIcon, ImageIcon, Trash2 } from 'lucide-react';

const SupportTicketModal = ({ isOpen, onClose, selectedLanguage = 'English' }) => {
  const [step, setStep] = useState('form'); // 'form' or 'success'
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const fileInputRef = useRef(null);

  // Generate unique user ID for anonymous users
  const getOrCreateAnonymousUserEmail = () => {
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
      // Generate a unique ID: 'anon_' + timestamp + random string
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymousUserId', anonymousId);
    }
    return `${anonymousId}@anonymous.local`;
  };

  const translations = {
    English: {
      title: 'Contact Support',
      subtitle: 'We\'re here to help! Send us your issue and we\'ll get back to you soon.',
      yourName: 'Your Name',
      yourNamePlaceholder: 'Enter your name',
      ticketTitle: 'Issue Title',
      ticketTitlePlaceholder: 'e.g., Video not playing, Account issue, etc.',
      description: 'Describe Your Issue',
      descriptionPlaceholder: 'Please provide as much detail as possible so we can help you better...',
      addFiles: 'Add Files/Images',
      send: 'Send Ticket',
      sending: 'Sending...',
      attachFiles: 'Attach Files',
      dragDrop: 'Drag files here or click to select',
      successTitle: 'Ticket Submitted! 🎉',
      successMessage: 'Thank you for reaching out. Our support team will review your ticket and respond within 24 hours.',
      backToForm: 'Send Another',
      close: 'Close',
      requiredField: 'This field is required',
      fileSizeError: 'File size must be less than 5MB',
      maxFilesError: 'Maximum 5 files allowed',
      maxTitleLength: 'Title must be less than 100 characters',
      maxDescriptionLength: 'Description must be less than 2000 characters',
    },
    Spanish: {
      title: 'Contactar Soporte',
      subtitle: '¡Estamos aquí para ayudarte! Envíanos tu problema y nos pondremos en contacto pronto.',
      yourName: 'Tu Nombre',
      yourNamePlaceholder: 'Ingresa tu nombre',
      ticketTitle: 'Título del Problema',
      ticketTitlePlaceholder: 'p. ej., Video no se reproduce, Problema de cuenta, etc.',
      description: 'Describe Tu Problema',
      descriptionPlaceholder: 'Por favor proporciona tantos detalles como sea posible para ayudarte mejor...',
      addFiles: 'Añadir Archivos/Imágenes',
      send: 'Enviar Ticket',
      sending: 'Enviando...',
      attachFiles: 'Adjuntar Archivos',
      dragDrop: 'Arrastra archivos aquí o haz clic para seleccionar',
      successTitle: '¡Ticket Enviado! 🎉',
      successMessage: 'Gracias por comunicarte con nosotros. Nuestro equipo de soporte revisará tu ticket y responderá en 24 horas.',
      backToForm: 'Enviar Otro',
      close: 'Cerrar',
      requiredField: 'Este campo es requerido',
      fileSizeError: 'El tamaño del archivo debe ser menor a 5MB',
      maxFilesError: 'Máximo 5 archivos permitidos',
      maxTitleLength: 'El título debe tener menos de 100 caracteres',
      maxDescriptionLength: 'La descripción debe tener menos de 2000 caracteres',
    },
    French: {
      title: 'Contacter le Support',
      subtitle: 'Nous sommes là pour vous aider! Envoyez-nous votre problème et nous vous répondrons bientôt.',
      yourName: 'Votre Nom',
      yourNamePlaceholder: 'Entrez votre nom',
      ticketTitle: 'Titre du Problème',
      ticketTitlePlaceholder: 'p. ex., Vidéo ne se lit pas, Problème de compte, etc.',
      description: 'Décrivez Votre Problème',
      descriptionPlaceholder: 'Veuillez fournir autant de détails que possible pour mieux vous aider...',
      addFiles: 'Ajouter des Fichiers/Images',
      send: 'Envoyer le Ticket',
      sending: 'Envoi...',
      attachFiles: 'Joindre des Fichiers',
      dragDrop: 'Faites glisser les fichiers ici ou cliquez pour sélectionner',
      successTitle: 'Ticket Envoyé! 🎉',
      successMessage: 'Merci de nous avoir contactés. Notre équipe d\'assistance examinera votre ticket et vous répondra dans 24 heures.',
      backToForm: 'Envoyer un Autre',
      close: 'Fermer',
      requiredField: 'Ce champ est obligatoire',
      fileSizeError: 'La taille du fichier doit être inférieure à 5MB',
      maxFilesError: 'Maximum 5 fichiers autorisés',
      maxTitleLength: 'Le titre doit contenir moins de 100 caractères',
      maxDescriptionLength: 'La description doit contenir moins de 2000 caractères',
    }
  };

  const t = translations[selectedLanguage] || translations.English;

  const handleFileSelect = (files) => {
    if (!files) return;
    
    setError('');
    
    if (attachments.length + files.length > 5) {
      setError(t.maxFilesError);
      return;
    }

    const newFiles = [];
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t.fileSizeError);
        continue;
      }
      newFiles.push({
        file,
        id: Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
    }

    setAttachments([...attachments, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId) => {
    setAttachments(attachments.filter(f => f.id !== fileId));
  };

  const validateForm = () => {
    if (!userName.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (!title.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (title.length > 100) {
      setError(t.maxTitleLength);
      return false;
    }
    if (!description.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (description.length > 2000) {
      setError(t.maxDescriptionLength);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('userName', userName.trim());
      formData.append('title', title);
      formData.append('description', description);
      formData.append('userId', localStorage.getItem('userId') || 'anonymous');
      // Use unique email per browser/device for rate limiting
      const userEmail = localStorage.getItem('userEmail') || getOrCreateAnonymousUserEmail();
      formData.append('userEmail', userEmail);
      
      // Add files (field name must match multer config: 'file_')
      attachments.forEach((attachment) => {
        formData.append('file_', attachment.file);
      });

      // Get backend URL
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const backendUrl = window.__BACKEND_URL__ || 'https://pwin.onrender.com';

      // Submit to backend (no auth required for customer submissions)
      const response = await fetch(`${backendUrl}/support/ticket`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit ticket');
      }

      const data = await response.json();
      setTicketId(data.ticketId);

      // Also store locally for offline capability
      const localTickets = JSON.parse(localStorage.getItem('support_tickets') || '[]');
      localTickets.push({
        id: data.ticketId,
        userName: userName.trim(),
        title,
        description,
        attachmentCount: attachments.length,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('support_tickets', JSON.stringify(localTickets));

      // Show success
      setStep('success');
    } catch (err) {
      console.error('Ticket submission error:', err);
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserName('');
    setTitle('');
    setDescription('');
    setAttachments([]);
    setError('');
    setStep('form');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {step === 'form' ? t.title : t.successTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 'form' ? (
            <div className="space-y-5">
              {/* Subtitle */}
              <p className="text-sm text-gray-600 mb-6">{t.subtitle}</p>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t.yourName}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setError('');
                  }}
                  placeholder={t.yourNamePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all"
                  maxLength={50}
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t.ticketTitle}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError('');
                  }}
                  placeholder={t.ticketTitlePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t.description}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all resize-none"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/2000</p>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t.addFiles}
                </label>
                
                {/* File drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[var(--color-gold)] hover:bg-[var(--color-gold-light-bg)] transition-all"
                >
                  <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
                  <p className="text-sm font-medium text-gray-700">{t.dragDrop}</p>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB per file, 5 files total</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {attachment.file.type.startsWith('image/') ? (
                            <ImageIcon size={18} className="text-[var(--color-gold)] flex-shrink-0" />
                          ) : (
                            <FileIcon size={18} className="text-gray-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 truncate">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.size} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(attachment.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors ml-2 flex-shrink-0"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">{attachments.length}/5 files</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                  <Check size={32} className="text-green-600" />
                </div>
              </div>
              <p className="text-gray-700">{t.successMessage}</p>
              <p className="text-sm text-gray-500">Ticket ID: {Date.now()}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 space-y-2">
          {step === 'form' ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
                style={{
                  backgroundColor: isSubmitting ? '#CCC' : 'var(--color-gold)',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>{t.sending}</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>{t.send}</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.close}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                {t.backToForm}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketModal;
