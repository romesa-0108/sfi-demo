/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; })();
const D = n => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return toISO(d); };
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const fmtD = (s, o = { day: 'numeric', month: 'short' }) => parseD(s).toLocaleDateString('en-GB', o);
const PKR = n => 'Rs ' + Math.round(n).toLocaleString('en-US');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ---------- business settings (configurable in the real system) ---------- */
const CFG = { minDays: 3, bufferAfter: 1, deliveryFee: 1500, whatsapp: '923000000000', currency: 'PKR' };

/* ---------- inventory: every row is one physical garment ---------- */
const GARMENTS = [
  { id: 'g1', code: 'SFI-BR-014', name: 'Noor-e-Jahan Lehnga', cat: 'Bridal', type: 'lehnga', size: 'M', color: 'Crimson & Gold', c1: '#9A1B31', c2: '#4A0D1A', acc: '#E8C575', rate: 14000, deposit: 30000, note: 'Zardozi & dabka hand-embroidery with a net dupatta', care: 'Dry-clean only' },
  { id: 'g2', code: 'SFI-BR-021', name: 'Gulnaar Bridal Sharara', cat: 'Bridal', type: 'sharara', size: 'S', color: 'Rose Gold & Maroon', c1: '#B03A52', c2: '#5D1527', acc: '#F3D3A4', rate: 12500, deposit: 28000, note: 'Heavy gota work with a flowing sharara and dupatta', care: 'Dry-clean only' },
  { id: 'g3', code: 'SFI-BR-027', name: 'Zarqa Peshwari Bridal', cat: 'Bridal', type: 'pishwas', size: 'L', color: 'Deep Red & Antique Gold', c1: '#B3202F', c2: '#650D19', acc: '#E3BC6B', rate: 13500, deposit: 30000, note: 'Floor-length peshwari with kalidar flare', care: 'Dry-clean only' },
  { id: 'g4', code: 'SFI-BR-033', name: 'Mehr-un-Nisa Walima Maxi', cat: 'Bridal', type: 'gown', size: 'M', color: 'Ivory & Champagne', c1: '#F3E8D6', c2: '#CBB48C', acc: '#B8893B', rate: 11000, deposit: 25000, note: 'Pearl and crystal bodice, soft tulle skirt', care: 'Dry-clean only' },
  { id: 'g5', code: 'SFI-BR-038', name: 'Dilruba Nikkah Gown', cat: 'Bridal', type: 'gown', size: 'S', color: 'Blush & Pearl', c1: '#F4CFCB', c2: '#D49A9E', acc: '#B8893B', rate: 10500, deposit: 24000, note: 'Delicate threadwork in a romantic blush palette', care: 'Dry-clean only' },
  { id: 'g6', code: 'SFI-BR-041', name: 'Shehnaz Emerald Lehnga', cat: 'Bridal', type: 'lehnga', size: 'M', color: 'Emerald & Gold', c1: '#12775A', c2: '#073A2D', acc: '#E8C575', rate: 13000, deposit: 28000, note: 'Rich velvet-finish choli with gold tilla border', care: 'Dry-clean only' },
  { id: 'g7', code: 'SFI-PW-102', name: 'Roshni Organza Maxi', cat: 'Party', type: 'gown', size: 'S', color: 'Teal & Silver', c1: '#1E8A91', c2: '#0C4650', acc: '#D6EEEA', rate: 5200, deposit: 10000, note: 'Layered organza with sequin detailing', care: 'Dry-clean only' },
  { id: 'g8', code: 'SFI-PW-108', name: 'Afsaana Velvet Gown', cat: 'Party', type: 'gown', size: 'M', color: 'Midnight Blue', c1: '#26346F', c2: '#0E1433', acc: '#CDB57C', rate: 5800, deposit: 12000, note: 'Structured velvet with gold neckline piping', care: 'Dry-clean only' },
  { id: 'g9', code: 'SFI-PW-113', name: 'Mehfil Mustard Pishwas', cat: 'Party', type: 'pishwas', size: 'L', color: 'Mustard & Ivory', c1: '#DDA81F', c2: '#8F5F0A', acc: '#FFF2C7', rate: 4800, deposit: 9000, note: 'Flared pishwas ideal for dholki and mehndi', care: 'Dry-clean only' },
  { id: 'g10', code: 'SFI-PW-118', name: 'Sitara Sequin Gown', cat: 'Party', type: 'gown', size: 'S', color: 'Champagne', c1: '#E2C9A0', c2: '#A98A5A', acc: '#FFFFFF', rate: 6200, deposit: 12000, note: 'All-over sequin shimmer, cocktail-ready', care: 'Spot clean / dry-clean' },
  { id: 'g11', code: 'SFI-PW-124', name: 'Laali Mehndi Gharara', cat: 'Party', type: 'sharara', size: 'M', color: 'Mehndi Green', c1: '#719E32', c2: '#2F5A14', acc: '#F5D860', rate: 4600, deposit: 9000, note: 'Festive gharara set with mirror-work', care: 'Dry-clean only' },
  { id: 'g12', code: 'SFI-PW-129', name: 'Aaina Plum Formal Set', cat: 'Party', type: 'sharara', size: 'L', color: 'Plum & Lilac', c1: '#74317A', c2: '#34132B', acc: '#EBCBE4', rate: 5000, deposit: 10000, note: 'Elegant formal sharara set with soft shimmer', care: 'Dry-clean only' }
];

