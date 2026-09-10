# DESIGN.md — PedsDose TH/EN

> เอกสารออกแบบ UI/UX สำหรับโปรเจกต์ **PedsDose TH/EN**
>
> จุดประสงค์ของไฟล์นี้คือกำหนดทิศทางการออกแบบหน้าตาและประสบการณ์ใช้งานของเว็บแอปคำนวณขนาดยาในเด็ก
>
> โปรเจกต์นี้ต้องมีลักษณะ **น่ารักเหมือนเด็ก**, **ดูเป็นมิตร**, **ใช้งานง่าย**, **มี animation แบบพอดี**, และ **responsive ดีมาก** บนมือถือ แท็บเล็ต และเดสก์ท็อป
>
> แต่ในเวลาเดียวกันต้องยังคงความเป็น **clinical tool สำหรับบุคลากรทางการแพทย์** ไม่ใช่ของเล่น ไม่แฟนซีเกินไป และต้องทำให้ข้อมูลด้านความปลอดภัย เช่น dose, max dose, warning, contraindication อ่านง่ายมากที่สุด

---

# 1. Design Vision

## 1.1 แนวคิดหลัก

แอปนี้เป็น **Pediatric Dose Calculator** ที่ตั้งใจให้ความรู้สึก:

- อ่อนโยน
- เป็นมิตร
- สะอาด
- ปลอดภัย
- น่าใช้งาน
- ไม่กดดันสายตา
- เหมาะกับงานเด็ก
- แต่ยังคงความน่าเชื่อถือแบบ medical tool

ให้คิดคาแรกเตอร์ของแอปประมาณนี้:

```text
friendly pediatric clinical assistant
```

ไม่ใช่:

```text
serious hospital dashboard
```

และไม่ใช่:

```text
toy app for children
```

## 1.2 Mood & Tone

ต้องการบรรยากาศแบบ:

- soft
- warm
- cheerful
- clean
- gentle
- modern
- reassuring

คีย์เวิร์ดสำหรับ Agent:

```text
pediatric
cute but professional
soft rounded UI
friendly medical interface
playful microinteractions
safe and clean design
mobile-first
```

---

# 2. Overall Art Direction

## 2.1 Visual personality

ภาพรวมควรมีบุคลิกดังนี้

- ใช้มุมโค้งมนเป็นหลัก
- ใช้สีพาสเทลอ่อน ๆ
- ใช้ white space เยอะ
- ใช้ card layout ที่ดูเป็นบล็อกชัด
- ใช้ icon ที่เป็นมิตร
- ใช้ animation เล็ก ๆ แบบนุ่มนวล
- ใช้ typography ที่อ่านง่าย
- ใช้ลวดลายประกอบนิดหน่อย เช่น เมฆ, ดาว, หัวใจ, ยิ้ม, ยาเม็ด, หยดน้ำ, thermometer, bandage, teddy-bear vibe แบบ abstract
- ห้ามรบกวนการอ่านข้อมูลทางคลินิก

## 2.2 สิ่งที่ควรหลีกเลี่ยง

ห้ามทำให้หน้าตาออกไปทาง:

- futuristic neon
- dark cyber UI
- gaming interface
- enterprise dashboard แข็ง ๆ
- สีสดจัดเกินไป
- animation แรงเกินไป
- cartoon มากจนดูไม่เหมาะกับ clinical setting
- childish เกินจนลดความน่าเชื่อถือ

---

# 3. Brand Style Direction

## 3.1 Brand personality

แอปควรสื่อถึง:

- Child-friendly
- Healthcare-friendly
- Pharmacist-friendly
- Trustworthy
- Gentle
- Helpful

## 3.2 Suggested brand adjectives

ใช้เป็นแนวอ้างอิงเวลาสร้างหน้าตา:

```text
soft
safe
cute
light
calm
smart
kind
modern
playful
reliable
```

---

# 4. Color System

## 4.1 Primary palette

ให้ใช้โทนสีหลักแบบ pastel และสะอาด

### Primary

- Soft Sky Blue — ใช้เป็นสีหลักของแอป
- Mint Green — ใช้เสริมในส่วน positive / safe
- Peach / Soft Coral — ใช้กับ CTA บางจุด
- Lavender — ใช้เพิ่มความน่ารัก
- Warm Cream / Off-white — พื้นหลังหลัก

