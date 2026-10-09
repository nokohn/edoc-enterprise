import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting e-OFFICE database seeding...');

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany({});
  await prisma.calendarEvent.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.workflowHistory.deleteMany({});
  await prisma.workflowStep.deleteMany({});
  await prisma.taskHistory.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.documentHistory.deleteMany({});
  await prisma.documentComment.deleteMany({});
  await prisma.documentAttachment.deleteMany({});
  await prisma.incomingDocument.deleteMany({});
  await prisma.outgoingDocument.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.documentType.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  // 1. Roles
  const rolesData = [
    { name: 'Super Admin', nameLao: 'ຜູ້ດູແລລະບົບສູງສຸດ', description: 'ຄວບຄຸມລະບົບ ແລະ ຈັດການສິດທັງໝົດ', isSystem: true },
    { name: 'Admin', nameLao: 'ຜູ້ບໍລິຫານລະບົບ', description: 'ຈັດການຂໍ້ມູນພື້ນຖານ ແລະ ຜູ້ໃຊ້ງານ', isSystem: true },
    { name: 'Director', nameLao: 'ຜູ້ອຳນວຍການ', description: 'ພິຈາລະນາ, ອະນຸມັດ ແລະ ສັ່ງການເອກະສານລະດັບສູງ' },
    { name: 'Deputy Director', nameLao: 'ຮອງຜູ້ອຳນວຍການ', description: 'ກັ່ນຕອງ ແລະ ຊີ້ນຳວຽກງານຕາມການມອບໝາຍ' },
    { name: 'Department Head', nameLao: 'ຫົວໜ້າພະແນກ', description: 'ຄຸ້ມຄອງວຽກງານ ແລະ ມອບໝາຍວຽກພາຍໃນພະແນກ' },
    { name: 'Deputy Department Head', nameLao: 'ຮອງຫົວໜ້າພະແນກ', description: 'ຊ່ວຍວຽກຫົວໜ້າພະແນກ ແລະ ກວດກາວຽກ' },
    { name: 'Unit Head', nameLao: 'ຫົວໜ້າໜ່ວຍງານ', description: 'ຕິດຕາມ ແລະ ຊີ້ນຳພະນັກງານປະຕິບັດວຽກຕົວຈິງ' },
    { name: 'Officer / Staff', nameLao: 'ພະນັກງານວິຊາການ', description: 'ຮັບຜິດຊອບປະຕິບັດວຽກ ແລະ ສ້າງຮ່າງເອກະສານ' },
    { name: 'Viewer', nameLao: 'ຜູ້ເບິ່ງຂໍ້ມູນ', description: 'ສຳລັບຕິດຕາມ ແລະ ເບິ່ງເອກະສານເທົ່ານັ້ນ' },
  ];

  const rolesMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    rolesMap.set(r.name, role.id);
  }

  // 2. Permissions (21 permissions)
  const permissionsData = [
    { code: 'DASHBOARD_VIEW', name: 'Dashboard View', nameLao: 'ເບິ່ງໜ້າຫຼັກ (Dashboard)', module: 'DASHBOARD' },
    { code: 'USER_VIEW', name: 'User View', nameLao: 'ເບິ່ງລາຍຊື່ຜູ້ໃຊ້', module: 'USER' },
    { code: 'USER_CREATE', name: 'User Create', nameLao: 'ເພີ່ມຜູ້ໃຊ້ໃໝ່', module: 'USER' },
    { code: 'USER_EDIT', name: 'User Edit', nameLao: 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້', module: 'USER' },
    { code: 'USER_DELETE', name: 'User Delete', nameLao: 'ລຶບຜູ້ໃຊ້', module: 'USER' },
    { code: 'DEPARTMENT_MANAGE', name: 'Department Management', nameLao: 'ຄຸ້ມຄອງພະແນກ / ໜ່ວຍງານ', module: 'DEPARTMENT' },
    { code: 'DOC_INCOMING', name: 'Incoming Document', nameLao: 'ຈັດການເອກະສານຂາເຂົ້າ', module: 'DOCUMENT' },
    { code: 'DOC_OUTGOING', name: 'Outgoing Document', nameLao: 'ຈັດການເອກະສານຂາອອກ', module: 'DOCUMENT' },
    { code: 'DOC_VIEW', name: 'Document View', nameLao: 'ເບິ່ງເອກະສານ', module: 'DOCUMENT' },
    { code: 'DOC_CREATE', name: 'Document Create', nameLao: 'ສ້າງເອກະສານ', module: 'DOCUMENT' },
    { code: 'DOC_EDIT', name: 'Document Edit', nameLao: 'ແກ້ໄຂເອກະສານ', module: 'DOCUMENT' },
    { code: 'DOC_DELETE', name: 'Document Delete', nameLao: 'ລຶບເອກະສານ', module: 'DOCUMENT' },
    { code: 'DOC_APPROVE', name: 'Document Approve', nameLao: 'ອະນຸມັດເອກະສານ', module: 'DOCUMENT' },
    { code: 'DOC_ASSIGN', name: 'Document Assign', nameLao: 'ມອບໝາຍເອກະສານ', module: 'DOCUMENT' },
    { code: 'TASK_MANAGE', name: 'Task Management', nameLao: 'ຄຸ້ມຄອງວຽກງານ', module: 'TASK' },
    { code: 'TASK_APPROVE', name: 'Task Approve', nameLao: 'ອະນຸມັດວຽກງານ', module: 'TASK' },
    { code: 'TASK_COMPLETE', name: 'Task Complete', nameLao: 'ຢືນຢັນສຳເລັດວຽກ', module: 'TASK' },
    { code: 'CALENDAR_VIEW', name: 'Calendar View', nameLao: 'ນຳໃຊ້ປະຕິທິນວຽກງານ', module: 'CALENDAR' },
    { code: 'REPORTS_VIEW', name: 'Reports View', nameLao: 'ເບິ່ງ ແລະ ສົ່ງອອກລາຍງານ', module: 'REPORT' },
    { code: 'NOTIFICATIONS_VIEW', name: 'Notifications', nameLao: 'ຮັບການແຈ້ງເຕືອນ', module: 'NOTIFICATION' },
    { code: 'AUDIT_LOGS_VIEW', name: 'Audit Logs', nameLao: 'ເບິ່ງປະຫວັດການເຄື່ອນໄຫວ (Audit Log)', module: 'AUDIT' },
    { code: 'SETTINGS_MANAGE', name: 'System Settings', nameLao: 'ຕັ້ງຄ່າລະບົບ', module: 'SETTING' },
  ];

  const permIds: string[] = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.create({ data: p });
    permIds.push(perm.id);
  }

  // Assign ALL permissions to Super Admin & Admin
  for (const pId of permIds) {
    await prisma.rolePermission.create({
      data: { roleId: rolesMap.get('Super Admin')!, permissionId: pId }
    });
    await prisma.rolePermission.create({
      data: { roleId: rolesMap.get('Admin')!, permissionId: pId }
    });
  }

  // Assign standard workflow permissions to Director, Dept Head, etc.
  const directorPerms = ['DASHBOARD_VIEW', 'DOC_INCOMING', 'DOC_OUTGOING', 'DOC_VIEW', 'DOC_APPROVE', 'DOC_ASSIGN', 'TASK_MANAGE', 'TASK_APPROVE', 'TASK_COMPLETE', 'CALENDAR_VIEW', 'REPORTS_VIEW', 'NOTIFICATIONS_VIEW', 'AUDIT_LOGS_VIEW'];
  for (const code of directorPerms) {
    const p = await prisma.permission.findUnique({ where: { code } });
    if (p) {
      await prisma.rolePermission.create({ data: { roleId: rolesMap.get('Director')!, permissionId: p.id } });
      await prisma.rolePermission.create({ data: { roleId: rolesMap.get('Deputy Director')!, permissionId: p.id } });
    }
  }

  // 3. Departments
  const deptsData = [
    { code: 'DEP-ACC', name: 'Accounting and Finance', nameLao: 'ບໍລິຫານບັນຊີ-ການເງິນ', description: 'ຮັບຜິດຊອບວຽກງານການເງິນ, ງົບປະມານ ແລະ ການບັນຊີ' },
    { code: 'DEP-PLAN', name: 'Business Planning', nameLao: 'ທຸລະກິດແຜນການ', description: 'ວາງແຜນຍຸດທະສາດທຸລະກິດ, ການລົງທຶນ ແລະ ຕິດຕາມໂຄງການ' },
    { code: 'DEP-ASH', name: 'Fly Ash Business', nameLao: 'ທຸລະກິດຂີ້ເທົ່າລອຍ', description: 'ຄຸ້ມຄອງການຜະລິດ, ຂົນສົ່ງ ແລະ ຈຳໜ່າຍຂີ້ເທົ່າລອຍ' },
    { code: 'DEP-DEV', name: 'Development and HR', nameLao: 'ພັດທະນາ', description: 'ພັດທະນາບຸກຄະລາກອນ, ວຽກງານບໍລິຫານ ແລະ ເຕັກໂນໂລຊີ' },
    { code: 'DEP-AUDIT', name: 'Internal Audit', nameLao: 'ຫ້ອງການກວດສອບພາຍໃນ', description: 'ກວດກາ, ປະເມີນຜົນ ແລະ ຄວບຄຸມພາຍໃນອົງກອນ' },
  ];

  const deptsMap = new Map<string, string>();
  for (const d of deptsData) {
    const dept = await prisma.department.create({ data: d });
    deptsMap.set(d.code, dept.id);
  }

  // 4. Positions
  const positionsData = [
    { code: 'POS-MD', name: 'Managing Director', nameLao: 'ຜູ້ອຳນວຍການໃຫຍ່', level: 10 },
    { code: 'POS-DMD', name: 'Deputy Managing Director', nameLao: 'ຮອງຜູ້ອຳນວຍການໃຫຍ່', level: 9 },
    { code: 'POS-DH', name: 'Department Head', nameLao: 'ຫົວໜ້າພະແນກ', level: 8 },
    { code: 'POS-DDH', name: 'Deputy Department Head', nameLao: 'ຮອງຫົວໜ້າພະແນກ', level: 7 },
    { code: 'POS-UH', name: 'Unit Head', nameLao: 'ຫົວໜ້າໜ່ວຍງານ', level: 6 },
    { code: 'POS-SO', name: 'Senior Officer', nameLao: 'ພະນັກງານວິຊາການອາວຸໂສ', level: 5 },
    { code: 'POS-OFF', name: 'Officer', nameLao: 'ພະນັກງານວິຊາການ', level: 4 },
  ];

  const posMap = new Map<string, string>();
  for (const pos of positionsData) {
    const p = await prisma.position.create({ data: pos });
    posMap.set(pos.code, p.id);
  }

  // 5. Document Types
  const docTypesData = [
    { code: 'OFFICIAL_LETTER', name: 'Official Letter', nameLao: 'ໜັງສືທາງການ', prefix: 'ສນຍ' },
    { code: 'NOTICE', name: 'Notice', nameLao: 'ແຈ້ງການ', prefix: 'ຈກ' },
    { code: 'REPORT', name: 'Report', nameLao: 'ບົດລາຍງານ', prefix: 'ລງ' },
    { code: 'REQUEST', name: 'Request Letter', nameLao: 'ໃບສະເໜີ', prefix: 'ບສ' },
    { code: 'INVITATION', name: 'Invitation', nameLao: 'ໜັງສືເຊີນ', prefix: 'ສຊ' },
    { code: 'CONTRACT', name: 'Contract / Agreement', nameLao: 'ສັນຍາ', prefix: 'ສຍ' },
    { code: 'OTHER', name: 'Other', nameLao: 'ເອກະສານອື່ນໆ', prefix: 'ອກ' },
  ];

  const typesMap = new Map<string, string>();
  for (const dt of docTypesData) {
    const t = await prisma.documentType.create({ data: dt });
    typesMap.set(dt.code, t.id);
  }

  // 6. Employees & Users
  // Password hash for admin123456
  const passwordHash = await bcrypt.hash('admin123456', 10);

  const employeesSeed = [
    {
      code: 'EMP-001',
      username: 'admin',
      firstName: 'ໂນກອນ',
      lastName: 'ພອນວິໄລ',
      fullNameLao: 'ໂນກອນ ພອນວິໄລ',
      fullNameEn: 'Mr. Nokone PHONEVILAY',
      phone: '020 23232166',
      email: 'nokone@laoholding.com',
      role: 'Super Admin',
      dept: 'DEP-DEV',
      pos: 'POS-DH',
    },
    {
      code: 'EMP-002',
      username: 'director',
      firstName: 'ບຸນມີ',
      lastName: 'ວົງສະຫວັນ',
      fullNameLao: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ',
      fullNameEn: 'Mr. Bounmy Vongsavanh',
      phone: '020 55112233',
      email: 'director@eoffice.la',
      role: 'Director',
      dept: 'DEP-DEV',
      pos: 'POS-MD',
    },
    {
      code: 'EMP-003',
      username: 'deputy',
      firstName: 'ຄຳແພງ',
      lastName: 'ໄຊຍະວົງ',
      fullNameLao: 'ທ່ານ ຄຳແພງ ໄຊຍະວົງ',
      fullNameEn: 'Mr. Khampheng Xayyavong',
      phone: '020 55223344',
      email: 'deputy@eoffice.la',
      role: 'Deputy Director',
      dept: 'DEP-DEV',
      pos: 'POS-DMD',
    },
    {
      code: 'EMP-004',
      username: 'head_acc',
      firstName: 'ວິໄລພອນ',
      lastName: 'ແກ້ວມະນີ',
      fullNameLao: 'ທ່ານ ນາງ ວິໄລພອນ ແກ້ວມະນີ',
      fullNameEn: 'Ms. Vilaiphone Keomany',
      phone: '020 55334455',
      email: 'acc.head@eoffice.la',
      role: 'Department Head',
      dept: 'DEP-ACC',
      pos: 'POS-DH',
    },
    {
      code: 'EMP-005',
      username: 'head_plan',
      firstName: 'ສຸກສະຫວັນ',
      lastName: 'ດວງດາລາ',
      fullNameLao: 'ທ່ານ ສຸກສະຫວັນ ດວງດາລາ',
      fullNameEn: 'Mr. Souksavanh Douangdala',
      phone: '020 55445566',
      email: 'plan.head@eoffice.la',
      role: 'Department Head',
      dept: 'DEP-PLAN',
      pos: 'POS-DH',
    },
    {
      code: 'EMP-006',
      username: 'head_ash',
      firstName: 'ພອນໄຊ',
      lastName: 'ອິນທະວົງ',
      fullNameLao: 'ທ່ານ ພອນໄຊ ອິນທະວົງ',
      fullNameEn: 'Mr. Phonechai Inthavong',
      phone: '020 55778899',
      email: 'ash.head@eoffice.la',
      role: 'Department Head',
      dept: 'DEP-ASH',
      pos: 'POS-DH',
    },
    {
      code: 'EMP-007',
      username: 'head_audit',
      firstName: 'ສົມພອນ',
      lastName: 'ແກ້ວອຸດົມ',
      fullNameLao: 'ທ່ານ ສົມພອນ ແກ້ວອຸດົມ',
      fullNameEn: 'Mr. Somphone Keooudome',
      phone: '020 55889900',
      email: 'audit.head@eoffice.la',
      role: 'Department Head',
      dept: 'DEP-AUDIT',
      pos: 'POS-DH',
    },
    {
      code: 'EMP-008',
      username: 'officer_acc',
      firstName: 'ສຸລິຍາ',
      lastName: 'ມະນີວົງ',
      fullNameLao: 'ທ່ານ ສຸລິຍາ ມະນີວົງ',
      fullNameEn: 'Mr. Souliya Manivong',
      phone: '020 77112233',
      email: 'souliya@eoffice.la',
      role: 'Officer / Staff',
      dept: 'DEP-ACC',
      pos: 'POS-OFF',
    },
    {
      code: 'EMP-009',
      username: 'officer_plan',
      firstName: 'ຈັນທາ',
      lastName: 'ພົມມະຈັນ',
      fullNameLao: 'ທ່ານ ນາງ ຈັນທາ ພົມມະຈັນ',
      fullNameEn: 'Ms. Chantha Phommachanh',
      phone: '020 77223344',
      email: 'chantha@eoffice.la',
      role: 'Officer / Staff',
      dept: 'DEP-PLAN',
      pos: 'POS-OFF',
    },
  ];

  const userMap = new Map<string, string>();

  for (const e of employeesSeed) {
    const roleId = rolesMap.get(e.role)!;
    const deptId = deptsMap.get(e.dept)!;
    const posId = posMap.get(e.pos)!;

    const emp = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        firstName: e.firstName,
        lastName: e.lastName,
        fullNameLao: e.fullNameLao,
        fullNameEn: e.fullNameEn,
        phone: e.phone,
        email: e.email,
        departmentId: deptId,
        positionId: posId,
        roleId: roleId,
        status: 'ACTIVE',
      }
    });

    const usr = await prisma.user.create({
      data: {
        username: e.username,
        passwordHash: passwordHash,
        email: e.email,
        phone: e.phone,
        roleId: roleId,
        departmentId: deptId,
        positionId: posId,
        employeeId: emp.id,
        isActive: true,
      }
    });

    userMap.set(e.username, usr.id);

    // Set department head if applicable
    if (e.pos === 'POS-DH') {
      await prisma.department.update({
        where: { id: deptId },
        data: { headId: usr.id }
      });
    }
  }

  // 7. Workflow Steps Definitions
  const wfSteps = [
    { workflowType: 'APPROVAL', title: 'ພະນັກງານສ້າງຮ່າງ', stepOrder: 1, approverRoleId: rolesMap.get('Officer / Staff') },
    { workflowType: 'APPROVAL', title: 'ຫົວໜ້າໜ່ວຍງານກວດກາ', stepOrder: 2, approverRoleId: rolesMap.get('Unit Head') },
    { workflowType: 'APPROVAL', title: 'ຫົວໜ້າພະແນກກວດກາ & ເຫັນດີ', stepOrder: 3, approverRoleId: rolesMap.get('Department Head') },
    { workflowType: 'APPROVAL', title: 'ຮອງຜູ້ອຳນວຍການກັ່ນຕອງ', stepOrder: 4, approverRoleId: rolesMap.get('Deputy Director') },
    { workflowType: 'APPROVAL', title: 'ຜູ້ອຳນວຍການອະນຸມັດ ແລະ ລົງນາມ', stepOrder: 5, approverRoleId: rolesMap.get('Director') },
  ];
  for (const s of wfSteps) {
    await prisma.workflowStep.create({ data: s });
  }

  // 8. Sample Incoming Documents
  const incomingDocsData = [
    {
      incomingNumber: 'ຂຂ-2026/0142',
      originalDocNumber: '108/ສນຍ.ກບ',
      docDate: new Date('2026-09-28'),
      senderOrg: 'ຫ້ອງວ່າການສຳນັກງານນາຍົກລັດຖະມົນຕີ',
      senderName: 'ທ່ານ ສອນໄຊ ສີພັນດອນ',
      subject: 'ແຈ້ງການ ຊີ້ນຳກ່ຽວກັບການປະຕິບັດມາດຕະການປະຢັດງົບປະມານແຫ່ງລັດ ປະຈຳໄຕມາດ 4/2026',
      typeCode: 'NOTICE',
      priority: 'URGENT',
      confidentialLevel: 'NORMAL',
      deptCode: 'DEP-ACC',
      responsibleUser: 'head_acc',
      status: 'ASSIGNED',
      dueDate: new Date('2026-10-15'),
      description: 'ໃຫ້ພະແນກບໍລິຫານບັນຊີ-ການເງິນ ຄົ້ນຄວ້າ ແລະ ສັງລວມແຜນລາຍຈ່າຍຕົວຈິງ ເພື່ອລາຍງານຄະນະຜູ້ອຳນວຍການ.',
    },
    {
      incomingNumber: 'ຂຂ-2026/0143',
      originalDocNumber: '425/ພບ.ກຂ',
      docDate: new Date('2026-09-30'),
      senderOrg: 'ກະຊວງພະລັງງານ ແລະ ບໍ່ແຮ່',
      senderName: 'ທ່ານ ໂພໄຊ ໄຊຍະສອນ',
      subject: 'ໜັງສືເຊີນ ເຂົ້າຮ່ວມກອງປະຊຸມປຶກສາຫາລືການພັດທະນາໂຄງການພະລັງງານສະອາດ ແລະ ທຸລະກິດຂີ້ເທົ່າລອຍ',
      typeCode: 'INVITATION',
      priority: 'HIGH',
      confidentialLevel: 'NORMAL',
      deptCode: 'DEP-ASH',
      responsibleUser: 'head_ash',
      status: 'IN_PROGRESS',
      dueDate: new Date('2026-10-10'),
      description: 'ເຊີນຄະນະຜູ້ອຳນວຍການ ແລະ ຫົວໜ້າພະແນກຂີ້ເທົ່າລອຍ ເຂົ້າຮ່ວມວັນທີ 10/10/2026 ທີ່ຫ້ອງປະຊຸມໃຫຍ່ກະຊວງ.',
    },
    {
      incomingNumber: 'ຂຂ-2026/0144',
      originalDocNumber: '89/ລຟລ.ຝຜ',
      docDate: new Date('2026-10-01'),
      senderOrg: 'ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
      senderName: 'ທ່ານ ວັນແສງ ດວງມະນີ',
      subject: 'ໃບສະເໜີ ຂໍຊື້ຜະລິດຕະພັນຂີ້ເທົ່າລອຍຄຸນນະພາບສູງ ສຳລັບໂຄງການເຂື່ອນໄຟຟ້ານ້ຳງື່ມ 3',
      typeCode: 'REQUEST',
      priority: 'NORMAL',
      confidentialLevel: 'NORMAL',
      deptCode: 'DEP-ASH',
      responsibleUser: 'head_ash',
      status: 'REVIEWING',
      dueDate: new Date('2026-10-20'),
      description: 'ປະລິມານຄວາມຕ້ອງການ 5,000 ໂຕນ/ເດືອນ. ຂໍໃຫ້ພະແນກທຸລະກິດຂີ້ເທົ່າລອຍກວດກາຄວາມສາມາດສະໜອງ.',
    },
    {
      incomingNumber: 'ຂຂ-2026/0145',
      originalDocNumber: '12/ກສພ.2026',
      docDate: new Date('2026-10-01'),
      senderOrg: 'ອົງການກວດສອບແຫ່ງລັດ',
      senderName: 'ທ່ານ ວຽງທອງ ສີພັນດອນ',
      subject: 'ແຈ້ງການ ການລົງກວດກາການຄຸ້ມຄອງ ແລະ ນຳໃຊ້ຊັບສິນປະຈຳປີ 2026',
      typeCode: 'OFFICIAL_LETTER',
      priority: 'HIGH',
      confidentialLevel: 'CONFIDENTIAL',
      deptCode: 'DEP-AUDIT',
      responsibleUser: 'head_audit',
      status: 'NEW',
      dueDate: new Date('2026-10-25'),
      description: 'ແຈ້ງໃຫ້ກະກຽມເອກະສານບັນຊີ, ໃບຢັ້ງຢືນການຈ່າຍ, ສັນຍາການຄ້າ ແລະ ບັນຊີລາຍຊັບສິນຄົງທີ່.',
    },
    {
      incomingNumber: 'ຂຂ-2026/0146',
      originalDocNumber: '331/ກສ.ແຜນ',
      docDate: new Date('2026-10-02'),
      senderOrg: 'ກະຊວງການເງິນ',
      senderName: 'ທ່ານ ບຸນໂຈມ ອຸບົນປະເສີດ',
      subject: 'ບົດແນະນຳ ກ່ຽວກັບການຫັນເປັນດິຈິຕອນ ແລະ ນຳໃຊ້ລະບົບ e-Office ພາຍໃນລັດວິສາຫະກິດ',
      typeCode: 'REPORT',
      priority: 'URGENT',
      confidentialLevel: 'NORMAL',
      deptCode: 'DEP-DEV',
      responsibleUser: 'admin',
      status: 'COMPLETED',
      dueDate: new Date('2026-10-30'),
      description: 'ຊຸກຍູ້ໃຫ້ຫັນການຄຸ້ມຄອງເອກະສານສູ່ລະບົບໄອທີ 100% ພາຍໃນທ້າຍປີ 2026.',
    }
  ];

  for (const doc of incomingDocsData) {
    const parentDoc = await prisma.document.create({
      data: {
        documentNumber: doc.incomingNumber,
        title: doc.subject,
        typeId: typesMap.get(doc.typeCode)!,
        departmentId: deptsMap.get(doc.deptCode)!,
        creatorId: userMap.get('admin'),
        responsibleId: userMap.get(doc.responsibleUser),
        priority: doc.priority,
        confidentiality: doc.confidentialLevel,
        status: doc.status,
        flowType: 'INCOMING',
        description: doc.description,
      }
    });

    await prisma.incomingDocument.create({
      data: {
        documentId: parentDoc.id,
        incomingNumber: doc.incomingNumber,
        originalDocNumber: doc.originalDocNumber,
        docDate: doc.docDate,
        receivedDate: new Date(),
        receivedTime: '08:30',
        senderOrg: doc.senderOrg,
        senderName: doc.senderName,
        subject: doc.subject,
        typeId: typesMap.get(doc.typeCode)!,
        priority: doc.priority,
        confidentialLevel: doc.confidentialLevel,
        departmentId: deptsMap.get(doc.deptCode)!,
        responsibleId: userMap.get(doc.responsibleUser),
        description: doc.description,
        status: doc.status,
        dueDate: doc.dueDate,
        notes: 'ເອກະສານສຳຄັນ ໃຫ້ຕິດຕາມຕາມກຳນົດເວລາ',
      }
    });

    // Sample Attachment
    await prisma.documentAttachment.create({
      data: {
        documentId: parentDoc.id,
        fileName: `doc-${doc.incomingNumber.replace(/[\/\-]/g, '_')}.pdf`,
        originalName: `${doc.subject.substring(0, 30)}.pdf`,
        fileSize: 1024 * 350, // 350KB
        fileType: 'application/pdf',
        fileUrl: '/uploads/sample_official_document.pdf',
        uploadedById: userMap.get('admin'),
      }
    });

    // Sample Document History
    await prisma.documentHistory.create({
      data: {
        documentId: parentDoc.id,
        userId: userMap.get('admin'),
        userName: 'ໂນກອນ ພອນວິໄລ',
        action: 'ລົງທະບຽນເອກະສານຂາເຂົ້າ',
        statusBefore: null,
        statusAfter: 'REGISTERED',
        comment: 'ລົງທະບຽນເຂົ້າລະບົບຮຽບຮ້ອຍ',
      }
    });

    // Sample Workflow History (Visual timeline)
    await prisma.workflowHistory.create({
      data: {
        documentId: parentDoc.id,
        stepOrder: 1,
        action: 'ຮັບ ແລະ ລົງທະບຽນເອກະສານ',
        actorId: userMap.get('admin'),
        actorName: 'ໂນກອນ ພອນວິໄລ',
        actorPosition: 'ຫົວໜ້າພະແນກ (Admin)',
        actorDepartment: 'ພັດທະນາ',
        comment: 'ກວດສອບເລກທີ ແລະ ຄວາມຄົບຖ້ວນຂອງເອກະສານຮຽບຮ້ອຍ',
        decision: 'FORWARD',
      }
    });

    await prisma.workflowHistory.create({
      data: {
        documentId: parentDoc.id,
        stepOrder: 2,
        action: 'ຊີ້ນຳ ແລະ ມອບໝາຍວຽກ',
        actorId: userMap.get('director'),
        actorName: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ',
        actorPosition: 'ຜູ້ອຳນວຍການໃຫຍ່',
        actorDepartment: 'ຄະນະຜູ້ອຳນວຍການ',
        comment: 'ມອບໃຫ້ພະແນກກ່ຽວຂ້ອງດຳເນີນການດ່ວນ ແລະ ລາຍງານຜົນ',
        decision: 'APPROVE',
      }
    });
  }

  // 9. Sample Outgoing Documents
  const outgoingDocsData = [
    {
      outgoingNumber: 'ຂອ-2026/0088',
      docNumber: '55/ລຮສ.2026',
      recipientOrg: 'ຫ້ອງວ່າການສຳນັກງານນາຍົກລັດຖະມົນຕີ',
      recipientName: 'ຫົວໜ້າຫ້ອງວ່າການ',
      subject: 'ບົດລາຍງານ ຄວາມຄືບໜ້າການຈັດຕັ້ງປະຕິບັດແຜນທຸລະກິດ ປະຈຳໄຕມາດ 3/2026',
      typeCode: 'REPORT',
      priority: 'HIGH',
      deptCode: 'DEP-PLAN',
      responsibleUser: 'head_plan',
      approvalStatus: 'APPROVED',
      description: 'ລາຍງານຜົນການດຳເນີນທຸລະກິດ, ລາຍຮັບ-ລາຍຈ່າຍ ແລະ ທິດທາງແຜນການໄຕມາດ 4.',
    },
    {
      outgoingNumber: 'ຂອ-2026/0089',
      docNumber: '56/ລຮສ.2026',
      recipientOrg: 'ລັດວິສາຫະກິດໄຟຟ້າລາວ',
      recipientName: 'ຜູ້ອຳນວຍການໃຫຍ່ EDL',
      subject: 'ໜັງສືສະເໜີ ລາຄາ ແລະ ເງື່ອນໄຂການສະໜອງຂີ້ເທົ່າລອຍ ໂຄງການເຂື່ອນໄຟຟ້ານ້ຳງື່ມ 3',
      typeCode: 'OFFICIAL_LETTER',
      priority: 'URGENT',
      deptCode: 'DEP-ASH',
      responsibleUser: 'head_ash',
      approvalStatus: 'DIRECTOR_APPROVAL',
      description: 'ສະເໜີລາຄາຂາຍສົ່ງພິເສດ ແລະ ຕາຕະລາງການຂົນສົ່ງປະຈຳເດືອນ.',
    },
    {
      outgoingNumber: 'ຂອ-2026/0090',
      docNumber: '57/ລຮສ.2026',
      recipientOrg: 'ກະຊວງການເງິນ',
      recipientName: 'ຫົວໜ້າກົມຄຸ້ມຄອງວິສາຫະກິດລັດ',
      subject: 'ບົດສະເໜີ ຂໍອະນຸມັດແຜນງົບປະມານຈັດຊື້ອຸປະກອນໄອທີ ແລະ ລະບົບ e-Office',
      typeCode: 'REQUEST',
      priority: 'NORMAL',
      deptCode: 'DEP-DEV',
      responsibleUser: 'admin',
      approvalStatus: 'DEPT_APPROVAL',
      description: 'ຂໍອະນຸມັດງົບປະມານປັບປຸງພື້ນຖານໂຄງລ່າງເຕັກໂນໂລຊີ ແລະ ລະບົບຫ້ອງການດິຈິຕອນ.',
    }
  ];

  for (const doc of outgoingDocsData) {
    const parentDoc = await prisma.document.create({
      data: {
        documentNumber: doc.outgoingNumber,
        title: doc.subject,
        typeId: typesMap.get(doc.typeCode)!,
        departmentId: deptsMap.get(doc.deptCode)!,
        creatorId: userMap.get(doc.responsibleUser),
        responsibleId: userMap.get(doc.responsibleUser),
        priority: doc.priority,
        confidentiality: 'NORMAL',
        status: doc.approvalStatus,
        flowType: 'OUTGOING',
        description: doc.description,
      }
    });

    await prisma.outgoingDocument.create({
      data: {
        documentId: parentDoc.id,
        outgoingNumber: doc.outgoingNumber,
        docNumber: doc.docNumber,
        docDate: new Date(),
        recipientOrg: doc.recipientOrg,
        recipientName: doc.recipientName,
        subject: doc.subject,
        typeId: typesMap.get(doc.typeCode)!,
        priority: doc.priority,
        departmentId: deptsMap.get(doc.deptCode)!,
        responsibleId: userMap.get(doc.responsibleUser),
        description: doc.description,
        approvalStatus: doc.approvalStatus,
        notes: 'ຮ່າງເອກະສານກຳລັງດຳເນີນການຕາມຂັ້ນຕອນການອະນຸມັດ',
      }
    });
  }

  // 10. Sample Tasks (Organized by hierarchy: Director -> Dept Head -> Officer)
  const tasksSeed = [
    {
      taskCode: 'TSK-2026-001',
      title: 'ຄົ້ນຄວ້າ ແລະ ສັງລວມມາດຕະການປະຢັດງົບປະມານໄຕມາດ 4/2026',
      assignedBy: 'director',
      assignedTo: 'head_acc',
      dept: 'DEP-ACC',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      progress: 60,
      description: 'ອີງຕາມແຈ້ງການ ສນຍ ເລກທີ 108/ສນຍ.ກບ, ໃຫ້ພະແນກບັນຊີ-ການເງິນ ສະຫຼຸບຕົວເລກການໃຊ້ຈ່າຍ ແລະ ສະເໜີມາດຕະການປະຢັດ 10% ຂອງລາຍຈ່າຍບໍລິຫານ.',
      dueDate: new Date('2026-10-15'),
    },
    {
      taskCode: 'TSK-2026-002',
      title: 'ສ້າງແຜນສະໜອງຂີ້ເທົ່າລອຍໃຫ້ EDL ໂຄງການນ້ຳງື່ມ 3',
      assignedBy: 'head_ash',
      assignedTo: 'officer_plan',
      dept: 'DEP-ASH',
      priority: 'HIGH',
      status: 'ASSIGNED',
      progress: 25,
      description: 'ສັງລວມກຳລັງການຜະລິດ, ຄ່າຂົນສົ່ງ, ແລະ ຮ່າງສັນຍາຊື້-ຂາຍຂີ້ເທົ່າລອຍ.',
      dueDate: new Date('2026-10-12'),
    },
    {
      taskCode: 'TSK-2026-003',
      title: 'ກວດກາເອກະສານລາຍຈ່າຍ ແລະ ຊັບສິນຄົງທີ່ ເພື່ອກະກຽມຮັບການກວດສອບ',
      assignedBy: 'head_audit',
      assignedTo: 'officer_acc',
      dept: 'DEP-AUDIT',
      priority: 'HIGH',
      status: 'REVIEWING',
      progress: 85,
      description: 'ກວດກາຄວາມຖືກຕ້ອງຂອງບັດລົງບັນຊີ ແລະ ໃບຢັ້ງຢືນການຈ່າຍທັງໝົດໃນປີ 2026.',
      dueDate: new Date('2026-10-20'),
    },
    {
      taskCode: 'TSK-2026-004',
      title: 'ຈັດຝຶກອົບຮົມການນຳໃຊ້ລະບົບ e-OFFICE ໃຫ້ທຸກພະແນກ',
      assignedBy: 'director',
      assignedTo: 'admin',
      dept: 'DEP-DEV',
      priority: 'NORMAL',
      status: 'COMPLETED',
      progress: 100,
      description: 'ສຳເລັດການຝຶກອົບຮົມໃຫ້ພະນັກງານທັງໝົດ 5 ພະແນກ ຮຽບຮ້ອຍແລ້ວ.',
      dueDate: new Date('2026-10-02'),
      completionDate: new Date('2026-10-02'),
    },
    {
      taskCode: 'TSK-2026-005',
      title: 'ສັງລວມບົດລາຍງານປະຈຳປີ 2026 ຂອງພະແນກທຸລະກິດແຜນການ',
      assignedBy: 'head_plan',
      assignedTo: 'officer_plan',
      dept: 'DEP-PLAN',
      priority: 'NORMAL',
      status: 'NEW',
      progress: 0,
      description: 'ຮ່າງບົດລາຍງານການຈັດຕັ້ງປະຕິບັດແຜນການ 9 ເດືອນ ແລະ ຄາດຄະເນ 3 ເດືອນທ້າຍປີ.',
      dueDate: new Date('2026-10-28'),
    }
  ];

  for (const t of tasksSeed) {
    const task = await prisma.task.create({
      data: {
        taskCode: t.taskCode,
        title: t.title,
        assignedById: userMap.get(t.assignedBy)!,
        assignedToId: userMap.get(t.assignedTo)!,
        departmentId: deptsMap.get(t.dept)!,
        priority: t.priority,
        status: t.status,
        progress: t.progress,
        description: t.description,
        startDate: new Date(),
        dueDate: t.dueDate,
        completionDate: t.completionDate || null,
      }
    });

    // Task Assignment step
    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        fromUserId: userMap.get(t.assignedBy)!,
        toUserId: userMap.get(t.assignedTo)!,
        stepOrder: 1,
        status: t.status === 'COMPLETED' ? 'COMPLETED' : 'ACCEPTED',
        comment: 'ມອບໝາຍໃຫ້ດຳເນີນການຕາມແຜນການ',
      }
    });

    // Task Comment
    await prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: userMap.get(t.assignedTo)!,
        content: `ໄດ້ຮັບວຽກແລ້ວ ກຳລັງເລັ່ງດຳເນີນການ ຄວາມຄືບໜ້າປະຈຸບັນ ${t.progress}%`,
      }
    });
  }

  // 11. Sample Notifications
  const notificationsSeed = [
    {
      userId: userMap.get('admin')!,
      title: 'ເອກະສານຂາເຂົ້າໃໝ່',
      message: 'ມີເອກະສານຂາເຂົ້າເລກທີ ຂຂ-2026/0146 ຈາກ ກະຊວງການເງິນ',
      type: 'INFO',
      linkUrl: '/incoming-docs',
    },
    {
      userId: userMap.get('head_acc')!,
      title: 'ວຽກງານໃໝ່ທີ່ໄດ້ຮັບມອບໝາຍ',
      message: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ ໄດ້ມອບໝາຍວຽກ "ຄົ້ນຄວ້າ ແລະ ສັງລວມມາດຕະການປະຢັດງົບປະມານ"',
      type: 'URGENT',
      linkUrl: '/task-tracking',
    },
    {
      userId: userMap.get('director')!,
      title: 'ເອກະສານລໍຖ້າອະນຸມັດ',
      message: 'ເອກະສານຂາອອກເລກທີ ຂອ-2026/0089 ລໍຖ້າການອະນຸມັດຈາກທ່ານ',
      type: 'APPROVAL',
      linkUrl: '/outgoing-docs',
    },
    {
      userId: userMap.get('head_ash')!,
      title: 'ແຈ້ງເຕືອນກຳນົດເວລາ',
      message: 'ວຽກງານ "ສ້າງແຜນສະໜອງຂີ້ເທົ່າລອຍ" ໃກ້ຈະຮອດກຳນົດສົ່ງ (12/10/2026)',
      type: 'WARNING',
      linkUrl: '/task-tracking',
    }
  ];

  for (const n of notificationsSeed) {
    await prisma.notification.create({ data: n });
  }

  // 12. Sample Calendar Events
  const calendarSeed = [
    {
      title: 'ກອງປະຊຸມຄະນະບໍລິຫານງານປະຈຳເດືອນ 10',
      description: 'ປຶກສາຫາລືແຜນການໄຕມາດ 4 ແລະ ປະເມີນຜົນການນຳໃຊ້ e-Office',
      eventType: 'MEETING',
      startDate: new Date('2026-10-06T09:00:00'),
      endDate: new Date('2026-10-06T11:30:00'),
      allDay: false,
      location: 'ຫ້ອງປະຊຸມໃຫຍ່ ຊັ້ນ 4',
      color: '#2563eb',
      departmentId: deptsMap.get('DEP-DEV'),
      createdById: userMap.get('director'),
    },
    {
      title: 'ກອງປະຊຸມປຶກສາຫາລືໂຄງການຂີ້ເທົ່າລອຍກັບ EDL',
      description: 'ເຈລະຈາເງື່ອນໄຂສັນຍາ ແລະ ລາຄາສະໜອງໃຫ້ເຂື່ອນນ້ຳງື່ມ 3',
      eventType: 'MEETING',
      startDate: new Date('2026-10-10T13:30:00'),
      endDate: new Date('2026-10-10T16:00:00'),
      allDay: false,
      location: 'ຫ້ອງປະຊຸມກະຊວງພະລັງງານ ແລະ ບໍ່ແຮ່',
      color: '#d97706',
      departmentId: deptsMap.get('DEP-ASH'),
      createdById: userMap.get('head_ash'),
    },
    {
      title: 'ກຳນົດສົ່ງບົດສະຫຼຸບມາດຕະການປະຢັດງົບປະມານ',
      description: 'ກຳນົດສົ່ງວຽກ TSK-2026-001',
      eventType: 'TASK_DUE',
      startDate: new Date('2026-10-15T17:00:00'),
      endDate: new Date('2026-10-15T17:00:00'),
      allDay: true,
      location: 'ພະແນກບັນຊີ-ການເງິນ',
      color: '#dc2626',
      departmentId: deptsMap.get('DEP-ACC'),
      createdById: userMap.get('head_acc'),
    }
  ];

  for (const c of calendarSeed) {
    await prisma.calendarEvent.create({ data: c });
  }

  // 13. Initial Audit Logs
  const auditLogsSeed = [
    {
      userId: userMap.get('admin'),
      userName: 'ໂນກອນ ພອນວິໄລ',
      action: 'LOGIN',
      module: 'AUTH',
      description: 'ຜູ້ໃຊ້ admin ເຂົ້າສູ່ລະບົບສຳເລັດ',
      ipAddress: '192.168.1.105',
    },
    {
      userId: userMap.get('admin'),
      userName: 'ໂນກອນ ພອນວິໄລ',
      action: 'CREATE',
      module: 'DOCUMENT',
      description: 'ລົງທະບຽນເອກະສານຂາເຂົ້າເລກທີ ຂຂ-2026/0142',
      ipAddress: '192.168.1.105',
    },
    {
      userId: userMap.get('director'),
      userName: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ',
      action: 'ASSIGN',
      module: 'TASK',
      description: 'ມອບໝາຍວຽກ TSK-2026-001 ໃຫ້ ທ່ານ ນາງ ວິໄລພອນ ແກ້ວມະນີ',
      ipAddress: '192.168.1.100',
    },
    {
      userId: userMap.get('director'),
      userName: 'ທ່ານ ບຸນມີ ວົງສະຫວັນ',
      action: 'APPROVE',
      module: 'DOCUMENT',
      description: 'ອະນຸມັດເອກະສານຂາອອກເລກທີ ຂອ-2026/0088',
      ipAddress: '192.168.1.100',
    }
  ];

  for (const a of auditLogsSeed) {
    await prisma.auditLog.create({ data: a });
  }

  // 14. System Settings
  const settingsSeed = [
    { key: 'ORG_NAME_LAO', value: 'ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)', description: 'ຊື່ອົງກອນພາສາລາວ', category: 'GENERAL' },
    { key: 'ORG_NAME_EN', value: 'Lao Holding State Enterprise', description: 'Organization Name in English', category: 'GENERAL' },
    { key: 'ORG_LOGO_URL', value: 'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png', description: 'Logo URL', category: 'GENERAL' },
    { key: 'DEFAULT_LANGUAGE', value: 'lo', description: 'Default system language', category: 'SYSTEM' },
    { key: 'MAX_UPLOAD_SIZE_MB', value: '50', description: 'Maximum file upload size in MB', category: 'STORAGE' },
    { key: 'ENABLE_AUDIT_LOG', value: 'true', description: 'Enable system audit logging', category: 'SECURITY' },
    { key: 'SESSION_TIMEOUT_MINS', value: '120', description: 'Session timeout in minutes', category: 'SECURITY' },
  ];

  for (const s of settingsSeed) {
    await prisma.systemSetting.create({ data: s });
  }

  console.log('✅ e-OFFICE database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
