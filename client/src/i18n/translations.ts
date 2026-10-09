export type Language = 'lo' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  login: {
    title: string;
    subtitle: string;
    username: string;
    password: string;
    showPassword: string;
    hidePassword: string;
    rememberMe: string;
    forgotPassword: string;
    forgotPasswordDesc: string;
    loginBtn: string;
    loggingIn: string;
    loginSuccess: string;
    loginError: string;
    adminDemoNote: string;
    copyAdminCredentials: string;
  };
  nav: {
    dashboard: string;
    incomingDocs: string;
    outgoingDocs: string;
    workflow: string;
    allDocs: string;
    assignTask: string;
    taskTracking: string;
    calendar: string;
    notifications: string;
    employees: string;
    departments: string;
    reports: string;
    auditLogs: string;
    settings: string;
  };
  header: {
    searchPlaceholder: string;
    notifications: string;
    markAllRead: string;
    viewAllNotifications: string;
    profile: string;
    myTasks: string;
    myDocuments: string;
    settings: string;
    logout: string;
    language: string;
    theme: string;
  };
  dashboard: {
    title: string;
    welcome: string;
    quickActions: string;
    newIncoming: string;
    newOutgoing: string;
    assignWork: string;
    addUser: string;
    kpi: {
      incomingDocs: string;
      outgoingDocs: string;
      assignedTasks: string;
      inProgressTasks: string;
      completedTasks: string;
      pendingTasks: string;
      pendingApprovals: string;
    };
    charts: {
      incomingByMonth: string;
      outgoingByMonth: string;
      tasksByStatus: string;
      tasksByDept: string;
      workflowStats: string;
      employeeWorkload: string;
      overdueTasks: string;
    };
    recent: {
      recentDocs: string;
      recentTasks: string;
      recentApprovals: string;
      recentCompleted: string;
      viewAll: string;
    };
  };
  documents: {
    incomingTitle: string;
    outgoingTitle: string;
    allTitle: string;
    docId: string;
    incomingNumber: string;
    outgoingNumber: string;
    documentNumber: string;
    docDate: string;
    receivedDate: string;
    receivedTime: string;
    senderOrg: string;
    senderName: string;
    recipientOrg: string;
    recipientName: string;
    subject: string;
    type: string;
    priority: string;
    confidentialLevel: string;
    department: string;
    responsiblePerson: string;
    status: string;
    dueDate: string;
    description: string;
    attachment: string;
    uploadFile: string;
    notes: string;
    actions: string;
    addIncoming: string;
    addOutgoing: string;
    editDoc: string;
    deleteDoc: string;
    viewDetail: string;
    trackingSheet: string;
    printSheet: string;
    downloadPdf: string;
    exportExcel: string;
    filterByDept: string;
    filterByStatus: string;
    filterByType: string;
    filterByPriority: string;
    searchDocs: string;
    tabs: {
      overview: string;
      attachments: string;
      tasks: string;
      workflow: string;
      comments: string;
      history: string;
      audit: string;
    };
  };
  tasks: {
    title: string;
    assignTitle: string;
    trackingTitle: string;
    taskId: string;
    taskTitle: string;
    relatedDoc: string;
    assignedBy: string;
    assignedTo: string;
    priority: string;
    startDate: string;
    dueDate: string;
    status: string;
    progress: string;
    description: string;
    addComment: string;
    submitReview: string;
    approveTask: string;
    completeTask: string;
    views: {
      list: string;
      kanban: string;
      timeline: string;
      calendar: string;
    };
  };
  common: {
    save: string;
    edit: string;
    delete: string;
    cancel: string;
    confirm: string;
    back: string;
    search: string;
    filter: string;
    reset: string;
    export: string;
    import: string;
    close: string;
    loading: string;
    emptyData: string;
    emptyDesc: string;
    success: string;
    error: string;
    all: string;
    page: string;
    of: string;
    rowsPerPage: string;
    total: string;
  };
  swal: {
    confirmDeleteTitle: string;
    confirmDeleteText: string;
    deleteBtn: string;
    cancelBtn: string;
    deletedSuccess: string;
    saveSuccess: string;
    updateSuccess: string;
    confirmApproveTitle: string;
    confirmApproveText: string;
    approveBtn: string;
    approvedSuccess: string;
    rejectTitle: string;
    rejectReasonPlaceholder: string;
    rejectBtn: string;
    rejectedSuccess: string;
  };
}