## 4.2 Suggested palette (approximate)

สามารถใช้ค่าสีใกล้เคียงได้ ไม่ต้องยึดเป๊ะ แต่ควรคงโทนเดิม

- Primary Blue: `#7EC8E3`
- Secondary Mint: `#A8E6CF`
- Soft Peach: `#FFD3B6`
- Soft Yellow: `#FFF3B0`
- Lavender: `#CDB4DB`
- Pink Accent: `#FFC8DD`
- Background Cream: `#FFFDF8`
- White: `#FFFFFF`
- Neutral Text: `#334155`
- Light Border: `#E5E7EB`

## 4.3 Clinical status colors

แม้ UI จะน่ารัก แต่สีเตือนต้องชัด

### Safe / normal

- สีเขียว mint/green ที่มองชัด
- เช่น `#34D399` หรือโทนใกล้เคียง

### Caution

- สีเหลืองอมส้มที่อ่านง่าย
- เช่น `#FBBF24`

### Danger / Contraindication

- สีแดงอ่อนแต่ชัด
- เช่น `#F87171`

### Info

- สีฟ้า
- เช่น `#60A5FA`

### Important rule

ห้ามใช้สีพาสเทลจน warning อ่านยาก

ข้อมูลด้านความปลอดภัยต้อง contrast พอ

---

# 5. Typography

## 5.1 Overall typography style

ตัวอักษรควร:

- อ่านง่ายมาก
- ดูนุ่มนวล
- รองรับภาษาไทยดี
- แสดงตัวเลข dose ชัดเจน
- ดูทันสมัย
- ไม่เป็นทางการจนแข็ง
- ไม่น่ารักแบบลายมือเด็กจนอ่านยาก

## 5.2 Thai + English font direction

เลือก font ที่:

- รองรับไทยและอังกฤษดี
- มีความโค้งมนเล็กน้อย
- เหมาะกับ UI
- ตัวเลขอ่านง่าย

แนะนำแนวทาง:

### Thai-friendly UI fonts

- Noto Sans Thai
- IBM Plex Sans Thai
- Prompt
- Kanit (ใช้ได้ แต่ระวังถ้าดู playful เกิน)
- LINE Seed Sans TH (ถ้าใช้งานได้ตามเงื่อนไข)

### English/UI

- Inter
- Nunito
- Quicksand (ใช้เฉพาะบางส่วน)
- Poppins
- Noto Sans

## 5.3 Recommended font pairing

แนวทางที่แนะนำ:

### Option A

- Main UI: `Noto Sans Thai` + `Inter`

### Option B

- Main UI: `IBM Plex Sans Thai` + `Inter`

### Option C

- Soft and cute UI: `Prompt` + `Nunito`

## 5.4 Text hierarchy

ลำดับความสำคัญของตัวหนังสือ

1. Calculated dose
2. Drug name
3. Volume / tablet amount
4. Warning / contraindication
5. Frequency / route
6. Notes / clinical details
7. Reference

### ขนาดตัวอักษรโดยประมาณ

- Hero title: ใหญ่เด่น
- Section title: ใหญ่ปานกลาง
- Card title: ชัด
- Body: อ่านสบาย
- Caption: เล็กแต่ยังอ่านง่าย
- Result number: เด่นที่สุดบนหน้าจอ

---

# 6. Shape Language

## 6.1 Corners

ควรใช้มุมโค้งมนทั่วทั้งระบบ

แนวทาง:

- ปุ่ม: rounded มาก
- input: rounded
- card: rounded ใหญ่
- modal: rounded
- badge/chip: rounded-full หรือกึ่ง pill

อารมณ์โดยรวมควร “นุ่ม” ไม่เหลี่ยมแข็ง

## 6.2 Shadows

ใช้เงาอ่อน ๆ แบบ soft shadow

ต้องการความรู้สึก:

- ลอยขึ้นเล็กน้อย
- เบา
- สะอาด
- ไม่หนาเกินไป

หลีกเลี่ยง:

- เงาดำเข้ม
- เงาหนักแบบ material แข็ง ๆ
- glow สีแรง

## 6.3 Borders

ใช้ border บาง ๆ หรือแยก section ด้วยสีอ่อน

เหมาะกับการสร้างความชัดเจนแบบไม่รบกวนสายตา