/* ---------- rental requests / bookings (one list, status drives everything) ---------- */
const RENTAL_FLOW = ['Pending Review', 'Approved - Awaiting Payment', 'Confirmed', 'Ready for Pickup', 'Rented', 'Returned - Inspection Pending', 'Completed'];
const BLOCKING = ['Approved - Awaiting Payment', 'Confirmed', 'Ready for Pickup', 'Rented', 'Returned - Inspection Pending', 'Overdue / Damage Review'];

const REQUESTS = [
  { id: 'SFI-R-2031', g: 'g2', start: D(-1), end: D(2), name: 'Aisha Tariq', phone: '0301 5550142', fulfil: 'Pickup', status: 'Rented', paid: 40500, created: D(-9) },
  { id: 'SFI-R-2024', g: 'g3', start: D(-6), end: D(-2), name: 'Noor Fatima', phone: '0333 5550198', fulfil: 'Delivery', status: 'Overdue / Damage Review', paid: 97500, created: D(-14) },
  { id: 'SFI-R-2027', g: 'g4', start: D(-4), end: D(-1), name: 'Zoya Hashmi', phone: '0321 5550177', fulfil: 'Pickup', status: 'Returned - Inspection Pending', paid: 58000, created: D(-12) },
  { id: 'SFI-R-2035', g: 'g5', start: D(3), end: D(5), name: 'Komal Shah', phone: '0345 5550113', fulfil: 'Pickup', status: 'Ready for Pickup', paid: 55500, created: D(-6) },
  { id: 'SFI-R-2036', g: 'g1', start: D(9), end: D(11), name: 'Hira Malik', phone: '0300 5550166', fulfil: 'Delivery', status: 'Confirmed', paid: 73500, created: D(-5) },
  { id: 'SFI-R-2039', g: 'g8', start: D(4), end: D(6), name: 'Fiza Haider', phone: '0312 5550121', fulfil: 'Pickup', status: 'Confirmed', paid: 29400, created: D(-4) },
  { id: 'SFI-R-2041', g: 'g7', start: D(12), end: D(14), name: 'Rabia Anwar', phone: '0322 5550189', fulfil: 'Pickup', status: 'Confirmed', paid: 25600, created: D(-3) },
  { id: 'SFI-R-2043', g: 'g11', start: D(8), end: D(10), name: 'Sadia Noman', phone: '0334 5550134', fulfil: 'Delivery', status: 'Approved - Awaiting Payment', paid: 0, created: D(-2) },
  { id: 'SFI-R-2044', g: 'g10', start: D(-14), end: D(-11), name: 'Laiba Qureshi', phone: '0306 5550150', fulfil: 'Pickup', status: 'Completed', paid: 30600, created: D(-22) },
  /* pending review: includes a double-booking trap on g1 and a head-to-head pair on g6 */
  { id: 'SFI-R-2046', g: 'g1', start: D(10), end: D(12), name: 'Sana Rauf', phone: '0315 5550172', fulfil: 'Pickup', status: 'Pending Review', paid: 0, created: D(-1) },
  { id: 'SFI-R-2047', g: 'g6', start: D(5), end: D(7), name: 'Maryam Siddiqui', phone: '0302 5550108', fulfil: 'Delivery', status: 'Pending Review', paid: 0, created: D(-1) },
  { id: 'SFI-R-2048', g: 'g6', start: D(6), end: D(8), name: 'Zainab Ali', phone: '0343 5550160', fulfil: 'Pickup', status: 'Pending Review', paid: 0, created: D(0) },
  { id: 'SFI-R-2049', g: 'g9', start: D(7), end: D(9), name: 'Iqra Javed', phone: '0311 5550145', fulfil: 'Pickup', status: 'Pending Review', paid: 0, created: D(0) }
];

const MAINT = [
  { g: 'g10', type: 'Cleaning', start: D(-1), end: D(1) },
  { g: 'g12', type: 'Repair', start: D(-2), end: D(4) }
];

