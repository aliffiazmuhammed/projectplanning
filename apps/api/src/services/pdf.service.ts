import PDFDocument from 'pdfkit';
import type { IProjectSpec, ExportPdfOptions } from '@project-planner/types';
import { logger } from '../config/logger.js';

export class PdfService {
  /**
   * Generates a publication-grade multi-page PDF specification report buffer
   * following Section 30 & 31 of the project planning agent specification.
   */
  static async generatePdf(
    spec: IProjectSpec,
    options: ExportPdfOptions = { colorTheme: 'light' }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: `${spec.project.name} - Architecture Specification`,
            Author: 'Project Planning Agent v2.0',
            Subject: 'Software Architecture & Implementation Plan',
            Keywords: 'software, architecture, specification, coding agent, requirements',
            CreationDate: new Date(),
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info(
            { projectName: spec.project.name, bytes: pdfBuffer.length },
            'PDF report successfully generated'
          );
          resolve(pdfBuffer);
        });
        doc.on('error', (err) => reject(err));

        const pageWidth = 595.28; // A4 width in pt
        const contentWidth = pageWidth - 100; // 50pt left and right margins

        // Helper: Check page break
        const ensureSpace = (neededHeight: number = 80) => {
          if (doc.y + neededHeight > 740) {
            doc.addPage();
          }
        };

        // Helper: Section Header
        const renderSectionHeader = (title: string, subtitle?: string) => {
          ensureSpace(60);
          doc.moveDown(0.8);
          const currentY = doc.y;

          // Accent bar
          doc.rect(50, currentY, 4, 18).fill('#4f46e5');

          // Title
          doc
            .fillColor('#0f172a')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(title, 62, currentY + 1);

          if (subtitle) {
            doc
              .fillColor('#64748b')
              .fontSize(9)
              .font('Helvetica')
              .text(subtitle, 62, currentY + 18);
            doc.y = currentY + 32;
          } else {
            doc.y = currentY + 24;
          }

          doc.moveDown(0.3);
        };

        // Helper: Subsection Header
        const renderSubSection = (title: string) => {
          ensureSpace(40);
          doc.moveDown(0.4);
          doc
            .fillColor('#1e293b')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(title);
          doc.moveDown(0.2);
        };

        // ==========================================
        // 1. COVER PAGE
        // ==========================================
        // Top banner pill
        doc.roundedRect(50, 60, 240, 20, 10).fill('#e0e7ff');
        doc
          .fillColor('#4338ca')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('OFFICIAL SPECIFICATION & ARCHITECTURE', 60, 66);

        // Project Name
        doc
          .fillColor('#0f172a')
          .fontSize(28)
          .font('Helvetica-Bold')
          .text(spec.project.name, 50, 100, { width: contentWidth });

        // Subtitle
        doc
          .fillColor('#475569')
          .fontSize(13)
          .font('Helvetica')
          .text('Full System Architecture, Engineering Contract & Implementation Plan', 50, 140, { width: contentWidth });

        // Divider
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 170).lineTo(545, 170).stroke();

        // Metadata Card
        doc.roundedRect(50, 185, contentWidth, 110, 8).fill('#f8fafc');
        doc.roundedRect(50, 185, contentWidth, 110, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();

        const metaCol1 = 70;
        const metaCol2 = 230;
        const metaCol3 = 390;

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('SPEC VERSION', metaCol1, 200);
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(spec.metadata.specVersion || 'v1.0', metaCol1, 212);

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('READINESS SCORE', metaCol2, 200);
        const score = spec.readiness?.overallScore ?? 100;
        const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
        doc.fillColor(scoreColor).fontSize(11).font('Helvetica-Bold').text(`${score} / 100`, metaCol2, 212);

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PROJECT STATUS', metaCol3, 200);
        doc.fillColor('#4f46e5').fontSize(11).font('Helvetica-Bold').text(spec.project.status, metaCol3, 212);

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('TARGET PLATFORM', metaCol1, 240);
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(spec.project.targetPlatform || 'Web Application', metaCol1, 252);

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('TOTAL TASKS', metaCol2, 240);
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(`${spec.tasks.length} Executable Tasks`, metaCol2, 252);

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PUBLICATION DATE', metaCol3, 240);
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(new Date(spec.metadata.generatedAt).toLocaleDateString(), metaCol3, 252);

        // Initial Idea Box
        doc.roundedRect(50, 315, contentWidth, 80, 8).fill('#eff6ff');
        doc.roundedRect(50, 315, contentWidth, 80, 8).strokeColor('#bfdbfe').lineWidth(1).stroke();

        doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold').text('FOUNDER VISION & INITIAL IDEA', 65, 327);
        doc
          .fillColor('#1e3a8a')
          .fontSize(10)
          .font('Helvetica')
          .text(spec.project.initialIdea, 65, 342, { width: contentWidth - 30, lineGap: 3 });

        // Executive Summary Callout
        doc
          .fillColor('#0f172a')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('About This Specification Document', 50, 420);
        doc
          .fillColor('#334155')
          .fontSize(9.5)
          .font('Helvetica')
          .text(
            'This publication-grade specification is the single source-of-truth implementation contract generated by the Autonomous Project Planning Agent. It establishes a complete, verified architectural blueprint encompassing IEEE requirements, UI/UX screens, tech stack choices, database models, REST endpoints, and coding agent tasks ready for autonomous execution.',
            50,
            438,
            { width: contentWidth, lineGap: 4 }
          );

        // Security Notice
        doc.roundedRect(50, 520, contentWidth, 55, 6).fill('#fef2f2');
        doc.roundedRect(50, 520, contentWidth, 55, 6).strokeColor('#fecaca').lineWidth(1).stroke();
        doc.fillColor('#991b1b').fontSize(8.5).font('Helvetica-Bold').text('CONFIDENTIALITY & CREDENTIAL SECURITY (SECTION 30)', 65, 532);
        doc
          .fillColor('#7f1d1d')
          .fontSize(8.5)
          .font('Helvetica')
          .text(
            'In strict compliance with privacy standards, this document never contains raw secret values, tokens, or plaintext passwords. All external services specify where and how credentials should be provided via secure environment configurations.',
            65,
            547,
            { width: contentWidth - 30, lineGap: 2 }
          );

        // Page break to start body
        doc.addPage();

        // ==========================================
        // 2. EXECUTIVE SUMMARY & OBJECTIVES
        // ==========================================
        renderSectionHeader('1. Executive Summary & Goals', 'Core product hypothesis and scope boundaries');

        if (spec.project.description) {
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(spec.project.description, { width: contentWidth, lineGap: 3 });
          doc.moveDown(0.5);
        }

        renderSubSection('Primary Goals:');
        spec.goals.forEach((g) => {
          doc
            .fillColor('#0f172a')
            .fontSize(9)
            .font('Helvetica')
            .text(`•  ${g}`, { width: contentWidth - 15, indent: 15, lineGap: 2 });
        });

        doc.moveDown(0.6);
        renderSubSection('Scope Boundaries:');
        doc.fillColor('#16a34a').fontSize(9).font('Helvetica-Bold').text('IN SCOPE (MVP):');
        spec.scope.inScope.slice(0, 8).forEach((item) => {
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(`✓  ${item}`, { width: contentWidth - 15, indent: 15, lineGap: 1.5 });
        });

        doc.moveDown(0.4);
        doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text('OUT OF SCOPE:');
        spec.scope.outOfScope.forEach((item) => {
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(`✗  ${item}`, { width: contentWidth - 15, indent: 15, lineGap: 1.5 });
        });

        // ==========================================
        // 3. TARGET USER PERSONAS
        // ==========================================
        renderSectionHeader('2. Target Users & Personas', 'Authorized roles and access controls');

        spec.users.forEach((u) => {
          ensureSpace(50);
          doc.roundedRect(50, doc.y, contentWidth, 42, 6).fill('#f8fafc');
          doc.roundedRect(50, doc.y, contentWidth, 42, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();

          const cardY = doc.y;
          doc.fillColor('#4f46e5').fontSize(9.5).font('Helvetica-Bold').text(u.role, 65, cardY + 8);
          doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(u.description, 65, cardY + 22, { width: contentWidth - 30 });
          doc.y = cardY + 50;
        });

        // ==========================================
        // 4. IEEE REQUIREMENTS MATRIX
        // ==========================================
        renderSectionHeader('3. IEEE Requirements Matrix', `Comprehensive functional and non-functional requirements (${spec.requirements.length})`);

        // Table Header
        ensureSpace(30);
        const reqHeaderY = doc.y;
        doc.rect(50, reqHeaderY, contentWidth, 18).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('ID', 55, reqHeaderY + 5);
        doc.text('TITLE & DESCRIPTION', 110, reqHeaderY + 5);
        doc.text('TYPE', 350, reqHeaderY + 5);
        doc.text('PRIORITY', 420, reqHeaderY + 5);
        doc.text('STATUS', 490, reqHeaderY + 5);
        doc.y = reqHeaderY + 22;

        spec.requirements.forEach((req, idx) => {
          ensureSpace(34);
          const rowY = doc.y;
          if (idx % 2 === 1) {
            doc.rect(50, rowY, contentWidth, 30).fill('#f8fafc');
          }

          doc.fillColor('#4f46e5').fontSize(8).font('Helvetica-Bold').text(req.reqId, 55, rowY + 4);
          doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(req.title, 110, rowY + 4, { width: 230, lineGap: 1 });
          doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(req.description.slice(0, 75) + '...', 110, rowY + 16, { width: 230 });

          doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(req.type, 350, rowY + 4);
          
          const prioColor = req.priority === 'CRITICAL' ? '#dc2626' : req.priority === 'HIGH' ? '#d97706' : '#2563eb';
          doc.fillColor(prioColor).fontSize(7.5).font('Helvetica-Bold').text(req.priority, 420, rowY + 4);

          doc.fillColor('#16a34a').fontSize(7.5).font('Helvetica').text(req.status, 490, rowY + 4);

          doc.y = rowY + 32;
        });

        // ==========================================
        // 5. UX/UI & FRONTEND SCREENS
        // ==========================================
        renderSectionHeader('4. UX/UI & Frontend Specifications', 'Design preferences, token palette, and screen specifications');

        ensureSpace(70);
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(
          `Archetype: ${spec.ux.visualCategory}  |  Theme Mode: ${spec.ux.themeMode}  |  Density: ${spec.ux.density}  |  Heading: ${spec.ux.typography.headingFont}  |  Body: ${spec.ux.typography.bodyFont}`
        );
        doc.moveDown(0.5);

        // Color Swatches
        const swatchY = doc.y;
        const colors = [
          { name: 'Primary', val: spec.design_system.colorPalette.primary },
          { name: 'Secondary', val: spec.design_system.colorPalette.secondary },
          { name: 'Accent', val: spec.design_system.colorPalette.accent },
          { name: 'Background', val: spec.design_system.colorPalette.background },
          { name: 'Surface', val: spec.design_system.colorPalette.surface },
          { name: 'Text', val: spec.design_system.colorPalette.text },
        ];

        colors.forEach((c, idx) => {
          const x = 50 + idx * 80;
          doc.roundedRect(x, swatchY, 72, 32, 4).fill(c.val || '#333');
          doc.roundedRect(x, swatchY, 72, 32, 4).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
          doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(c.name, x, swatchY + 36, { width: 72, align: 'center' });
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(c.val || '', x, swatchY + 46, { width: 72, align: 'center' });
        });
        doc.y = swatchY + 62;

        renderSubSection('Screen Breakdown:');
        spec.screens.forEach((s) => {
          ensureSpace(55);
          doc.roundedRect(50, doc.y, contentWidth, 50, 6).fill('#f8fafc');
          doc.roundedRect(50, doc.y, contentWidth, 50, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
          const scrY = doc.y;

          doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(`${s.name} (${s.route})`, 65, scrY + 7);
          doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(`Purpose: ${s.purpose}`, 65, scrY + 20, { width: contentWidth - 30 });
          doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica').text(`Components: ${s.components.slice(0, 5).join(', ')}`, 65, scrY + 34);

          doc.y = scrY + 58;
        });

        // ==========================================
        // 6. TECHNOLOGY STACK DECISIONS
        // ==========================================
        renderSectionHeader('5. Technology Stack Decisions', 'Evaluated and approved technical components');

        ensureSpace(30);
        const techHeaderY = doc.y;
        doc.rect(50, techHeaderY, contentWidth, 18).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('CATEGORY', 55, techHeaderY + 5);
        doc.text('SELECTION & VERSION', 170, techHeaderY + 5);
        doc.text('FOUNDER RATIONALE', 310, techHeaderY + 5);
        doc.text('STATUS', 490, techHeaderY + 5);
        doc.y = techHeaderY + 22;

        spec.technology.forEach((t, idx) => {
          ensureSpace(30);
          const tRowY = doc.y;
          if (idx % 2 === 1) {
            doc.rect(50, tRowY, contentWidth, 26).fill('#f8fafc');
          }

          doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(t.category, 55, tRowY + 4, { width: 110 });
          doc.fillColor('#4f46e5').fontSize(8.5).font('Helvetica-Bold').text(`${t.technology} ${t.version || ''}`, 170, tRowY + 4, { width: 130 });
          doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text((t.plainLanguageExplanation || t.technicalRationale).slice(0, 95) + '...', 310, tRowY + 4, { width: 175 });
          doc.fillColor('#16a34a').fontSize(7.5).font('Helvetica-Bold').text(t.status, 490, tRowY + 4);

          doc.y = tRowY + 28;
        });

        // ==========================================
        // 7. SYSTEM ARCHITECTURE & DATABASE
        // ==========================================
        renderSectionHeader('6. System Architecture & Database Design', 'Backend, database models, and API specifications');

        if (spec.architecture?.systemOverview) {
          doc.fillColor('#334155').fontSize(9).font('Helvetica').text(spec.architecture.systemOverview, { width: contentWidth, lineGap: 2.5 });
          doc.moveDown(0.5);
        }

        renderSubSection(`Database Entities (${spec.database.entities.length} Models):`);
        spec.database.entities.forEach((entity) => {
          ensureSpace(55);
          doc.roundedRect(50, doc.y, contentWidth, 50, 6).fill('#f8fafc');
          doc.roundedRect(50, doc.y, contentWidth, 50, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
          const entY = doc.y;

          doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(`Entity: ${entity.name} (Collection: ${entity.collection})`, 65, entY + 7);
          const fieldsSummary = entity.fields.map((f) => `${f.name}: ${f.type}`).slice(0, 6).join('  |  ');
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(fieldsSummary, 65, entY + 22, { width: contentWidth - 30 });
          doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(entity.description || 'Core application entity', 65, entY + 34);

          doc.y = entY + 58;
        });

        renderSubSection(`REST API Endpoints (${spec.api.endpoints.length} Routes):`);
        spec.api.endpoints.slice(0, 10).forEach((ep) => {
          ensureSpace(22);
          const mColor = ep.method === 'GET' ? '#2563eb' : ep.method === 'POST' ? '#16a34a' : ep.method === 'DELETE' ? '#dc2626' : '#d97706';
          doc.fillColor(mColor).fontSize(8).font('Helvetica-Bold').text(ep.method.padEnd(7), 55, doc.y);
          doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(ep.route, 105, doc.y);
          doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(ep.summary.slice(0, 55), 260, doc.y);
          doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(`Auth: ${ep.authentication || 'NONE'}`, 480, doc.y);
          doc.moveDown(0.4);
        });

        // ==========================================
        // 8. THIRD-PARTY INTEGRATIONS & SECURITY
        // ==========================================
        renderSectionHeader('7. Third-Party Integrations & Security', 'External services and credential requirements');

        spec.integrations.forEach((i) => {
          ensureSpace(42);
          doc.roundedRect(50, doc.y, contentWidth, 38, 6).fill('#f8fafc');
          doc.roundedRect(50, doc.y, contentWidth, 38, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
          const intY = doc.y;

          doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(i.service, 65, intY + 7);
          doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica-Bold').text(`Classification: ${i.securityClassification}`, 200, intY + 8);
          doc.fillColor('#d97706').fontSize(7.5).font('Helvetica-Bold').text(`Status: ${i.blockingStatus}`, 340, intY + 8);
          doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(`Credentials: ${i.credentialsRequired.join(', ') || 'None'}`, 65, intY + 22);

          doc.y = intY + 45;
        });

        // ==========================================
        // 9. HUMAN ACTION SETUP GUIDE (SECTION 31)
        // ==========================================
        renderSectionHeader('8. Actionable Human Setup Guide', 'Step-by-step external service setup checklist for non-technical founders');

        spec.human_actions.forEach((ha) => {
          ensureSpace(75);
          doc.roundedRect(50, doc.y, contentWidth, 70, 6).fill('#fffbeb');
          doc.roundedRect(50, doc.y, contentWidth, 70, 6).strokeColor('#fef3c7').lineWidth(1).stroke();
          const haY = doc.y;

          doc.fillColor('#b45309').fontSize(9).font('Helvetica-Bold').text(`[${ha.actionId}] ${ha.title}`, 65, haY + 8);
          doc.fillColor('#78350f').fontSize(8).font('Helvetica').text(`Why: ${ha.whyRequired}`, 65, haY + 22, { width: contentWidth - 30 });
          
          if (ha.instructions && ha.instructions.length > 0) {
            doc.fillColor('#92400e').fontSize(7.5).font('Helvetica').text(`Steps: 1. ${ha.instructions[0]}  2. ${ha.instructions[1] || 'Obtain API key and provide securely'}`, 65, haY + 36, { width: contentWidth - 30 });
          }

          doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica-Bold').text(`AI Action Afterward: ${ha.aiActionAfterward}`, 65, haY + 52, { width: contentWidth - 30 });

          doc.y = haY + 78;
        });

        // ==========================================
        // 10. IMPLEMENTATION ROADMAP & TASKS
        // ==========================================
        renderSectionHeader('9. Autonomous Coding Agent Task Graph', `Executable tasks decomposition (${spec.tasks.length} total tasks)`);

        spec.tasks.slice(0, 12).forEach((task) => {
          ensureSpace(50);
          doc.roundedRect(50, doc.y, contentWidth, 46, 6).fill('#f8fafc');
          doc.roundedRect(50, doc.y, contentWidth, 46, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
          const tskY = doc.y;

          doc.fillColor('#4f46e5').fontSize(8.5).font('Helvetica-Bold').text(`[${task.taskId}] ${task.title}`, 65, tskY + 7);
          doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold').text(`Type: ${task.type}  |  Priority: ${task.priority}  |  Complexity: ${task.complexity}`, 340, tskY + 7);
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(`Affected Files: ${task.affectedComponents.join(', ')}`, 65, tskY + 20, { width: contentWidth - 30 });
          doc.fillColor('#16a34a').fontSize(7.5).font('Helvetica').text(`Acceptance: ${task.acceptanceCriteria[0] || 'Pass all unit tests'}`, 65, tskY + 31, { width: contentWidth - 30 });

          doc.y = tskY + 52;
        });

        // ==========================================
        // 11. READINESS & APPROVAL GATE
        // ==========================================
        renderSectionHeader('10. Implementation Readiness & Approval Sign-off', 'Verification gate and founder sign-off record');

        ensureSpace(120);
        doc.roundedRect(50, doc.y, contentWidth, 100, 8).fill('#f0fdf4');
        doc.roundedRect(50, doc.y, contentWidth, 100, 8).strokeColor('#bbf7d0').lineWidth(1).stroke();
        const gateY = doc.y;

        doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold').text('FOUNDER APPROVAL & VERIFICATION GATE', 65, gateY + 12);
        doc.fillColor('#166534').fontSize(8.5).font('Helvetica').text(`Overall Readiness Score: ${score}/100   |   Status: ${spec.readiness?.overallStatus || 'READY_FOR_IMPLEMENTATION'}`, 65, gateY + 28);
        doc.fillColor('#14532d').fontSize(8.5).font('Helvetica').text(spec.readiness?.summary || 'Project architecture verified across all 11 planning dimensions with zero blocking defects.', 65, gateY + 42, { width: contentWidth - 30, lineGap: 2 });

        doc.strokeColor('#bbf7d0').lineWidth(0.8).moveTo(65, gateY + 68).lineTo(530, gateY + 68).stroke();
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('APPROVED BY FOUNDER:', 65, gateY + 76);
        doc.fillColor('#15803d').fontSize(8).font('Helvetica').text('Founder / Product Lead', 185, gateY + 76);
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('DATE:', 330, gateY + 76);
        doc.fillColor('#15803d').fontSize(8).font('Helvetica').text(new Date(spec.metadata.generatedAt).toLocaleDateString(), 365, gateY + 76);
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('SIGNATURE:', 440, gateY + 76);
        doc.fillColor('#15803d').fontSize(8).font('Helvetica-Bold').text('VERIFIED ✓', 500, gateY + 76);

        doc.y = gateY + 115;

        // ==========================================
        // 12. RUNNING HEADERS & FOOTERS (PAGINATION)
        // ==========================================
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);

          // Header (skip on cover page i === 0)
          if (i > 0) {
            doc
              .fillColor('#94a3b8')
              .fontSize(7.5)
              .font('Helvetica')
              .text(`${spec.project.name}  |  Specification Document ${spec.metadata.specVersion}`, 50, 30);
            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, 42).lineTo(545, 42).stroke();
          }

          // Footer
          doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, 770).lineTo(545, 770).stroke();
          doc
            .fillColor('#94a3b8')
            .fontSize(7.5)
            .font('Helvetica')
            .text('Confidential - Generated by Project Planning Agent v2.0', 50, 776);
          doc
            .fillColor('#64748b')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text(`Page ${i + 1} of ${range.count}`, 490, 776, { align: 'right', width: 55 });
        }

        // Finalize PDF stream
        doc.end();
      } catch (err) {
        logger.error({ error: err }, 'Error during PDF generation');
        reject(err);
      }
    });
  }
}