---

# 7. Illustration & Decorative Elements

## 7.1 General rule

ใส่ความน่ารักได้ แต่ต้อง “พอดี”

องค์ประกอบตกแต่งควรอยู่ในรูปแบบ:

- abstract clouds
- sparkles
- rounded blobs
- smile icons
- medicine capsule illustration
- teddy-bear inspired iconography
- stars / moon / rainbow dots เล็กน้อย
- child-friendly medical stickers

## 7.2 Places where decoration is allowed

- hero header
- empty state
- loading state
- onboarding/help section
- category chips
- subtle background blobs
- illustration side panel on desktop

## 7.3 Places where decoration should be minimal

- result card
- max dose warning
- contraindication area
- dosage calculation section
- reference section

พื้นที่ clinical core ต้องอ่านง่ายและชัดที่สุด

---

# 8. Animation & Motion Design

## 8.1 Motion philosophy

Animation ต้องให้ความรู้สึก:

- soft
- friendly
- delightful
- lightweight
- non-distracting

ไม่ใช่:

- flashy
- bouncy เกินไป
- over-animated
- slow จนเสียเวลา

## 8.2 Allowed animation types

ใช้ animation แบบนุ่ม ๆ ดังนี้

- fade in
- slide up / slide down
- soft scale on hover
- gentle pulse
- tab underline transition
- accordion expand/collapse
- chip select animation
- result card reveal
- loading shimmer
- floating tiny background elements (เบามาก)

## 8.3 Recommended interaction animations

### Buttons

- hover: ขยายเล็กน้อย
- tap: กดยุบเล็กน้อย
- focus: มี ring ชัดเจน

### Cards

- hover: ยกขึ้นเล็กน้อย
- selected: border + soft glow + icon animation นิดหน่อย

### Tabs / category chips

- active state เปลี่ยนสีแบบ smooth
- slide indicator ได้

### Result panel

- เมื่อคำนวณเสร็จ ให้ animate แบบ fade + slide in
- ห้ามเด้งแรง

### Accordion / clinical info

- expand/collapse smoothly
- รองรับ reduced motion

## 8.4 Cute but safe animation examples

ตัวอย่างสิ่งที่ทำได้:

- ไอคอนเด็กหรือยาเม็ดขยับเบา ๆ บริเวณ header
- ดาวหรือหัวใจเล็ก ๆ โผล่ตอน hover ปุ่มบางปุ่ม
- แถบ category active ขยับนุ่ม ๆ
- result number highlight ด้วย soft pulse สั้น ๆ

## 8.5 Motion performance rules

- ใช้ transform / opacity เป็นหลัก
- หลีกเลี่ยง animation ที่ทำให้ layout shift หนัก
- รองรับ `prefers-reduced-motion`
- ถ้าผู้ใช้ตั้ง reduced motion ให้ลด animation ลงมาก

---

# 9. Layout Strategy

## 9.1 Layout principle

โครงสร้างต้อง:

- mobile-first
- simple
- content-first
- easy to scan
- section-based
- visually friendly

## 9.2 Main page layout

หน้าหลักควรแบ่งเป็นส่วน ๆ ดังนี้

1. Header
2. Language switch
3. Patient input section
4. Search section
5. Category tabs / chips
6. Drug list or search result
7. Selected drug detail
8. Dose result
9. Warning / contraindication
10. Clinical info
11. Reference
12. Disclaimer

## 9.3 Desktop layout

บน desktop สามารถใช้ 2-column หรือ 3-zone layout ได้ เช่น

### Option A

Left panel:

- input
- search
- category
- drug list

Right panel:

- result
- warning
- clinical details

### Option B

Top:

- title + language switch

Left:

- patient input + search + categories

Center:

- drug list

Right:

- result + clinical card

แต่ต้องไม่ซับซ้อนเกินไป

## 9.4 Mobile layout

บนมือถือให้เป็น single-column stack

ลำดับแนะนำ:

1. Header
2. Input
3. Search
4. Categories
5. Drug cards
6. Result
7. Warning
8. Details

Result ควรเลื่อนถึงง่าย ไม่ต้องเลื่อนเยอะเกินไป

---

# 10. Responsive Design Requirements

## 10.1 Breakpoints

กำหนดอย่างน้อย:

- Mobile small: ~320–374 px
- Mobile: ~375–767 px
- Tablet: ~768–1023 px
- Desktop: ~1024–1439 px
- Large desktop: 1440 px+

Agent สามารถใช้ breakpoints ตาม framework ได้ แต่ต้องรักษาพฤติกรรมให้เหมาะสม

## 10.2 Responsive goals

ทุก breakpoint ต้อง:

- อ่านง่าย
- กดได้สะดวก
- ไม่ล้นจอ
- ข้อมูลสำคัญต้องเห็นชัด
- ไม่เกิด horizontal scroll
- input ไม่เล็กเกินไป
- button ไม่เล็กเกินไป
- Thai text ไม่ตัดผิด

## 10.3 Mobile behavior

มือถือเป็นเป้าหมายสำคัญมาก

### Mobile UI requirements

- ปุ่มใหญ่พอกดง่าย
- input สูงกำลังดี
- card ซ้อนกันสวย
- category chips เลื่อนแนวนอนได้
- result card เด่นชัด
- warning card ไม่ยาวจนอ่านยาก
- typography ต้องอ่านง่ายด้วยมือเดียว
- sticky action เล็กน้อยได้ ถ้าช่วย usability

## 10.4 Tablet behavior

บนแท็บเล็ต:

- ใช้ 2 columns ได้
- ให้ drug list กับ result อยู่ร่วมกันได้
- เพิ่ม white space ได้
- ใช้ side-by-side sections ได้บางส่วน

## 10.5 Desktop behavior

บน desktop:

- ใช้พื้นที่กว้างขึ้น
- เพิ่ม illustration พื้นหลังฝั่งขวาหรือ header ได้
- ทำ layout แบบ card sections ที่ชัดเจน
- result panel ควร prominent มาก

---

# 11. Header Design

## 11.1 Content

Header ควรมี:

- App name
- subtitle สั้น ๆ
- language switch
- maybe small cute icon / logo

ตัวอย่างข้อความ:

### Thai

- PedsDose
- ผู้ช่วยคำนวณขนาดยาในเด็ก

### English

- PedsDose
- Pediatric Dose Calculator

## 11.2 Style

Header ควร:

- ดูสดใส
- มี gradient อ่อน ๆ ได้
- มี blob/background illustration นิดหน่อย
- มี icon เช่น pill / teddy / heart / baby face แบบเรียบง่ายได้

อย่าให้ header ใหญ่เกินไปบนมือถือ

---

# 12. Input Section Design

## 12.1 Input cards

ส่วนกรอกข้อมูลเด็กควรอยู่ใน card ที่เป็นมิตร

ช่องหลัก:

- Weight
- Age

อาจแยก:

- อายุเป็นปี / เดือน
  หรือ
- โครงสร้างที่สอดคล้องกับ logic เดิมของ upstream

## 12.2 Input styling

- rounded
- soft border
- clear labels
- placeholder อ่านเข้าใจง่าย
- unit อยู่ในตำแหน่งที่ชัด

ตัวอย่าง:

- Weight [ 18.0 ] kg
- Age [ 5 ] years [ 0 ] months

## 12.3 Inline friendliness

สามารถใช้ icon เล็ก ๆ เช่น

- น้ำหนัก = scale icon
- อายุ = baby/clock icon

แต่ต้องไม่รก

---

# 13. Search UX

## 13.1 Search bar

Search bar ควรโดดเด่น ใช้ง่าย และเป็นมิตร

ลักษณะ:

- rounded full or soft rounded
- icon ค้นหา
- clear button
- รองรับทั้ง TH และ EN

## 13.2 Search result behavior

- แสดงผลเร็ว
- ชัดเจน
- highlight item ที่เลือก
- mobile ใช้งานง่าย
- ถ้ามี empty result ให้มีข้อความน่ารักแต่ไม่เสียเวลา

ตัวอย่าง empty state:

- ไม่พบยาที่ค้นหา ลองค้นด้วยชื่อสามัญหรือชื่ออื่น
- No matching medicine found. Try a generic name or another keyword.

---

# 14. Category Chips / Tabs

## 14.1 Style

หมวดหมู่ควรเป็น chip/tabs แบบ pill

ลักษณะ:

