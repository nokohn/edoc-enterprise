import {
  User,
  Role,
  Position,
  Department,
  IncomingDocument,
  OutgoingDocument,
  Document,
  DocumentType,
  Task,
  Notification,
  CalendarEvent,
  AuditLog,
  DashboardStats,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('edoc_token');
  }

  private buildQueryString(params: Record<string, any> = {}): string {
    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
        cleanParams[k] = String(v);
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    return query ? `?${query}` : '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      localStorage.removeItem('edoc_token');
      localStorage.removeItem('edoc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  }

  // Auth API
  async login(credentials: { username: string; password: string }) {
    return this.request<{ success: boolean; data: { token: string; user: User }; message: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
  }

  async logout() {
    return this.request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request<{ success: boolean; data: User }>('/auth/me');
  }

  // Dashboard & Reports API
  async getDashboardStats() {
    return this.request<{ success: boolean; data: DashboardStats }>('/reports/dashboard');
  }

  getExcelExportUrl(type: 'incoming' | 'outgoing' | 'tasks') {
    return `${API_BASE}/reports/export/excel?type=${type}&token=${encodeURIComponent(this.getToken() || '')}`;
  }

  // Incoming Documents API
  async getIncomingDocs(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: IncomingDocument[]; pagination: any }>(
      `/incoming-documents${this.buildQueryString(params)}`
    );
  }

  async getIncomingDocById(id: string) {
    return this.request<{ success: boolean; data: IncomingDocument }>(`/incoming-documents/${id}`);
  }

  async createIncomingDoc(formData: FormData) {
    return this.request<{ success: boolean; data: IncomingDocument; message: string }>(
      '/incoming-documents',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async updateIncomingDoc(id: string, formData: FormData) {
    return this.request<{ success: boolean; data: IncomingDocument; message: string }>(
      `/incoming-documents/${id}`,
      {
        method: 'PUT',
        body: formData,
      }
    );
  }

  async deleteIncomingDoc(id: string) {
    return this.request<{ success: boolean; message: string }>(`/incoming-documents/${id}`, {
      method: 'DELETE',
    });
  }

  async assignIncomingDoc(id: string, payload: any) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/incoming-documents/${id}/assign`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  // Outgoing Documents API
  async getOutgoingDocs(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: OutgoingDocument[]; pagination: any }>(
      `/outgoing-documents${this.buildQueryString(params)}`
    );
  }

  async getOutgoingDocById(id: string) {
    return this.request<{ success: boolean; data: OutgoingDocument }>(`/outgoing-documents/${id}`);
  }

  async createOutgoingDoc(formData: FormData) {
    return this.request<{ success: boolean; data: OutgoingDocument; message: string }>(
      '/outgoing-documents',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async updateOutgoingDoc(id: string, formData: FormData) {
    return this.request<{ success: boolean; data: OutgoingDocument; message: string }>(
      `/outgoing-documents/${id}`,
      {
        method: 'PUT',
        body: formData,
      }
    );
  }

  async deleteOutgoingDoc(id: string) {
    return this.request<{ success: boolean; message: string }>(`/outgoing-documents/${id}`, {
      method: 'DELETE',
    });
  }

  async approveOutgoingDoc(id: string, comment?: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/outgoing-documents/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }
    );
  }

  async rejectOutgoingDoc(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/outgoing-documents/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  }

  // Workflow & Approval API
  async getWorkflowSteps() {
    return this.request<{ success: boolean; data: any[]; roles: any[] }>('/workflow/steps');
  }

  async updateWorkflowStep(id: string, payload: any) {
    return this.request<{ success: boolean; message: string; data: any }>(`/workflow/steps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getPendingApprovals(params: Record<string, any> = {}) {
    return this.request<{
      success: boolean;
      data: {
        outgoing: any[];
        incoming: any[];
        stats: {
          totalPending: number;
          incomingPending: number;
          draftCount: number;
          unitReviewCount: number;
          deptApprovalCount: number;
          managementCount: number;
          directorApprovalCount: number;
          urgentCount: number;
        };
      };
    }>(`/workflow/pending${this.buildQueryString(params)}`);
  }

  async getWorkflowHistory(limit: number = 50) {
    return this.request<{ success: boolean; data: any[] }>(`/workflow/history?limit=${limit}`);
  }

  async approveWorkflowStep(id: string, comment?: string, stepName?: string, signatureDataUrl?: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/workflow/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ comment, stepName, signatureDataUrl }),
      }
    );
  }

  async rejectWorkflowStep(id: string, reason: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/workflow/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  }

  // Centralized All Documents API
  async getAllDocuments(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: Document[]; pagination: any }>(
      `/documents${this.buildQueryString(params)}`
    );
  }

  async getDocumentById(id: string) {
    return this.request<{ success: boolean; data: Document }>(`/documents/${id}`);
  }

  async getDocumentTypes() {
    return this.request<{ success: boolean; data: DocumentType[] }>('/documents/meta/types');
  }

  async addDocumentComment(docId: string, content: string, isInternal: boolean = false) {
    return this.request<{ success: boolean; data: any }>(`/documents/${docId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    });
  }

  async uploadAttachment(docId: string, file: File) {
    const formData = new FormData();
    formData.append('attachment', file);
    return this.request<{ success: boolean; data: any }>(`/documents/${docId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  }

  // Tasks API
  async getTasks(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: Task[]; pagination: any }>(
      `/tasks${this.buildQueryString(params)}`
    );
  }

  async getTaskById(id: string) {
    return this.request<{ success: boolean; data: Task }>(`/tasks/${id}`);
  }

  async createTask(payload: any) {
    return this.request<{ success: boolean; data: Task; message: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTask(id: string, payload: any) {
    return this.request<{ success: boolean; data: Task; message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateTaskStatus(id: string, status: string, progress?: number) {
    return this.request<{ success: boolean; data: Task; message: string }>(`/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, progress }),
    });
  }

  async addTaskComment(taskId: string, content: string) {
    return this.request<{ success: boolean; data: any }>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteTask(id: string) {
    return this.request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments API
  async getDepartments() {
    return this.request<{ success: boolean; data: Department[] }>('/departments');
  }

  async getDepartmentTree() {
    return this.request<{ success: boolean; data: any[] }>('/departments/tree');
  }

  async createDepartment(payload: any) {
    return this.request<{ success: boolean; data: Department; message: string }>('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateDepartment(id: string, payload: any) {
    return this.request<{ success: boolean; data: Department; message: string }>(
      `/departments/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteDepartment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Users & Employees API
  async getUsers(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: User[]; pagination: any }>(
      `/users${this.buildQueryString(params)}`
    );
  }

  async createUser(payload: any) {
    return this.request<{ success: boolean; data: User; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUser(id: string, payload: any) {
    return this.request<{ success: boolean; data: User; message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getRoles() {
    return this.request<{ success: boolean; data: Role[] }>('/users/meta/roles');
  }

  async getPositions() {
    return this.request<{ success: boolean; data: Position[] }>('/users/meta/positions');
  }

  // Notifications API
  async getNotifications() {
    return this.request<{ success: boolean; data: Notification[]; unreadCount: number }>(
      '/notifications'
    );
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar API
  async getCalendarEvents(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: CalendarEvent[] }>(
      `/calendar${this.buildQueryString(params)}`
    );
  }

  async createCalendarEvent(payload: any) {
    return this.request<{ success: boolean; data: CalendarEvent; message: string }>('/calendar', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateCalendarEvent(id: string, payload: any) {
    return this.request<{ success: boolean; data: CalendarEvent; message: string }>(
      `/calendar/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteCalendarEvent(id: string) {
    return this.request<{ success: boolean; message: string }>(`/calendar/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit Logs API
  async getAuditLogs(params: Record<string, any> = {}) {
    return this.request<{ success: boolean; data: AuditLog[]; pagination: any }>(
      `/audit-logs${this.buildQueryString(params)}`
    );
  }

  // Settings API
  async getSettings() {
    return this.request<{ success: boolean; data: any[] }>('/settings');
  }

  async updateSettings(settings: { key: string; value: string }[]) {
    return this.request<{ success: boolean; message: string; data: any[] }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // Global Instant Search API
  async globalSearch(q: string) {
    return this.request<{
      success: boolean;
      data: {
        documents: Document[];
        tasks: Task[];
        employees: any[];
        departments: Department[];
      };
    }>(`/search?q=${encodeURIComponent(q)}`);
  }

  // Backup & Restore API
  async exportBackup(scope: 'INCOMING' | 'OUTGOING' | 'ALL' = 'ALL') {
    return this.request<{
      success: boolean;
      data: {
        system: string;
        version: string;
        exportedAt: string;
        scope: string;
        totalCount: number;
        incomingCount: number;
        outgoingCount: number;
        incomingDocs: any[];
        outgoingDocs: any[];
      };
    }>(`/backup/export?scope=${scope}`);
  }

  async restoreBackup(backupData: any) {
    return this.request<{
      success: boolean;
      message: string;
      restoredCount: number;
      restoredIncoming: number;
      restoredOutgoing: number;
    }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  }
}

export const api = new ApiClient();