/* ---------- stitching orders ---------- */
const STAGES = ['Received', 'Awaiting Consultation', 'Awaiting Measurements', 'Quotation Sent', 'Awaiting Customer Approval', 'Confirmed', 'Stitching in Progress', 'Fitting / Alteration', 'Quality Check', 'Ready', 'Delivered / Collected'];
const STAGE_HELP = {
  'Received': 'We have your request and will review it shortly.',
  'Awaiting Consultation': 'Our designer will call you to discuss the design and fabric.',
  'Awaiting Measurements': 'Please share measurements online or visit us for a fitting.',
  'Quotation Sent': 'Your price and completion date are ready for review.',
  'Awaiting Customer Approval': 'Approve the design, price and date to start stitching.',
  'Confirmed': 'Order confirmed. Your advance has been recorded.',
  'Stitching in Progress': 'Your outfit is being crafted by our tailors.',
  'Fitting / Alteration': 'Time for your trial. Book a fitting slot with us.',
  'Quality Check': 'Final inspection and finishing in progress.',
  'Ready': 'Your outfit is ready for pickup or delivery.',
  'Delivered / Collected': 'Handed over. Thank you for choosing us!'
};
const ORDERS = [
  { id: 'SFI-1042', name: 'Mahnoor Iqbal', phone: '0300 5550101', item: 'Bridal Lehnga (custom)', fabric: 'Boutique fabric', stage: 6, due: D(12), quote: 185000, paid: 90000, staff: 'Rukhsana', urgent: false },
  { id: 'SFI-1045', name: 'Hina Rehman', phone: '0321 5550102', item: 'Party Maxi · 2 pcs', fabric: 'Customer fabric', stage: 7, due: D(3), quote: 28000, paid: 14000, staff: 'Shahid', urgent: true },
  { id: 'SFI-1047', name: 'Aleena Farooq', phone: '0333 5550103', item: 'Shalwar Kameez · 3 pcs', fabric: 'Customer fabric', stage: 2, due: D(16), quote: 0, paid: 0, staff: 'Rukhsana', urgent: false },
  { id: 'SFI-1048', name: 'Rida Naveed', phone: '0345 5550104', item: 'Walima Gown', fabric: 'Boutique fabric', stage: 3, due: D(24), quote: 96000, paid: 0, staff: 'Rukhsana', urgent: false },
  { id: 'SFI-1050', name: 'Bushra Kamal', phone: '0312 5550105', item: 'Formal Kurta Set', fabric: 'Customer fabric', stage: 0, due: D(10), quote: 0, paid: 0, staff: '—', urgent: false },
  { id: 'SFI-1051', name: 'Amna Siddique', phone: '0322 5550106', item: 'Bridal Sharara', fabric: 'Boutique fabric', stage: 8, due: D(2), quote: 142000, paid: 100000, staff: 'Shahid', urgent: true },
  { id: 'SFI-1053', name: 'Tooba Ashraf', phone: '0334 5550107', item: 'Mehndi Gharara', fabric: 'Boutique fabric', stage: 9, due: D(1), quote: 54000, paid: 30000, staff: 'Shahid', urgent: false },
  { id: 'SFI-1054', name: 'Saira Bano', phone: '0306 5550109', item: 'Casual Lawn · 4 pcs', fabric: 'Customer fabric', stage: 4, due: D(18), quote: 22000, paid: 0, staff: 'Rukhsana', urgent: false },
  { id: 'SFI-1056', name: 'Eman Zahid', phone: '0302 5550110', item: 'Party Pishwas', fabric: 'Boutique fabric', stage: 6, due: D(8), quote: 48000, paid: 25000, staff: 'Shahid', urgent: false }
];

/* ---------- appointments ---------- */
const SLOTS = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const APPT_TYPES = [
  { id: 'consult', label: 'Stitching consultation', icon: 'scissors' },
  { id: 'measure', label: 'Measurements', icon: 'ruler' },
  { id: 'fitting', label: 'Fitting / alteration', icon: 'shirt' },
  { id: 'rental', label: 'Rental consultation', icon: 'gem' },
  { id: 'school', label: 'School inquiry', icon: 'graduation-cap' }
];
const APPTS = [
  { id: 'A-301', type: 'measure', name: 'Mahnoor Iqbal', phone: '0300 5550101', date: D(0), time: '11:00', status: 'Completed' },
  { id: 'A-302', type: 'fitting', name: 'Hina Rehman', phone: '0321 5550102', date: D(0), time: '13:00', status: 'Confirmed' },
  { id: 'A-303', type: 'rental', name: 'Aleena Farooq', phone: '0333 5550103', date: D(0), time: '15:00', status: 'Confirmed' },
  { id: 'A-304', type: 'consult', name: 'Rida Naveed', phone: '0345 5550104', date: D(0), time: '17:00', status: 'Requested' },
  { id: 'A-305', type: 'fitting', name: 'Amna Siddique', phone: '0322 5550106', date: D(1), time: '12:00', status: 'Confirmed' },
  { id: 'A-306', type: 'school', name: 'Mehwish Gul', phone: '0313 5550111', date: D(1), time: '16:00', status: 'Requested' },
  { id: 'A-307', type: 'measure', name: 'Bushra Kamal', phone: '0312 5550105', date: D(2), time: '14:00', status: 'Confirmed' },
  { id: 'A-308', type: 'consult', name: 'Saima Yousuf', phone: '0304 5550112', date: D(3), time: '11:00', status: 'Requested' }
];