- สีพาสเทล
- active ชัด
- มี icon ได้
- เลื่อนแนวนอนได้บนมือถือ
- spacing ดี

## 14.2 Examples

เช่น:

- ⭐ Favorites
- 🤧 URI
- 🤢 AGE
- 💊 Antibiotics
- 🌡 Fever
- ⚡ Seizure
- 🚨 Emergency
- 🫀 PALS

## 14.3 Interaction

- hover นุ่ม ๆ
- active state ชัด
- focus ring ชัด
- selected chip ขยายเล็กน้อยได้

---

# 15. Drug List / Drug Cards

## 15.1 Card style

รายการยาควรแสดงเป็น card หรือ list item ที่:

- อ่านง่าย
- แยก item ชัด
- น่ากด
- มีชื่อยาเด่น
- มี subtitle เช่น form/route/category

## 15.2 Card contents

ควรมีอย่างน้อย:

- Drug name
- Form / route
- Short category / tags
- Optional concentration

## 15.3 Selected state

เมื่อเลือกยา:

- border เด่นขึ้น
- background เปลี่ยนอ่อน ๆ
- อาจมี check icon เล็กน้อย
- scroll ไปยัง result card ได้อย่างนุ่มนวล

---

# 16. Dose Result Design

## 16.1 Most important area

นี่คือส่วนสำคัญที่สุดของระบบ

ต้องเด่น อ่านง่าย และสบายตา

## 16.2 Result card style

ใช้ card พิเศษที่:

- ใหญ่กว่า card อื่น
- มี background ขาวหรือฟ้าอ่อน
- มี shadow อ่อน
- มี heading ชัด
- มีตัวเลขขนาดใหญ่

## 16.3 Information hierarchy

เรียงข้อมูลประมาณนี้:

1. Drug name
2. Calculated dose
3. mL / tablet amount
4. Frequency
5. Max dose
6. Notes
7. Reference

## 16.4 Numeric emphasis

ตัวเลข result เช่น

- `180 mg/dose`
- `3.6 mL/dose`

ต้องเด่นมากที่สุด

อาจใช้:

- larger font
- bold
- separated line
- highlight background pill

## 16.5 Range display

ถ้าเป็น dose range:

- แสดงให้เข้าใจง่าย
- ไม่รก
- ใช้ stacked layout หรือ dual-value layout

---

# 17. Warning / Contraindication Design

## 17.1 Safety section must stand out

แม้แอปจะน่ารัก แต่ warning ต้องจริงจังพอ

## 17.2 Style hierarchy

### Contraindication

- สีแดงอ่อนแต่ชัด
- icon เตือน
- label ชัดมาก
- card ชัดเจน

### Warning / caution

- สีเหลือง/ส้ม
- card แยก
- อ่านง่าย

### Info note

- ฟ้าหรือเทาอ่อน
- secondary card

## 17.3 Design rule

ห้ามทำ warning ให้ดู “น่ารักจนเบาเกินไป”

ความน่ารักของแอปต้องหยุดตรง safety-critical zone

---

# 18. Clinical Detail Section

## 18.1 Expandable details

รายละเอียดทางคลินิกควรอยู่ใน accordion / collapsible card

หัวข้อเช่น:

- Clinical use
- Contraindications
- Adverse effects
- Warnings
- Pregnancy
- Breastfeeding
- Controlled drug status

## 18.2 UX behavior

- collapsed by default ได้
- ขยายแล้วอ่านง่าย
- spacing ดี
- title ชัด
- บนมือถืออย่าทำให้ยาวอึดอัดเกินไป

---

# 19. Reference Section

## 19.1 Importance

ควรมีแต่ไม่ต้องเด่นกว่า result

## 19.2 Style

ใช้ card หรือ footer section เบา ๆ
มีหัวข้อ:

- แหล่งอ้างอิง
- Reference

ควรแสดง:

- source name
- optional metadata
- provenance ชัดเจน

---

# 20. Empty States, Loading States, and Error States

## 20.1 Empty state

สามารถใส่ความน่ารักได้มากกว่าส่วนอื่น

เช่น:

- illustration เล็ก ๆ
- icon ยิ้ม
- ข้อความเป็นมิตร

## 20.2 Loading state

ใช้:

- skeleton cards
- shimmer เบา ๆ
- pulse soft

อย่าใช้ spinner อย่างเดียวถ้ามีหลาย section