export const translations: Record<Language, Translations> = {
  lo: {
    appName: "E-Document Management",
    appSubtitle: "ລະບົບຄຸ້ມຄອງເອກະສານ ແລະ ການໄຫຼວຽນວຽກງານອິເລັກໂຕຣນິກ",
    login: {
      title: "ເຂົ້າສູ່ລະບົບ E-Document Management",
      subtitle: "ລະບົບຄຸ້ມຄອງເອກະສານ ແລະ ການໄຫຼວຽນວຽກງານອິເລັກໂຕຣນິກ",
      username: "ຊື່ຜູ້ໃຊ້ (Username)",
      password: "ລະຫັດຜ່ານ (Password)",
      showPassword: "ສະແດງລະຫັດຜ່ານ",
      hidePassword: "ເຊື່ອງລະຫັດຜ່ານ",
      rememberMe: "ຈື່ຂ້ອຍໄວ້ໃນລະບົບ",
      forgotPassword: "ລືມລະຫັດຜ່ານ?",
      forgotPasswordDesc: "ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານລະບົບ (IT Admin) ເພື່ອຣີເຊັດລະຫັດຜ່ານ",
      loginBtn: "ເຂົ້າສູ່ລະບົບ",
      loggingIn: "ກຳລັງເຂົ້າສູ່ລະບົບ...",
      loginSuccess: "ເຂົ້າສູ່ລະບົບສຳເລັດແລ້ວ!",
      loginError: "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ",
      adminDemoNote: "ບັນຊີຜູ້ບໍລິຫານທົດສອບ (Admin Demo):",
      copyAdminCredentials: "ຄລິກເພື່ອໃຊ້ບັນຊີ Admin ທົດສອບ",
    },
    nav: {
      dashboard: "ໜ້າຫຼັກ (Dashboard)",
      incomingDocs: "ເອກະສານຂາເຂົ້າ",
      outgoingDocs: "ເອກະສານຂາອອກ",
      workflow: "ຂັ້ນຕອນອະນຸມັດ",
      allDocs: "ເອກະສານທັງໝົດ",
      assignTask: "ມອບໝາຍວຽກ",
      taskTracking: "ຕິດຕາມວຽກງານ",
      calendar: "ຕາຕະລາງວຽກງານ",
      notifications: "ແຈ້ງເຕືອນ",
      employees: "ຜູ້ໃຊ້ງານເຂົ້າລະບົບ",
      departments: "ພະແນກ / ໜ່ວຍງານ",
      reports: "ລາຍງານ & ສະຖິຕິ",
      auditLogs: "Audit Log (ປະຫວັດ)",
      settings: "ຕັ້ງຄ່າລະບົບ",
    },
    header: {
      searchPlaceholder: "ຄົ້ນຫາເອກະສານ, ວຽກ, ຜູ້ໃຊ້ງານ, ເລກທີ...",
      notifications: "ແຈ້ງເຕືອນ",
      markAllRead: "ໝາຍວ່າອ່ານໝົດແລ້ວ",
      viewAllNotifications: "ເບິ່ງການແຈ້ງເຕືອນທັງໝົດ",
      profile: "ໂປຣໄຟລ໌ຂອງຂ້ອຍ",
      myTasks: "ວຽກຂອງຂ້ອຍ",
      myDocuments: "ເອກະສານຂອງຂ້ອຍ",
      settings: "ການຕັ້ງຄ່າ",
      logout: "ອອກຈາກລະບົບ",
      language: "ພາສາ",
      theme: "ໂໝດສະແດງຜົນ",
    },
    dashboard: {
      title: "Dashboard",
      welcome: "ສະບາຍດີ, ຍິນດີຕ້ອນຮັບສູ່ລະບົບ E-Document Management",
      quickActions: "ການດຳເນີນການດ່ວນ",
      newIncoming: "ເພີ່ມຂາເຂົ້າ",
      newOutgoing: "ສ້າງຂາອອກ",
      assignWork: "ມອບໝາຍວຽກ",
      addUser: "ເພີ່ມຜູ້ໃຊ້",
      kpi: {
        incomingDocs: "ຂາເຂົ້າ",
        outgoingDocs: "ຂາອອກ",
        assignedTasks: "ວຽກງານທີ່ຮັບມອບ",
        inProgressTasks: "ວຽກກຳລັງດຳເນີນ",
        completedTasks: "ວຽກງານສຳເລັດ",
        pendingTasks: "ວຽກງານຄ້າງ",
        pendingApprovals: "ລໍຖ້າອະນຸມັດ",
      },
      charts: {
        incomingByMonth: "ສະຖິຕິເອກະສານຂາເຂົ້າລາຍເດືອນ",
        outgoingByMonth: "ສະຖິຕິເອກະສານຂາອອກລາຍເດືອນ",
        tasksByStatus: "ສະຖານະວຽກງານທັງໝົດ",
        tasksByDept: "ວຽກງານແຍກຕາມພະແນກ",
        workflowStats: "ສະຖິຕິການໄຫຼວຽນເອກະສານ",
        employeeWorkload: "ປະລິມານວຽກງານຂອງຜູ້ໃຊ້ງານເຂົ້າລະບົບ",
        overdueTasks: "ວຽກງານທີ່ກາຍກຳນົດ (Overdue)",
      },
      recent: {
        recentDocs: "ເອກະສານຫຼ້າສຸດ",
        recentTasks: "ວຽກງານທີ່ໄດ້ຮັບມອບໝາຍໃໝ່",
        recentApprovals: "ລາຍການລໍຖ້າອະນຸມັດ",
        recentCompleted: "ວຽກງານທີ່ສຳເລັດແລ້ວ",
        viewAll: "ເບິ່ງທັງໝົດ",
      },
    },
    documents: {
      incomingTitle: "ລາຍການເອກະສານຂາເຂົ້າ",
      outgoingTitle: "ລາຍການເອກະສານຂາອອກ",
      allTitle: "ຄັງເກັບເອກະສານທັງໝົດ",
      docId: "ລະຫັດເອກະສານ",
      incomingNumber: "ເລກທີຂາເຂົ້າ",
      outgoingNumber: "ເລກທີຂາອອກ",
      documentNumber: "ເລກທີເອກະສານຕົ້ນສະບັບ",
      docDate: "ລົງວັນທີ",
      receivedDate: "ວັນທີຮັບ",
      receivedTime: "ເວລາຮັບ",
      senderOrg: "ໜ່ວຍງານສົ່ງ / ຈາກ",
      senderName: "ຜູ້ສົ່ງ / ລົງລາຍເຊັນ",
      recipientOrg: "ໜ່ວຍງານຮັບ / ເຖິງ",
      recipientName: "ຜູ້ຮັບ / ຕຳແໜ່ງ",
      subject: "ຫົວຂໍ້ / ເນື້ອໃນຫຍໍ້",
      type: "ປະເພດເອກະສານ",
      priority: "ລະດັບຄວາມສຳຄັນ",
      confidentialLevel: "ລະດັບຄວາມລັບ",
      department: "ພະແນກກ່ຽວຂ້ອງ",
      responsiblePerson: "ຜູ້ຮັບຜິດຊອບ",
      status: "ສະຖານະ",
      dueDate: "ກຳນົດເວລາ",
      description: "ລາຍລະອຽດເພີ່ມເຕີມ",
      attachment: "ໄຟລ໌ຄັດຕິດ",
      uploadFile: "ອັບໂຫຼດໄຟລ໌ (PDF, Word, Excel, ຮູບພາບ)",
      notes: "ໝາຍເຫດ",
      actions: "ຈັດການ",
      addIncoming: "+ ເພີ່ມເອກະສານຂາເຂົ້າ",
      addOutgoing: "+ ສ້າງເອກະສານຂາອອກ",
      editDoc: "ແກ້ໄຂເອກະສານ",
      deleteDoc: "ລຶບເອກະສານ",
      viewDetail: "ລາຍລະອຽດ",
      trackingSheet: "ໃບຕິດຕາມເອກະສານ",
      printSheet: "ພິມໃບຕິດຕາມ (A4)",
      downloadPdf: "ດາວໂຫຼດ PDF",
      exportExcel: "ສົ່ງອອກ Excel",
      filterByDept: "ເລືອກພະແນກ",
      filterByStatus: "ເລືອກສະຖານະ",
      filterByType: "ເລືອກປະເພດ",
      filterByPriority: "ລະດັບຄວາມຮີບດ່ວນ",
      searchDocs: "ຄົ້ນຫາເລກທີ, ຫົວຂໍ້, ໜ່ວຍງານສົ່ງ...",
      tabs: {
        overview: "ພາບລວມ",
        attachments: "ໄຟລ໌ຄັດຕິດ",
        tasks: "ວຽກທີ່ມອບໝາຍ",
        workflow: "ຂັ້ນຕອນການໄຫຼວຽນ (Workflow)",
        comments: "ຄຳເຫັນ & ບັນທຶກ",
        history: "ປະຫວັດການປ່ຽນແປງ",
        audit: "Audit Log",
      },
    },
    tasks: {
      title: "ລະບົບຄຸ້ມຄອງວຽກງານ",
      assignTitle: "ມອບໝາຍວຽກງານໃໝ່",
      trackingTitle: "ຕິດຕາມ ແລະ ກວດກາວຽກງານ",
      taskId: "ລະຫັດວຽກ",
      taskTitle: "ຫົວຂໍ້ວຽກງານ",
      relatedDoc: "ເອກະສານກ່ຽວຂ້ອງ",
      assignedBy: "ຜູ້ມອບໝາຍ",
      assignedTo: "ມອບໝາຍໃຫ້",
      priority: "ຄວາມຮີບດ່ວນ",
      startDate: "ວັນທີເລີ່ມ",
      dueDate: "ກຳນົດສົ່ງ",
      status: "ສະຖານະ",
      progress: "ຄວາມຄືບໜ້າ (%)",
      description: "ຄຳແນະນຳ / ລາຍລະອຽດວຽກ",
      addComment: "ເພີ່ມຄວາມເຫັນ / ລາຍງານຄວາມຄືບໜ້າ",
      submitReview: "ສົ່ງກວດສອບ",
      approveTask: "ອະນຸມັດວຽກ",
      completeTask: "ຢືນຢັນສຳເລັດວຽກ",
      views: {
        list: "ລາຍການ (List)",
        kanban: "ກະດານ Kanban",
        timeline: "Timeline",
        calendar: "ປະຕິທິນ (Calendar)",
      },
    },
    common: {
      save: "ບັນທຶກ",
      edit: "ແກ້ໄຂ",
      delete: "ລຶບ",
      cancel: "ຍົກເລີກ",
      confirm: "ຢືນຢັນ",
      back: "ກັບຄືນ",
      search: "ຄົ້ນຫາ",
      filter: "ກັ່ນຕອງ",
      reset: "ລ້າງຄ່າ",
      export: "ສົ່ງອອກ",
      import: "ນຳເຂົ້າ",
      close: "ປິດ",
      loading: "ກຳລັງໂຫຼດຂໍ້ມູນ...",
      emptyData: "ບໍ່ພົບຂໍ້ມູນ",
      emptyDesc: "ຍັງບໍ່ທັນມີຂໍ້ມູນໃນລະບົບ ຫຼື ບໍ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ",
      success: "ສຳເລັດ",
      error: "ເກີດຂໍ້ຜິດພາດ",
      all: "ທັງໝົດ",
      page: "ໜ້າ",
      of: "ຈາກ",
      rowsPerPage: "ສະແດງຕໍ່ໜ້າ",
      total: "ລວມທັງໝົດ",
    },
    swal: {
      confirmDeleteTitle: "⚠️ ຢືນຢັນການລຶບ?",
      confirmDeleteText: "ທ່ານຕ້ອງການລຶບຂໍ້ມູນນີ້ແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້!",
      deleteBtn: "ລຶບຂໍ້ມູນ",
      cancelBtn: "ຍົກເລີກ",
      deletedSuccess: "ລຶບຂໍ້ມູນສຳເລັດແລ້ວ!",
      saveSuccess: "ບັນທຶກຂໍ້ມູນສຳເລັດ",
      updateSuccess: "ແກ້ໄຂຂໍ້ມູນສຳເລັດ",
      confirmApproveTitle: "ຢືນຢັນການອະນຸມັດ?",
      confirmApproveText: "ທ່ານຕ້ອງການອະນຸມັດເອກະສານ/ວຽກງານນີ້ແທ້ບໍ?",
      approveBtn: "ອະນຸມັດ",
      approvedSuccess: "ອະນຸມັດສຳເລັດແລ້ວ!",
      rejectTitle: "ປະຕິເສດ / ສົ່ງກັບຄືນ",
      rejectReasonPlaceholder: "ກະລຸນາໃສ່ເຫດຜົນໃນການປະຕິເສດ...",
      rejectBtn: "ຢືນຢັນປະຕິເສດ",
      rejectedSuccess: "ສົ່ງກັບຄືນສຳເລັດແລ້ວ!",
    },
  },
  en: {
    appName: "E-Document Management",
    appSubtitle: "Electronic Document & Workflow Management System",
    login: {
      title: "Sign in to E-Document Management",
      subtitle: "Electronic Document & Workflow Management System",
      username: "Username",
      password: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      forgotPasswordDesc: "Please contact IT Administrator to reset your password",
      loginBtn: "Sign In",
      loggingIn: "Signing in...",
      loginSuccess: "Signed in successfully!",
      loginError: "Invalid username or password",
      adminDemoNote: "Admin Demo Account:",
      copyAdminCredentials: "Click to fill admin credentials",
    },
    nav: {
      dashboard: "Dashboard",
      incomingDocs: "Incoming Documents",
      outgoingDocs: "Outgoing Documents",
      workflow: "Approval Steps",
      allDocs: "All Documents",
      assignTask: "Assign Task",
      taskTracking: "Task Tracking",
      calendar: "Calendar & Schedule",
      notifications: "Notifications",
      employees: "Employees / Personnel",
      departments: "Departments / Units",
      reports: "Reports & Analytics",
      auditLogs: "Audit Logs",
      settings: "System Settings",
    },
    header: {
      searchPlaceholder: "Search documents, tasks, employees, doc numbers...",
      notifications: "Notifications",
      markAllRead: "Mark all as read",
      viewAllNotifications: "View all notifications",
      profile: "My Profile",
      myTasks: "My Tasks",
      myDocuments: "My Documents",
      settings: "Settings",
      logout: "Sign Out",
      language: "Language",
      theme: "Theme",
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome to E-Document Management Portal",
      quickActions: "Quick Actions",
      newIncoming: "New Incoming",
      newOutgoing: "New Outgoing",
      assignWork: "Assign Task",
      addUser: "Add User",
      kpi: {
        incomingDocs: "Incoming",
        outgoingDocs: "Outgoing",
        assignedTasks: "Assigned Tasks",
        inProgressTasks: "In Progress",
        completedTasks: "Completed Tasks",
        pendingTasks: "Pending Tasks",
        pendingApprovals: "Pending Approvals",
      },
      charts: {
        incomingByMonth: "Incoming Documents by Month",
        outgoingByMonth: "Outgoing Documents by Month",
        tasksByStatus: "Tasks by Status",
        tasksByDept: "Tasks by Department",
        workflowStats: "Document Workflow Statistics",
        employeeWorkload: "Employee Workload",
        overdueTasks: "Overdue Tasks",
      },
      recent: {
        recentDocs: "Recent Documents",
        recentTasks: "Recent Assignments",
        recentApprovals: "Pending Approvals",
        recentCompleted: "Recently Completed",
        viewAll: "View All",
      },
    },
    documents: {
      incomingTitle: "Incoming Documents Registry",
      outgoingTitle: "Outgoing Documents Registry",
      allTitle: "Central Document Repository",
      docId: "Document ID",
      incomingNumber: "Incoming No.",
      outgoingNumber: "Outgoing No.",
      documentNumber: "Original Doc No.",
      docDate: "Document Date",
      receivedDate: "Received Date",
      receivedTime: "Received Time",
      senderOrg: "Sender Organization",
      senderName: "Sender Name / Signatory",
      recipientOrg: "Recipient Organization",
      recipientName: "Recipient Name / Title",
      subject: "Subject / Summary",
      type: "Document Type",
      priority: "Priority Level",
      confidentialLevel: "Confidentiality",
      department: "Related Department",
      responsiblePerson: "Responsible Officer",
      status: "Status",
      dueDate: "Due Date",
      description: "Description & Details",
      attachment: "Attachments",
      uploadFile: "Upload File (PDF, DOCX, XLSX, Images)",
      notes: "Remarks / Notes",
      actions: "Actions",
      addIncoming: "+ New Incoming Doc",
      addOutgoing: "+ New Outgoing Doc",
      editDoc: "Edit Document",
      deleteDoc: "Delete Document",
      viewDetail: "View Details",
      trackingSheet: "Routing Slip",
      printSheet: "Print Tracking Sheet (A4)",
      downloadPdf: "Download PDF",
      exportExcel: "Export to Excel",
      filterByDept: "Filter by Department",
      filterByStatus: "Filter by Status",
      filterByType: "Filter by Type",
      filterByPriority: "Filter by Priority",
      searchDocs: "Search by number, subject, sender...",
      tabs: {
        overview: "Overview",
        attachments: "Attachments",
        tasks: "Assigned Tasks",
        workflow: "Workflow Timeline",
        comments: "Comments & Notes",
        history: "Revision History",
        audit: "Audit Trail",
      },
    },
    tasks: {
      title: "Task Management System",
      assignTitle: "Assign New Task",
      trackingTitle: "Task Tracking & Inspection",
      taskId: "Task Code",
      taskTitle: "Task Title",
      relatedDoc: "Related Document",
      assignedBy: "Assigned By",
      assignedTo: "Assigned To",
      priority: "Priority",
      startDate: "Start Date",
      dueDate: "Due Date",
      status: "Status",
      progress: "Progress (%)",
      description: "Instructions / Scope of Work",
      addComment: "Post Progress / Comment",
      submitReview: "Submit for Review",
      approveTask: "Approve Task",
      completeTask: "Mark as Completed",
      views: {
        list: "List View",
        kanban: "Kanban Board",
        timeline: "Timeline View",
        calendar: "Calendar View",
      },
    },
    common: {
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      confirm: "Confirm",
      back: "Back",
      search: "Search",
      filter: "Filter",
      reset: "Reset",
      export: "Export",
      import: "Import",
      close: "Close",
      loading: "Loading data...",
      emptyData: "No data found",
      emptyDesc: "There are no records matching your query or filter criteria",
      success: "Success",
      error: "An error occurred",
      all: "All",
      page: "Page",
      of: "of",
      rowsPerPage: "Rows per page",
      total: "Total",
    },
    swal: {
      confirmDeleteTitle: "⚠️ Confirm Deletion?",
      confirmDeleteText: "Are you sure you want to delete this record? This action cannot be undone!",
      deleteBtn: "Delete",
      cancelBtn: "Cancel",
      deletedSuccess: "Record deleted successfully!",
      saveSuccess: "Saved successfully",
      updateSuccess: "Updated successfully",
      confirmApproveTitle: "Confirm Approval?",
      confirmApproveText: "Are you sure you want to approve this item?",
      approveBtn: "Approve",
      approvedSuccess: "Approved successfully!",
      rejectTitle: "Reject / Return for Revision",
      rejectReasonPlaceholder: "Please enter the rejection reason...",
      rejectBtn: "Confirm Rejection",
      rejectedSuccess: "Item returned for revision!",
    },
  },
};
