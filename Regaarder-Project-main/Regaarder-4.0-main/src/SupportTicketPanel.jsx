import React, { useState, useEffect } from 'react';
import { Loader, Send, MessageSquare, Clock, CheckCircle, AlertCircle, X, Search, Download, Trash2, XCircle, RefreshCw } from 'lucide-react';

const SupportTicketPanel = ({ selectedLanguage = 'English' }) => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const translations = {
    English: {
      title: 'Support Tickets',
      noTickets: 'No support tickets',
      noTicketsSubtext: 'Tickets will appear here when users submit them',
      ticket: 'Ticket',
      from: 'From',
      status: 'Status',
      priority: 'Priority',
      created: 'Created',
      updated: 'Updated',
      open: 'Open',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
      search: 'Search tickets...',
      filterStatus: 'All Statuses',
      filterPriority: 'All Priorities',
      viewDetails: 'View Details',
      close: 'Close',
      delete: 'Delete Ticket',
      responses: 'Responses',
      noResponses: 'No responses yet',
      addResponse: 'Add Response',
      responseText: 'Type your response...',
      send: 'Send Response',
      attachments: 'Attachments',
      noAttachments: 'No attachments',
      changeStatus: 'Change Status',
      changePriority: 'Change Priority',
      loading: 'Loading tickets...',
      markedAs: 'Marked as',
      by: 'by',
      description: 'Description',
      selectTicket: 'Select a ticket to view details',
      deleteConfirmTitle: 'Delete Ticket?',
      deleteConfirmText: 'Are you sure you want to delete this ticket? This action cannot be undone.',
      cancel: 'Cancel',
      confirmDelete: 'Yes, Delete',
      refresh: 'Refresh'
    },
    Spanish: {
      title: 'Tickets de Soporte',
      noTickets: 'Sin tickets de soporte',
      noTicketsSubtext: 'Los tickets aparecerán aquí cuando los usuarios los envíen',
      ticket: 'Ticket',
      from: 'De',
      status: 'Estado',
      priority: 'Prioridad',
      created: 'Creado',
      updated: 'Actualizado',
      open: 'Abierto',
      inProgress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
      search: 'Buscar tickets...',
      filterStatus: 'Todos los Estados',
      filterPriority: 'Todas las Prioridades',
      viewDetails: 'Ver Detalles',
      close: 'Cerrar',
      delete: 'Eliminar Ticket',
      responses: 'Respuestas',
      noResponses: 'Sin respuestas aún',
      addResponse: 'Añadir Respuesta',
      responseText: 'Escriba su respuesta...',
      send: 'Enviar Respuesta',
      attachments: 'Archivos Adjuntos',
      noAttachments: 'Sin archivos adjuntos',
      changeStatus: 'Cambiar Estado',
      changePriority: 'Cambiar Prioridad',
      loading: 'Cargando tickets...',
      markedAs: 'Marcado como',
      by: 'por',
      description: 'Descripción',
      selectTicket: 'Seleccione un ticket para ver detalles',
      deleteConfirmTitle: '¿Eliminar Ticket?',
      deleteConfirmText: '¿Está seguro de que desea eliminar este ticket? Esta acción no se puede deshacer.',
      cancel: 'Cancelar',
      confirmDelete: 'Sí, Eliminar',
      refresh: 'Actualizar'
    },
    French: {
      title: 'Tickets de Support',
      noTickets: 'Aucun ticket de support',
      noTicketsSubtext: 'Les tickets apparaîtront ici lorsque les utilisateurs les soumettront',
      ticket: 'Ticket',
      from: 'De',
      status: 'État',
      priority: 'Priorité',
      created: 'Créé',
      updated: 'Mis à jour',
      open: 'Ouvert',
      inProgress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
      low: 'Basse',
      normal: 'Normal',
      high: 'Haute',
      urgent: 'Urgent',
      search: 'Rechercher des tickets...',
      filterStatus: 'Tous les États',
      filterPriority: 'Toutes les Priorités',
      viewDetails: 'Voir les détails',
      close: 'Fermer',
      delete: 'Supprimer le Ticket',
      responses: 'Réponses',
      noResponses: 'Pas de réponses encore',
      addResponse: 'Ajouter une réponse',
      responseText: 'Tapez votre réponse...',
      send: 'Envoyer la Réponse',
      attachments: 'Pièces jointes',
      noAttachments: 'Aucune pièce jointe',
      changeStatus: 'Changer le statut',
      changePriority: 'Changer la priorité',
      loading: 'Chargement des tickets...',
      markedAs: 'Marqué comme',
      by: 'par',
      description: 'Description',
      selectTicket: 'Sélectionnez un ticket pour voir les détails',
      deleteConfirmTitle: 'Supprimer le Ticket?',
      deleteConfirmText: 'Êtes-vous sûr de vouloir supprimer ce ticket? Cette action ne peut pas être annulée.',
      cancel: 'Annuler',
      confirmDelete: 'Oui, Supprimer',
      refresh: 'Actualiser'
    }
  };

  const t = translations[selectedLanguage] || translations.English;

  // Get staff session info
  const getStaffSession = () => {
    try {
      const session = localStorage.getItem('staffSession');
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.error('Error reading staff session:', e);
    }
    return null;
  };

  const getBackendUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return window.__BACKEND_URL__ || 'https://pwin.onrender.com';
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const staffSession = getStaffSession();
      if (!staffSession || !staffSession.id) {
        setError('Staff session not found. Please log in again.');
        setLoading(false);
        return;
      }

      const backendUrl = getBackendUrl();
      const url = `${backendUrl}/support/tickets?employeeId=${staffSession.id}`;

      console.log('Fetching support tickets:', url);
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('Support tickets received:', data.tickets?.length || 0);
        setTickets(data.tickets || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Support tickets fetch error:', response.status, errorData);
        setError(errorData.error || 'Failed to load tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Server error while loading tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.userEmail || '').toLowerCase().includes(query) ||
        (t.userName || '').toLowerCase().includes(query) ||
        (t.id || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  const getStatusColor = (status) => {
    const colors = {
      open: '#ef4444',
      'in-progress': '#f59e0b',
      resolved: '#10b981',
      closed: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in-progress': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'closed': return <XCircle size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    };
    return colors[priority] || '#3b82f6';
  };

  const handleAddResponse = async () => {
    if (!responseText.trim() || !selectedTicket) return;

    const staffSession = getStaffSession();
    if (!staffSession) return;

    try {
      setSending(true);
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/support/ticket/${selectedTicket.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: responseText,
          employeeId: staffSession.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setTickets(tickets.map(t => t.id === data.ticket.id ? data.ticket : t));
        setResponseText('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to send response');
      }
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Server error');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;

    const staffSession = getStaffSession();
    if (!staffSession) return;

    try {
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/support/ticket/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          employeeId: staffSession.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setTickets(tickets.map(t => t.id === data.ticket.id ? data.ticket : t));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteConfirm) return;

    const staffSession = getStaffSession();
    if (!staffSession) return;

    try {
      setDeleting(true);
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/support/ticket/${deleteConfirm.id}?employeeId=${staffSession.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTickets(tickets.filter(t => t.id !== deleteConfirm.id));
        if (selectedTicket?.id === deleteConfirm.id) {
          setSelectedTicket(null);
        }
        setDeleteConfirm(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Server error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: 'var(--color-gold)' }} />
            <p className="text-gray-600 font-medium">{t.loading}</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in scale-95">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-6 rounded-full bg-red-100">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{t.deleteConfirmTitle}</h3>
            <p className="text-gray-600 text-center mb-6">{t.deleteConfirmText}</p>
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
              <p className="text-sm font-mono text-gray-600 mb-2 truncate">#{String(deleteConfirm.id || '').slice(-10)}</p>
              <p className="text-sm font-medium text-gray-900">{deleteConfirm.title}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteTicket}
                disabled={deleting}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
          <button
            onClick={fetchTickets}
            className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-all hover:shadow-md"
            title={t.refresh}
          >
            <RefreshCw size={20} />
          </button>
        </div>
        <p className="text-gray-500">Manage and respond to customer support requests</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] cursor-pointer transition-all"
          >
            <option value="all">{t.filterStatus}</option>
            <option value="open">{t.open}</option>
            <option value="in-progress">{t.inProgress}</option>
            <option value="resolved">{t.resolved}</option>
            <option value="closed">{t.closed}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] cursor-pointer transition-all"
          >
            <option value="all">{t.filterPriority}</option>
            <option value="low">{t.low}</option>
            <option value="normal">{t.normal}</option>
            <option value="high">{t.high}</option>
            <option value="urgent">{t.urgent}</option>
          </select>
        </div>

        {/* Ticket count */}
        <p className="text-xs text-gray-500 mt-4 font-medium">
          {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
        </p>
      </div>

      {/* Tickets Grid or Detail View */}
      {!selectedTicket ? (
        // Grid View
        <div>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquare size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">{t.noTickets}</p>
              <p className="text-gray-400">{t.noTicketsSubtext}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-all duration-300 hover:translate-y-[-4px]"
                >
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${getStatusColor(ticket.status)}15`,
                        color: getStatusColor(ticket.status)
                      }}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                    <span
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${getPriorityColor(ticket.priority)}15`,
                        color: getPriorityColor(ticket.priority)
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[var(--color-gold)] transition-colors break-words">
                    {ticket.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 truncate">{ticket.userEmail}</p>

                  {/* Description Preview */}
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 break-words">
                    {ticket.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                    {ticket.responses && ticket.responses.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {ticket.responses.length} {ticket.responses.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>

                  {/* Click hint */}
                  <p className="text-xs text-gray-400 mt-4 text-center group-hover:text-[var(--color-gold)] transition-colors">
                    Click to view details
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Detail View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Back Button and Main Content */}
          <div className="lg:col-span-2">
            <button
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
            >
              <X size={20} />
              Back to tickets
            </button>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">{selectedTicket.title}</h1>
                  <p className="text-gray-600">
                    From <span className="font-semibold break-words">{selectedTicket.userName || 'Unknown'}</span>
                    <br />
                    <span className="text-gray-500 text-sm font-mono truncate">{selectedTicket.userEmail}</span>
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(selectedTicket)}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title={t.delete}
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] cursor-pointer"
                  >
                    <option value="open">{t.open}</option>
                    <option value="in-progress">{t.inProgress}</option>
                    <option value="resolved">{t.resolved}</option>
                    <option value="closed">{t.closed}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Priority</label>
                  <div
                    className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: `${getPriorityColor(selectedTicket.priority)}10`,
                      color: getPriorityColor(selectedTicket.priority)
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }} />
                    {selectedTicket.priority?.charAt(0).toUpperCase() + selectedTicket.priority?.slice(1)}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Description</h3>
                <div className="bg-gray-50 p-6 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 break-words overflow-hidden">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Attachments */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Attachments</h3>
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${getBackendUrl()}${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                      >
                        <Download size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{file.originalName}</span>
                        <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  {t.responses} ({selectedTicket.responses?.length || 0})
                </h3>
                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {selectedTicket.responses.map((response) => (
                      <div key={response.id} className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-white text-xs font-bold">
                              {response.staffName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{response.staffName}</p>
                              <p className="text-xs text-gray-500">{formatRelativeTime(response.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{response.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-8">{t.noResponses}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-6 uppercase text-xs tracking-wider">Quick Actions</h3>

              {/* Add Response */}
              {selectedTicket.status !== 'closed' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-3 block uppercase tracking-wider">Add Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={t.responseText}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent resize-none"
                    rows={4}
                  />
                  <button
                    onClick={handleAddResponse}
                    disabled={!responseText.trim() || sending}
                    className="w-full mt-3 py-3 rounded-lg font-medium text-white bg-[var(--color-gold)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    {t.send}
                  </button>
                </div>
              )}

              {/* Status Actions */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                {selectedTicket.status !== 'closed' && (
                  <>
                    {selectedTicket.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange('resolved')}
                        className="w-full py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors border border-green-200 text-sm"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleStatusChange('closed');
                        setTimeout(() => setSelectedTicket(null), 500);
                      }}
                      className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200 text-sm"
                    >
                      Close Ticket
                    </button>
                  </>
                )}
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setDeleteConfirm(selectedTicket)}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors border border-red-200 text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Ticket
                </button>
              </div>

              {/* Info */}
              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                <div>
                  <p className="font-medium text-gray-600">Ticket ID</p>
                  <p className="font-mono text-gray-400 truncate">#{String(selectedTicket.id || '').slice(-10)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError('')} className="ml-2 hover:opacity-75 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SupportTicketPanel;