## 20.3 Error state

ถ้าคำนวณไม่ได้:

- ใช้ card ที่ชัด
- สีอ่อน
- ข้อความตรงไปตรงมา
- ไม่ทำให้ผู้ใช้สับสน

---

# 21. Language Switch Design

## 21.1 Placement

ควรอยู่ใกล้ header มองเห็นง่าย

รูปแบบ:

- segmented control
- pill switch
- ไทย | EN

## 21.2 Behavior

- เปลี่ยนภาษาแบบ smooth
- ไม่รีเซ็ตข้อมูล
- ไม่ reset search
- ไม่ reset result
- animation นุ่ม ๆ

---

# 22. Accessibility Requirements

แม้หน้าตาจะน่ารัก แต่ต้องเข้าถึงได้ดี

## 22.1 Required

- contrast ดี
- focus state ชัด
- keyboard accessible
- screen-reader friendly labels
- touch target ใหญ่พอ
- ไม่ใช้สีอย่างเดียวสำหรับ status
- supports reduced motion

## 22.2 Thai language support

- line-height ต้องเหมาะกับภาษาไทย
- ห้าม clip ตัวอักษรไทย
- spacing ต้องไม่อึดอัด

---

# 23. Microinteractions

เพิ่มได้เพื่อให้น่าใช้ แต่ต้องไม่เยอะเกิน

## 23.1 Good microinteractions

- hover ปุ่มขยับเล็กน้อย
- card selected เด่นขึ้น
- category selected animated
- result reveal
- clear input button
- search suggestion highlight
- copy dose button (ถ้ามีในอนาคต) พร้อม feedback
- collapse/expand smooth

## 23.2 Avoid

- confetti
- excessive bounce
- looping animation ใหญ่ ๆ
- flashing
- sound effects

---

# 24. Suggested Component Library Direction

Agent สามารถใช้ library หรือสร้างเองก็ได้ แต่หน้าตาต้องไปในแนวนี้

ควรมีองค์ประกอบ:

- rounded button
- rounded input
- soft card
- accordion
- segmented control
- chip tabs
- alert card
- tooltip
- modal/dialog

ถ้าใช้ Tailwind + custom components จะควบคุม design ได้ดี

---

# 25. Design Tokens Recommendation

Agent ควรสร้าง design tokens เช่น

```text
colors
spacing
radius
shadow
font sizes
font weights
motion durations
easing
z-index scale
```

เพื่อให้ UI consistency ดี

## 25.1 Radius direction

- small
- medium
- large
- xlarge
- full

ใช้ large/xlarge เยอะเป็นพิเศษในโปรเจกต์นี้

## 25.2 Motion tokens

- fast
- normal
- slow

ใช้ easing ที่นุ่มนวล เช่น ease-out / ease-in-out

---

# 26. Page-by-Page UX Guidance

## 26.1 Main calculator page

ต้องเป็นหน้าที่ดีที่สุดและใช้งานบ่อยสุด

โฟกัส:

- กรอกข้อมูลได้เร็ว
- ค้นหายาได้เร็ว
- เห็นผลลัพธ์เร็ว
- อ่านง่าย
- สลับภาษาได้ง่าย

## 26.2 About / disclaimer page

ให้หน้าตาดูอบอุ่น อ่านสบาย
อาจมี illustration เล็กน้อย

## 26.3 Help / instructions section

ทำให้เป็น card หรือ accordion
ใช้ภาษาง่าย
มี icon ประกอบได้

---

# 27. PWA / Offline Visual Consideration

ถ้ามี offline support:

- แสดง status แบบ unobtrusive
- เช่น badge เล็ก ๆ “Offline ready”
- ไม่เด่นเกิน result

---

# 28. Performance-aware Design

หน้าตาต้องสวย แต่ต้องเร็ว

ดังนั้น:

- อย่าใช้ illustration ขนาดใหญ่มากเกินจำเป็น
- อย่าใช้ animation หนัก
- อย่าใส่กราฟิกเยอะจน render ช้า
- icon ควรเรียบง่าย
- background effects ต้องเบา

---

# 29. Suggested UI Themes by Section

## Header

- ฟ้าอ่อน / cream
- มี blob หรือ cloud เบา ๆ

## Input

- ขาว + border อ่อน
- icon น่ารักเล็กน้อย

