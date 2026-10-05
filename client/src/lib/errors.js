/** Thai messages for API error codes. Unknown codes fall back to a generic message. */
const MESSAGES = {
  PREREQ_NOT_MET: 'ต้องทำ Resume และ Portfolio ให้ครบก่อนจึงจะยื่นได้',
  INVALID_TRANSITION: 'ต้องยื่นสมัครก่อนจึงจะยืนยันที่ฝึกงานได้',
  ALREADY_DONE: 'รายการนี้ทำเสร็จไปแล้ว',
  FORWARD_ONLY: 'สถานะย้อนกลับไม่ได้',
  DUPLICATE_NAME: 'มีบริษัทชื่อนี้ในระบบแล้ว',
  DUPLICATE: 'มีรหัสนักศึกษานี้ในรายชื่อแล้ว', // (extrapolated) 5e
  STUDENT_NOT_FOUND: 'ไม่พบรหัสนักศึกษานี้ในรายชื่อ กรุณาติดต่ออาจารย์ที่ปรึกษา',
  ALREADY_CLAIMED: 'รหัสนักศึกษานี้ถูกผูกกับบัญชีอื่นแล้ว กรุณาติดต่ออาจารย์ที่ปรึกษา',
  DOMAIN_NOT_ALLOWED: 'กรุณาเข้าสู่ระบบด้วยอีเมล @mail.kmutt.ac.th',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  NETWORK: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง', // (extrapolated)
};

export const errorText = (err) => MESSAGES[err?.code] || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
