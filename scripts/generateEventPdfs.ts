import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../src/assets/logoBase64';

const outDir = path.resolve('public/event-circulars');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const events = [
  {
    fileName: 'hackathon-2024.pdf',
    id: 'evt-1',
    title: 'Swarrnim National Startup Hackathon 2024',
    category: 'HACKATHON',
    date: '2024-04-10',
    time: '09:00 AM - 06:00 PM',
    venue: 'Swarrnim Innovation Incubation Center, Main Block',
    organizer: 'SSCIT Innovation Cell & AI Society',
    description: '36-hour national hackathon bringing innovative student founders to prototype AI, clean-tech, and Web3 solutions with seed funding opportunities.'
  },
  {
    fileName: 'aws-cloud-workshop.pdf',
    id: 'evt-2',
    title: 'Cloud Computing & AWS Architecture Hands-on Workshop',
    category: 'WORKSHOP',
    date: '2024-04-18',
    time: '10:00 AM - 01:00 PM',
    venue: 'Computer Lab 3, SSCIT Block',
    organizer: 'Dept. of Computer Engineering',
    description: 'Deep dive into AWS serverless architecture, EC2 orchestration, VPC networking, and cloud security with hands-on lab deployments.'
  },
  {
    fileName: 'innovista-techfest.pdf',
    id: 'evt-3',
    title: 'Annual TechFest Innovista 2024: Robotics & Coding Arena',
    category: 'TECHFEST',
    date: '2024-04-25',
    time: '09:30 AM - 05:30 PM',
    venue: 'University Central Auditorium & Quadrangle',
    organizer: 'Student Activity Council & IEEE Student Branch',
    description: 'Grand annual technical festival featuring RoboWars, competitive speed debugging, drone race, and tech exhibitions.'
  },
  {
    fileName: 'generative-ai-masterclass.pdf',
    id: 'evt-4',
    title: 'Generative AI & Machine Learning Industry Masterclass',
    category: 'SEMINAR',
    date: '2024-05-02',
    time: '02:00 PM - 04:30 PM',
    venue: 'Seminar Hall 1, Academic Block A',
    organizer: 'AI & Data Science Department',
    description: 'Interactive seminar with industry leaders from leading AI labs on building LLM agents, RAG architectures, and fine-tuning.'
  }
];

for (const event of events) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const brandNavy: [number, number, number] = [15, 44, 89];
  const brandOrange: [number, number, number] = [243, 112, 35];
  const textDark: [number, number, number] = [15, 23, 42];
  const textMuted: [number, number, number] = [100, 116, 139];
  const bgLight: [number, number, number] = [248, 250, 252];
  const borderSlate: [number, number, number] = [226, 232, 240];

  let curY = 16;

  if (SWARRNIM_LOGO_PNG_BASE64) {
    try {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', marginX, curY - 2, 20, 20);
    } catch (e) {}
  }

  const headerTextX = marginX + 24;
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', headerTextX, curY + 3);

  doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setFontSize(9.5);
  doc.text('OFFICIAL EVENT CIRCULAR & TECHFEST BULLETIN', headerTextX, curY + 8);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar - 382420, Gujarat, India | www.swarrnim.edu.in', headerTextX, curY + 12.5);

  curY += 18;
  doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.rect(marginX, curY, contentWidth * 0.75, 1.2, 'F');
  doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.rect(marginX + contentWidth * 0.75, curY, contentWidth * 0.25, 1.2, 'F');
  curY += 6;

  const refNumber = `SSIU/EVT/${event.category.toUpperCase()}/${event.date.replace(/-/g, '')}/${event.id.replace('evt-', '')}`;
  const metaBoxY = curY;
  const metaBoxHeight = 22;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CIRCULAR REF NO:', marginX + 4, metaBoxY + 6);
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(refNumber, marginX + 4, metaBoxY + 11);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ORGANIZING CELL:', marginX + 4, metaBoxY + 16);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(event.organizer, marginX + 32, metaBoxY + 16);

  const rightColX = marginX + contentWidth - 4;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EVENT DATE:', rightColX - 52, metaBoxY + 6);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.date, rightColX, metaBoxY + 6, { align: 'right' });

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EVENT CATEGORY:', rightColX - 52, metaBoxY + 16);
  doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.category.toUpperCase(), rightColX, metaBoxY + 16, { align: 'right' });

  curY += metaBoxHeight + 8;

  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  const titlePrefix = 'OFFICIAL ANNOUNCEMENT: ';
  const titleLines = doc.splitTextToSize(titlePrefix + event.title.toUpperCase(), contentWidth);
  doc.text(titleLines, marginX, curY);
  curY += titleLines.length * 5.5 + 2;

  doc.setDrawColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, curY, marginX + contentWidth, curY);
  curY += 7;

  const schedBoxY = curY;
  const schedBoxHeight = 18;

  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, schedBoxY, contentWidth, schedBoxHeight, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TIME & SCHEDULE:', marginX + 4, schedBoxY + 6);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.time, marginX + 32, schedBoxY + 6);

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('CAMPUS VENUE:', marginX + 4, schedBoxY + 12.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.venue, marginX + 32, schedBoxY + 12.5);

  curY += schedBoxHeight + 8;

  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EVENT OVERVIEW & PARTICIPATION GUIDELINES:', marginX, curY);
  curY += 5.5;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const descLines = doc.splitTextToSize(event.description, contentWidth);
  doc.text(descLines, marginX, curY);
  curY += descLines.length * 5 + 6;

  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('IMPORTANT INSTRUCTIONS FOR PARTICIPANTS:', marginX, curY);
  curY += 5;

  const points = [
    '• Valid University Student ID Card is mandatory at the entrance registration desk.',
    '• All registered participants will receive official Certificates of Participation recognized by SSIU.',
    '• Teams for Hackathons and Competitions must complete registration before the published deadline.',
    '• Winners will be awarded cash prizes, incubation grants, and mementos during the closing valedictory session.'
  ];

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const pt of points) {
    doc.text(pt, marginX + 2, curY);
    curY += 4.5;
  }

  curY += 8;
  const signX = marginX + contentWidth - 65;
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Convener / Event Head,', signX, curY);
  curY += 4.5;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.organizer, signX, curY);
  curY += 4;

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Swarrnim Startup & Innovation University', signX, curY);

  const footerY = pageHeight - 12;
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'This is an official event circular verified by Swarrnim University Events Directorate. Valid without physical signature.',
    marginX,
    footerY
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Page 1 of 1', pageWidth - marginX, footerY, { align: 'right' });

  const buf = doc.output('arraybuffer');
  fs.writeFileSync(path.join(outDir, event.fileName), Buffer.from(buf));
  console.log('Generated:', event.fileName);
}