## Category chips

- พาสเทลหลากสี
- active ชัด

## Drug list

- ขาวสะอาด
- selected card มีสี accent อ่อน

## Result

- ฟ้าขาวเด่น
- ตัวเลขชัดมาก

## Warning

- เหลือง / แดง ตามระดับ

## Clinical detail

- ขาว / lavender อ่อน / cream

## Reference

- เทาอ่อน / ฟ้าอ่อน

---

# 30. Example UI Keywords for Agent

ใช้คีย์เวิร์ดเหล่านี้เป็น reference เวลาออกแบบ:

```text
cute pediatric healthcare app
soft pastel medical UI
rounded cards
friendly pharmacy calculator
playful but professional
gentle gradients
child-friendly clinical design
responsive mobile-first medical web app
soft microinteractions
clean bilingual UI
```

---

# 31. Hard Constraints

Agent ต้องปฏิบัติตามข้อกำหนดเหล่านี้

## Must

- ดูน่ารักเหมือนเด็ก
- ดูเป็นมิตร
- อ่านง่าย
- responsive ดีมาก
- mobile-first
- animation นุ่มนวล
- clinical information ชัด
- result เด่นมาก
- warning ชัดมาก
- TH/EN layout สวยทั้งคู่
- Thai text อ่านง่าย
- ใช้งานจริงได้

## Must not

- มืดเกินไป
- แข็งแบบ enterprise
- สีฉูดฉาดเกินไป
- animation เยอะเกินไป
- playful จนไม่น่าเชื่อถือ
- ตกแต่งบังข้อมูล clinical
- ทำให้ warning ดูไม่สำคัญ
- desktop-only
- text เล็กเกิน
- spacing แน่นเกิน

---

# 32. Design Acceptance Criteria

ถือว่า design ผ่านเมื่อ:

```text
[ ] เปิดบนมือถือแล้วใช้งานง่าย
[ ] เปิดบน tablet แล้ว layout ดี
[ ] เปิดบน desktop แล้วดูโปร
[ ] ภาพรวมดูน่ารักเหมือนแอปเกี่ยวกับเด็ก
[ ] แต่ยังดูน่าเชื่อถือสำหรับบุคลากรทางการแพทย์
[ ] สีสบายตา
[ ] Typography อ่านง่ายทั้งไทยและอังกฤษ
[ ] Result card เด่นมาก
[ ] Warning/contraindication เด่นชัด
[ ] Search ใช้ง่าย
[ ] Category chips ใช้ง่าย
[ ] Animation นุ่มนวล
[ ] ไม่รบกวนการใช้งาน
[ ] Responsive ดีมาก
[ ] ไม่มี horizontal scroll ในการใช้งานปกติ
[ ] Thai text ไม่ล้น ไม่ clip
[ ] ปุ่มกดง่ายบนมือถือ
[ ] UI ดู modern และน่าใช้
```

---

# 33. Final Direction to All Design/Coding Agents

ให้ออกแบบแอปนี้เหมือนเป็น:

```text
a cute, trustworthy, child-friendly pediatric medication calculator
```

เป้าหมายคือให้ผู้ใช้รู้สึกว่า:

- แอปนี้ใช้ง่าย
- แอปนี้เป็นมิตร
- แอปนี้ดูเหมาะกับงานเด็ก
- แอปนี้ช่วยทำงานได้จริง
- แอปนี้น่ารัก แต่ไม่เสียความเป็นมืออาชีพ

## Final summary

ลำดับความสำคัญของ design คือ:

1. usability
2. readability
3. safety clarity
4. responsive quality
5. cute pediatric personality
6. soft animation
7. visual delight

เมื่อมีความขัดแย้งระหว่าง “ความน่ารัก” กับ “ความชัดเจนของข้อมูลทางคลินิก” ให้เลือก:

```text
clinical clarity wins
```

เมื่อมีความขัดแย้งระหว่าง “animation ที่ดูสนุก” กับ “ความเร็วและความลื่นของแอป” ให้เลือก:

```text
performance and usability win
```

Design นี้ต้องทำให้แอปดู “น่ารัก น่าใช้ และเหมาะกับงานเด็ก” โดยไม่ลดความปลอดภัยในการอ่านผลลัพธ์การคำนวณยา
