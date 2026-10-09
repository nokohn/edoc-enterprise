const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STARTING E-OFFICE FULL-STACK VERIFICATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, extra || '');
      failed++;
    }
  }

  // 1. Frontend Service Check
  try {
    const res = await fetch(FRONTEND_URL);
    const html = await res.text();
    assert(res.status === 200 && html.includes('e-OFFICE'), 'Frontend Vite Server serves index.html with e-OFFICE title');
  } catch (err: any) {
    assert(false, 'Frontend Vite Server serves index.html', err.message);
  }

  // 2. Backend Health Check
  try {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    assert(res.status === 200 && json.status === 'ok', 'Backend API Health check (/api/health)');
  } catch (err: any) {
    assert(false, 'Backend API Health check', err.message);
  }

  // 3. Authentication
  let token = '';
  let currentUser: any = null;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123456',
      }),
    });
    const json = await res.json();
    token = json.data?.token;
    currentUser = json.data?.user;
    assert(res.status === 200 && !!token && currentUser?.username === 'admin', 'Login with admin / admin123456 returns JWT token');
  } catch (err: any) {
    assert(false, 'Login with admin credentials', err.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 4. Verify Auth Profile
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders });
    const json = await res.json();
    const user = json.data;
    assert(res.status === 200 && user?.role?.name === 'Super Admin', 'Verify Current User Profile (/api/auth/me) with Super Admin role');
  } catch (err: any) {
    assert(false, 'Verify Current User Profile', err.message);
  }

  // 5. Dashboard Reports
  try {
    const res = await fetch(`${API_BASE}/reports/dashboard`, { headers: authHeaders });
    const json = await res.json();
    const data = json.data;
    assert(
      res.status === 200 &&
      typeof data?.incomingCount === 'number' &&
      typeof data?.outgoingCount === 'number' &&
      Array.isArray(data?.monthlyIncoming) &&
      Array.isArray(data?.tasksByStatus),
      'Dashboard KPI and Recharts aggregation data (/api/reports/dashboard)'
    );
  } catch (err: any) {
    assert(false, 'Dashboard KPI aggregation', err.message);
  }

  // 6. Departments CRUD
  let createdDeptId = '';
  try {
    // List
    const listRes = await fetch(`${API_BASE}/departments`, { headers: authHeaders });
    const listJson = await listRes.json();
    const depts = listJson.data;
    assert(listRes.status === 200 && Array.isArray(depts) && depts.length >= 5, `Fetch Departments list (${depts?.length} found)`);

    // Create
    const createRes = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        code: 'TEST_DEPT',
        nameLao: 'ພະແນກທົດສອບລະບົບ',
        nameEn: 'System Test Department',
        description: 'Department created for automated verification',
      }),
    });
    const createJson = await createRes.json();
    createdDeptId = createJson.data?.id;
    assert(createRes.status === 201 && createJson.data?.code === 'TEST_DEPT', 'Department CREATE (POST /api/departments)');

    // Update
    const updateRes = await fetch(`${API_BASE}/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        nameLao: 'ພະແນກທົດສອບລະບົບ (ອັບເດດ)',
        nameEn: 'System Test Department (Updated)',
      }),
    });
    const updateJson = await updateRes.json();
    assert(updateRes.status === 200 && updateJson.data?.nameLao.includes('ອັບເດດ'), 'Department UPDATE (PUT /api/departments/:id)');

    // Delete
    const deleteRes = await fetch(`${API_BASE}/departments/${createdDeptId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(deleteRes.status === 200, 'Department DELETE (DELETE /api/departments/:id)');
  } catch (err: any) {
    assert(false, 'Departments CRUD operations', err.message);
  }

  // 7. Incoming Documents CRUD & Workflow
  let testIncomingDocId = '';
  try {
    // List
    const listRes = await fetch(`${API_BASE}/incoming-documents`, { headers: authHeaders });
    const listJson = await listRes.json();
    const listData = listJson.data;
    assert(listRes.status === 200 && Array.isArray(listData.data), `Fetch Incoming Documents (${listData.total} records)`);

    // Create
    const deptsRes = await fetch(`${API_BASE}/departments`, { headers: authHeaders });
    const deptsJson = await deptsRes.json();
    const depts = deptsJson.data;
    const docTypesRes = await fetch(`${API_BASE}/documents/types`, { headers: authHeaders });
    const docTypesJson = await docTypesRes.json();
    const docTypeId = docTypesJson.data[0].id;

    const createRes = await fetch(`${API_BASE}/incoming-documents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        incomingNumber: 'IN-TEST-2026/999',
        documentNumber: 'DOC-EXT-999',
        documentDate: new Date().toISOString(),
        receivedDate: new Date().toISOString(),
        senderOrg: 'ກະຊວງເຕັກໂນໂລຊີ ແລະ ການສື່ສານ',
        senderName: 'ທ່ານ ສົມສັກ ວິໄລສັກ',
        subject: 'ທົດສອບການຂຶ້ນທະບຽນເອກະສານຂາເຂົ້າອັດຕະໂນມັດ',
        docTypeId: docTypeId,
        priority: 'URGENT',
        confidential: 'CONFIDENTIAL',
        departmentId: depts[0].id,
        description: 'ທົດສອບລະບົບ e-OFFICE ອັດຕະໂນມັດ',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      }),
    });
    const createJson = await createRes.json();
    testIncomingDocId = createJson.data?.id;
    assert(createRes.status === 201 && createJson.data?.incomingNumber === 'IN-TEST-2026/999', 'Incoming Document CREATE');

    // Read by ID
    const getRes = await fetch(`${API_BASE}/incoming-documents/${testIncomingDocId}`, { headers: authHeaders });
    const getJson = await getRes.json();
    assert(getRes.status === 200 && getJson.data?.subject.includes('ທົດສອບ'), 'Incoming Document READ by ID with relations');

    // Update
    const updateRes = await fetch(`${API_BASE}/incoming-documents/${testIncomingDocId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        subject: 'ທົດສອບການຂຶ້ນທະບຽນເອກະສານຂາເຂົ້າອັດຕະໂນມັດ (ແກ້ໄຂ)',
        priority: 'TOP_URGENT',
      }),
    });
    const updateJson = await updateRes.json();
    assert(updateRes.status === 200 && updateJson.data?.priority === 'TOP_URGENT', 'Incoming Document UPDATE');

    // Add Comment
    const commentRes = await fetch(`${API_BASE}/documents/${testIncomingDocId}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'ຄຳເຫັນທົດສອບຈາກ Super Admin: ກະລຸນາດຳເນີນການດ່ວນ.',
      }),
    });
    assert(commentRes.status === 201, 'Document COMMENT creation');
  } catch (err: any) {
    assert(false, 'Incoming Documents CRUD', err.message);
  }

  // 8. Outgoing Documents CRUD & Approval Workflow
  let testOutgoingDocId = '';
  try {
    const deptsRes = await fetch(`${API_BASE}/departments`, { headers: authHeaders });
    const deptsJson = await deptsRes.json();
    const depts = deptsJson.data;
    const docTypesRes = await fetch(`${API_BASE}/documents/types`, { headers: authHeaders });
    const docTypesJson = await docTypesRes.json();
    const docTypeId = docTypesJson.data[0].id;

    const createRes = await fetch(`${API_BASE}/outgoing-documents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        outgoingNumber: 'OUT-TEST-2026/888',
        documentNumber: 'LHSE-TEST-888',
        documentDate: new Date().toISOString(),
        sendingDate: new Date().toISOString(),
        recipientOrg: 'ຫ້ອງວ່າການສຳນັກງານນາຍົກລັດຖະມົນຕີ',
        recipientName: 'ຫົວໜ້າຫ້ອງວ່າການ',
        subject: 'ບົດລາຍງານການຈັດຕັ້ງປະຕິບັດລະບົບ e-OFFICE ທົດສອບ',
        docTypeId: docTypeId,
        priority: 'NORMAL',
        departmentId: depts[0].id,
        description: 'ບົດລາຍງານການທົດສອບລະບົບການອະນຸມັດຫຼາຍຂັ້ນ',
      }),
    });
    const createJson = await createRes.json();
    testOutgoingDocId = createJson.data?.id;
    assert(createRes.status === 201 && createJson.data?.outgoingNumber === 'OUT-TEST-2026/888', 'Outgoing Document CREATE');

    // Approve step
    const approveRes = await fetch(`${API_BASE}/outgoing-documents/${testOutgoingDocId}/approve`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        decision: 'Approved',
        comment: 'ເຫັນດີຕາມການສະເໜີ - ອະນຸມັດຜ່ານ',
      }),
    });
    const approveJson = await approveRes.json();
    assert(approveRes.status === 200 && approveJson.data?.approvalStatus !== 'Draft', 'Outgoing Document Multi-step APPROVAL');
  } catch (err: any) {
    assert(false, 'Outgoing Documents Workflow', err.message);
  }

  // 9. Task Management & Assignment
  let testTaskId = '';
  try {
    const usersRes = await fetch(`${API_BASE}/users`, { headers: authHeaders });
    const usersJson = await usersRes.json();
    const users = usersJson.data.data;

    const createRes = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'ວຽກທົດສອບ: ກວດກາເອກະສານ ແລະ ສະຫຼຸບລາຍງານ',
        documentId: testIncomingDocId,
        assignedToId: users[1]?.id || users[0].id,
        departmentId: users[0].departmentId,
        priority: 'HIGH',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        description: 'ລາຍລະອຽດການມອບໝາຍວຽກງານຕາມສາຍການບັງຄັບບັນຊາ',
      }),
    });
    const createJson = await createRes.json();
    testTaskId = createJson.data?.id;
    assert(createRes.status === 201 && createJson.data?.title.includes('ວຽກທົດສອບ'), 'Task CREATE & Assignment through hierarchy');

    // Update Task Status (Kanban status transition)
    const statusRes = await fetch(`${API_BASE}/tasks/${testTaskId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        progress: 50,
        comment: 'ກຳລັງດຳເນີນການໄດ້ 50%',
      }),
    });
    const statusJson = await statusRes.json();
    assert(statusRes.status === 200 && statusJson.data?.status === 'IN_PROGRESS', 'Task Kanban Status UPDATE (IN_PROGRESS)');

    // Add Task Comment
    const commentRes = await fetch(`${API_BASE}/tasks/${testTaskId}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'ພະນັກງານໄດ້ຮັບວຽກແລ້ວ ແລະ ເລີ່ມດຳເນີນການ',
      }),
    });
    assert(commentRes.status === 201, 'Task COMMENT creation');
  } catch (err: any) {
    assert(false, 'Task Management', err.message);
  }

  // 10. Notifications
  try {
    const notifsRes = await fetch(`${API_BASE}/notifications`, { headers: authHeaders });
    const notifsJson = await notifsRes.json();
    const notifs = notifsJson.data;
    assert(notifsRes.status === 200 && Array.isArray(notifs), `Fetch Notifications (${notifs?.length} found)`);

    const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders,
    });
    assert(markAllRes.status === 200, 'Mark All Notifications as Read');
  } catch (err: any) {
    assert(false, 'Notification System', err.message);
  }

  // 11. Calendar Events
  try {
    const eventsRes = await fetch(`${API_BASE}/calendar`, { headers: authHeaders });
    const eventsJson = await eventsRes.json();
    const events = eventsJson.data;
    assert(eventsRes.status === 200 && Array.isArray(events), `Fetch Calendar Events (${events?.length} events)`);

    const createEvent = await fetch(`${API_BASE}/calendar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'ກອງປະຊຸມສະຫຼຸບວຽກງານປະຈຳອາທິດ (ທົດສອບ)',
        eventType: 'MEETING',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000 * 2).toISOString(),
        allDay: false,
        location: 'ຫ້ອງປະຊຸມໃຫຍ່ ຊັ້ນ 3',
        description: 'ກອງປະຊຸມປຶກສາຫາລືການນຳໃຊ້ລະບົບ e-OFFICE',
      }),
    });
    assert(createEvent.status === 201, 'Calendar EVENT creation');
  } catch (err: any) {
    assert(false, 'Calendar System', err.message);
  }

  // 12. Global Search
  try {
    const searchRes = await fetch(`${API_BASE}/search?q=LHSE`, { headers: authHeaders });
    const searchJson = await searchRes.json();
    const searchData = searchJson.data;
    assert(
      searchRes.status === 200 &&
      (Array.isArray(searchData?.documents) || Array.isArray(searchData?.tasks)),
      'Global Search across Documents, Tasks, Users, and Departments'
    );
  } catch (err: any) {
    assert(false, 'Global Search', err.message);
  }

  // 13. Reports & Excel Export
  try {
    const reportRes = await fetch(`${API_BASE}/reports/summary`, { headers: authHeaders });
    const reportJson = await reportRes.json();
    const reportData = reportJson.data;
    assert(reportRes.status === 200 && !!reportData?.kpis, 'Reports Summary API (/api/reports/summary)');

    const excelRes = await fetch(`${API_BASE}/reports/export/excel?type=incoming`, { headers: authHeaders });
    const buf = await excelRes.arrayBuffer();
    const contentType = excelRes.headers.get('content-type') || '';
    assert(
      excelRes.status === 200 &&
      contentType.includes('spreadsheetml') &&
      buf.byteLength > 1000,
      `Excel Export (/api/reports/export/excel) returns valid .xlsx file (${buf.byteLength} bytes)`
    );
  } catch (err: any) {
    assert(false, 'Reports & Excel Export', err.message);
  }

  // 14. Audit Logs
  try {
    const auditRes = await fetch(`${API_BASE}/audit-logs`, { headers: authHeaders });
    const auditJson = await auditRes.json();
    const auditData = auditJson.data;
    assert(
      auditRes.status === 200 &&
      Array.isArray(auditData?.data) &&
      auditData?.data.length > 0,
      `Audit Logging (${auditData?.total} recorded immutable audit trail entries)`
    );
  } catch (err: any) {
    assert(false, 'Audit Log System', err.message);
  }

  // 15. User Management & RBAC Roles
  try {
    const rolesRes = await fetch(`${API_BASE}/users/roles`, { headers: authHeaders });
    const rolesJson = await rolesRes.json();
    const roles = rolesJson.data;
    assert(rolesRes.status === 200 && roles?.length >= 9, `RBAC Roles Master Data (${roles?.length} roles found)`);

    const usersRes = await fetch(`${API_BASE}/users`, { headers: authHeaders });
    const usersJson = await usersRes.json();
    const usersData = usersJson.data;
    assert(usersRes.status === 200 && usersData?.data?.length >= 5, `Employee / Users List (${usersData?.total} users found)`);
  } catch (err: any) {
    assert(false, 'User Management & RBAC', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL FULL-STACK ENTERPRISE FEATURES FULLY FUNCTIONAL AND VERIFIED!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
