# Codebase Review: Proposed Fix Tasks

เอกสารนี้สรุปงานที่ควรทำจากการตรวจสอบโค้ด โดยคัดมาอย่างละ 1 งานตามที่ร้องขอ

## 1) งานแก้ไขข้อความที่พิมพ์ผิด (Typo/Text Fix)
- **ปัญหา:** README ใช้คำว่า `Inspirafirma` ซึ่งไม่สอดคล้องกับการเรียกชื่อแกนระบบแยกเป็น `Inspira` (Brain) และ `Firma` (Body) ในส่วนอื่นของเอกสารเดียวกัน
- **ผลกระทบ:** ทำให้ผู้อ่านใหม่เข้าใจว่าเป็นชื่อระบบเดียว ไม่ใช่ชื่อ 2 ส่วน
- **งานที่เสนอ:** แก้ข้อความเป็น `Inspira & Firma` เพื่อให้ตรงกับคำอธิบายสถาปัตยกรรมในเอกสาร

## 2) งานแก้ไขบั๊ก (Bug Fix)
- **ปัญหา:** ฝั่ง Body รอฟังข้อความ WebSocket ที่ `method === "ui:shader_intent"` แต่ฝั่ง Brain (`AetherBus.publish`) แปลง method เป็น `tools/{topic}` ทำให้ไม่เข้าเงื่อนไขและ UI ไม่ได้รับ `PhysicsParams`
- **ผลกระทบ:** การ manifest ฝั่งหน้าจออาจไม่เกิดขึ้นแม้ Brain ประมวลผลสำเร็จ
- **งานที่เสนอ:** ปรับ protocol ให้ตรงกันทั้งสองฝั่ง (เลือกอย่างใดอย่างหนึ่ง)
  1) เปลี่ยนฝั่ง Bus ให้ส่ง `method` เป็น `ui:shader_intent` โดยตรง
  2) หรือขยายตัว parser ฝั่ง Body ให้รองรับ `tools/ui:shader_intent`

## 3) งานแก้ไขคอมเมนต์/ความคลาดเคลื่อนของเอกสาร (Comment/Doc Alignment)
- **ปัญหา:** README ระบุ Body เป็น `React Native/Skia` และ tech stack เป็น `React Native Skia` แต่โค้ดจริงใช้ `Vite + React + TypeScript` บนเว็บ
- **ผลกระทบ:** ผู้อ่าน/ผู้ร่วมพัฒนา setup ผิดทิศทาง และคาดหวัง runtime ไม่ตรงจริง
- **งานที่เสนอ:** ปรับ README ให้สะท้อน stack ปัจจุบัน และเพิ่มหมายเหตุถ้าตั้งใจ migrate ไป React Native ในอนาคต

## 4) งานปรับปรุงการทดสอบ (Testing Improvement)
- **ปัญหา:** ยังไม่พบไฟล์ unit/integration tests ที่ครอบคลุม flow สำคัญ
- **ผลกระทบ:** เปลี่ยน protocol หรือ logic แล้วมีโอกาส regression สูง
- **งานที่เสนอ:** เพิ่ม test ขั้นต่ำสำหรับ
  - contract ของ payload ใน `AetherBus.publish`
  - กติกา guardrail ใน `PRGX1_Sentry.inspect`
  - happy-path ของ websocket message mapping (`input/voice_data` -> `ui:shader_intent`)