/* ---------- academy ---------- */
const COURSES = [
  { id: 'c1', title: 'Foundations of Stitching', level: 'Beginner', weeks: 8, fee: 18000, cap: 15, enrolled: 11, starts: D(12), sched: 'Mon · Wed · Fri, 10:00 – 12:30', blurb: 'Machine handling, taking measurements, drafting and stitching your first kameez and trousers.', skills: ['Machine basics', 'Measuring', 'Basic drafting'] },
  { id: 'c2', title: 'Advanced Tailoring & Pattern Making', level: 'Intermediate', weeks: 12, fee: 32000, cap: 12, enrolled: 12, starts: D(19), sched: 'Tue · Thu · Sat, 14:00 – 17:00', blurb: 'Block patterns, grading, fitted bodices, linings and professional finishing techniques.', skills: ['Pattern blocks', 'Fitted garments', 'Finishing'] },
  { id: 'c3', title: 'Bridal Embroidery & Finishing', level: 'Advanced', weeks: 10, fee: 38000, cap: 10, enrolled: 6, starts: D(26), sched: 'Sat · Sun, 11:00 – 16:00', blurb: 'Zardozi, dabka, tilla and hand-finishing for bridal and festive wear.', skills: ['Zardozi', 'Dabka & tilla', 'Hand finishing'] },
  { id: 'c4', title: 'Fashion Design Essentials', level: 'All levels', weeks: 16, fee: 45000, cap: 10, enrolled: 4, starts: D(33), sched: 'Mon · Wed, 15:00 – 18:00', blurb: 'Sketching, fabric knowledge, mood boards and building a small collection.', skills: ['Sketching', 'Fabrics', 'Collection building'] }
];
const APPLICATIONS = [
  { id: 'AP-71', name: 'Mehwish Gul', phone: '0313 5550111', course: 'c1', date: D(-3), status: 'Applied' },
  { id: 'AP-72', name: 'Rimsha Ahmed', phone: '0307 5550114', course: 'c2', date: D(-2), status: 'Applied' },
  { id: 'AP-73', name: 'Anum Basit', phone: '0331 5550115', course: 'c3', date: D(-2), status: 'Applied' },
  { id: 'AP-74', name: 'Fatima Zehra', phone: '0344 5550116', course: 'c1', date: D(-6), status: 'Accepted' },
  { id: 'AP-75', name: 'Nimra Saleem', phone: '0316 5550117', course: 'c2', date: D(-8), status: 'Waitlisted' }
];

/* ---------- reports ---------- */
const MONTHS = (() => {
  const out = [];
  const seed = [[196, 118, 48], [212, 128, 54], [238, 146, 61], [196, 171, 48], [264, 188, 72], [318, 236, 81]];
  for (let i = 5; i >= 0; i--) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1); out.push({ label: d.toLocaleDateString('en-GB', { month: 'short' }), st: seed[5 - i][0] * 1000, re: seed[5 - i][1] * 1000, sc: seed[5 - i][2] * 1000 }); }
  return out;
})();
const ACTIVITY = [
  { t: 'Payment received · Rs 55,500 from Komal Shah', k: 'pay', ago: '2 h ago' },
  { t: 'Order SFI-1053 moved to Ready', k: 'order', ago: '3 h ago' },
  { t: 'Return received · Mehr-un-Nisa Walima Maxi', k: 'rent', ago: 'Yesterday' },
  { t: 'New school application · Anum Basit', k: 'school', ago: 'Yesterday' }
];
const TESTIMONIALS = [
  { q: 'The lehnga fit like it was made for me. Booking the dates was effortless and I always knew where my order stood.', n: 'Hira M.', r: 'Bridal rental' },
  { q: 'I sent my fabric and a picture. Two fittings later it was perfect, and I tracked every stage from my phone.', n: 'Sana R.', r: 'Custom stitching' },
  { q: 'Joining the stitching course changed my career. Clear schedule, patient teachers and real tailoring skills.', n: 'Mehwish G.', r: 'Academy student' }
];
