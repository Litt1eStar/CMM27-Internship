export const STATUS_ORDER = [
  'NOT_STARTED',
  'RESUME_DONE',
  'PORTFOLIO_DONE',
  'APPLICATIONS_SUBMITTED',
  'INTERNSHIP_CONFIRMED',
];

export const STATUS_LABEL = {
  NOT_STARTED: 'ยังไม่เตรียมตัว',
  RESUME_DONE: 'ทำ Resume แล้ว',
  PORTFOLIO_DONE: 'ทำ Portfolio แล้ว',
  APPLICATIONS_SUBMITTED: 'ยื่นแล้ว',
  INTERNSHIP_CONFIRMED: 'ยืนยันที่ฝึกงาน',
};

export const STATUS_STYLE = {
  NOT_STARTED: 'bg-gray-100 text-gray-700 border-gray-200',
  RESUME_DONE: 'bg-sky-50 text-sky-800 border-sky-200',
  PORTFOLIO_DONE: 'bg-violet-50 text-violet-800 border-violet-200',
  APPLICATIONS_SUBMITTED: 'bg-amber-50 text-amber-800 border-amber-200',
  INTERNSHIP_CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export const EVENT_LABEL = {
  INITIALIZED: 'เริ่มต้นสถานะ: ยังไม่เตรียมตัว',
  RESUME_COMPLETED: 'ทำ Resume เสร็จ',
  PORTFOLIO_COMPLETED: 'ทำ Portfolio เสร็จ',
  APPLICATIONS_SUBMITTED: 'เอกสารครบ และยื่นสมัครแล้ว',
  INTERNSHIP_CONFIRMED: 'ยืนยันที่ฝึกงาน',
};

export const WORK_MODES = [
  { value: 'ONSITE', label: 'Onsite' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];
export const WORK_MODE_LABEL = Object.fromEntries(WORK_MODES.map((m) => [m.value, m.label]));

export const SOURCES = [
  { value: 'SENIOR', label: 'ข้อมูลจากรุ่นพี่' },
  { value: 'CLASSMATE', label: 'ข้อมูลจากเพื่อนร่วมรุ่น' },
];
export const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));

const dateTimeFmt = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'Asia/Bangkok',
});

export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '-');

/** Friendly Thai messages for API error codes. */
export const ERROR_MESSAGE = {
  PREREQ_NOT_MET: 'ต้องทำ Resume และ Portfolio ให้ครบก่อนจึงจะยื่นได้',
  INVALID_TRANSITION: 'ต้องยื่นสมัครก่อนจึงจะยืนยันที่ฝึกงานได้',
  COMPANY_REQUIRED: 'กรุณาเลือกบริษัทที่ยืนยันฝึกงาน',
  ALREADY_DONE: 'รายการนี้ทำเสร็จไปแล้ว',
  FORWARD_ONLY: 'สถานะย้อนกลับไม่ได้',
  DUPLICATE_NAME: 'มีบริษัทชื่อนี้ในระบบแล้ว',
  COMPANY_IN_USE: 'มีนักศึกษายืนยันฝึกงานที่บริษัทนี้แล้ว จึงลบไม่ได้',
  STUDENT_NOT_FOUND: 'ไม่พบรหัสนักศึกษานี้ในรายชื่อ กรุณาติดต่ออาจารย์ที่ปรึกษา',
  ALREADY_CLAIMED: 'รหัสนักศึกษานี้ถูกผูกกับบัญชีอื่นแล้ว กรุณาติดต่ออาจารย์ที่ปรึกษา',
  DOMAIN_NOT_ALLOWED: 'กรุณาเข้าสู่ระบบด้วยอีเมล @mail.kmutt.ac.th',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
};

export const errorText = (err) => ERROR_MESSAGE[err?.code] || err?.message || 'เกิดข้อผิดพลาด';
