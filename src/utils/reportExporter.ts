import { ResearchRecord, RESEARCH_DIVISIONS } from '../data/bnhsTaxonomy';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getDivisionLabel(divId: string): string {
  const found = RESEARCH_DIVISIONS.find((d) => d.id === divId);
  return found ? found.name : divId;
}

export function downloadDataUrlFile(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || 'BNHS_Research_Attachment';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadResearchDossierHtml(record: ResearchRecord) {
  const divisionName = getDivisionLabel(record.division);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(record.title)} — BNHS Official Research Dossier</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #18181b;
      background: #ffffff;
      max-width: 820px;
      margin: 40px auto;
      padding: 0 28px;
      line-height: 1.65;
    }
    .inst-header {
      text-align: center;
      border-bottom: 2px solid #6B1420;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .inst-header p {
      margin: 2px 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
      letter-spacing: 0.04em;
      color: #3f3f46;
    }
    .inst-header h1 {
      margin: 8px 0 4px;
      font-size: 20px;
      color: #6B1420;
    }
    .study-title {
      font-size: 24px;
      line-height: 1.3;
      margin: 0 0 14px;
      color: #09090b;
    }
    .meta-strip {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #52525b;
      border-top: 1px solid #e4e4e7;
      border-bottom: 1px solid #e4e4e7;
      padding: 10px 0;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      margin-bottom: 26px;
      background: #faf9f5;
      padding: 16px;
      border: 1px solid #e4e4e7;
    }
    .section-title {
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #6B1420;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 4px;
      margin: 24px 0 10px;
    }
    .eval-box {
      margin-top: 28px;
      padding: 16px;
      border: 1px solid #d4d4d8;
      background: #f8fafc;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #e4e4e7;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #71717a;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="inst-header">
    <p>Republic of the Philippines · Department of Education · Caraga Region</p>
    <p>Schools Division of Surigao del Sur · Municipality of Barobo</p>
    <h1>BAROBO NATIONAL HIGH SCHOOL</h1>
    <p><strong>School Research and Innovation Portal — Official Research Catalog Dossier</strong></p>
  </div>

  <h2 class="study-title">${escapeHtml(record.title)}</h2>
  <div class="meta-strip">
    <strong>Catalog ID:</strong> ${escapeHtml(record.id)} &nbsp;·&nbsp;
    <strong>Division:</strong> ${escapeHtml(divisionName)} &nbsp;·&nbsp;
    <strong>Status:</strong> ${escapeHtml(record.status)} &nbsp;·&nbsp;
    <strong>School Year:</strong> ${escapeHtml(record.schoolYear)}
  </div>

  <div class="grid">
    <div><strong>Proponents / Authors:</strong><br/>${escapeHtml(record.authors)} (${escapeHtml(record.authorRole)})</div>
    <div><strong>Research Adviser:</strong><br/>${escapeHtml(record.adviser || 'Not specified')}</div>
    <div><strong>Theme / Major Category:</strong><br/>${escapeHtml(record.category)}</div>
    <div><strong>Subcategory / Strand:</strong><br/>${escapeHtml(record.subcategory || 'General')}</div>
    <div><strong>Department / Grade Level:</strong><br/>${escapeHtml(record.departmentOrGrade)}</div>
    <div><strong>Recorded Manuscript File:</strong><br/>${escapeHtml(record.attachmentName || 'None recorded')}</div>
  </div>

  <div class="section-title">1. Executive Abstract</div>
  <p>${escapeHtml(record.abstract)}</p>

  <div class="section-title">2. Research Methodology & Design</div>
  <p>${escapeHtml(record.methodology || 'Standard empirical methodology documented in the full manuscript.')}</p>

  <div class="section-title">3. Key Empirical Findings & Innovation Impact</div>
  <p>${escapeHtml(record.keyFindings || 'Detailed statistical and qualitative findings recorded in manuscript attachment.')}</p>

  <div class="section-title">4. Indexing Keywords</div>
  <p>${escapeHtml(record.keywords)}</p>

  <div class="eval-box">
    <strong>BNHS Research Committee Evaluation Summary</strong><br/>
    <strong>Evaluation Rating:</strong> ${record.evaluationScore > 0 ? `${record.evaluationScore} / 100` : 'Pending Committee Evaluation'}<br/>
    <strong>Evaluated By:</strong> ${escapeHtml(record.evaluatedBy || 'Pending Review Panel')}<br/>
    <strong>Committee Remarks:</strong> ${escapeHtml(record.evaluationRemarks || 'Awaiting formal review session.')}<br/>
    ${record.driveUrl ? `<strong>Google Drive Repository Link:</strong> <a href="${escapeHtml(record.driveUrl)}">${escapeHtml(record.driveUrl)}</a>` : ''}
  </div>

  <div class="footer">
    <span>Generated from Barobo National High School Research & Innovation Portal</span>
    <span>Date Exported: ${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>`;

  const cleanTitle = record.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `${cleanTitle}_BNHS_Research_Report.html`);
}

export function downloadManuscriptWordDoc(record: ResearchRecord) {
  const divisionName = getDivisionLabel(record.division);
  const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${escapeHtml(record.title)}</title></head>
<body style="font-family: Calibri, Arial, sans-serif; line-height: 1.5;">
  <p style="text-align:center; margin:0; font-size:11pt;">Republic of the Philippines · Department of Education · Caraga Region</p>
  <p style="text-align:center; margin:0; font-size:11pt;">Schools Division of Surigao del Sur</p>
  <h2 style="text-align:center; margin:4pt 0 16pt; color:#6B1420;">BAROBO NATIONAL HIGH SCHOOL RESEARCH MANUSCRIPT RECORD</h2>
  <hr/>
  <h1 style="font-size:16pt; color:#111827;">${escapeHtml(record.title)}</h1>
  <p><strong>Authors:</strong> ${escapeHtml(record.authors)} (${escapeHtml(record.authorRole)} Researcher)</p>
  <p><strong>Adviser:</strong> ${escapeHtml(record.adviser || 'N/A')} &nbsp;|&nbsp; <strong>Department/Grade:</strong> ${escapeHtml(record.departmentOrGrade)}</p>
  <p><strong>Research Division:</strong> ${escapeHtml(divisionName)}</p>
  <p><strong>Theme / Category:</strong> ${escapeHtml(record.category)} ${record.subcategory ? `— ${escapeHtml(record.subcategory)}` : ''}</p>
  <p><strong>School Year:</strong> ${escapeHtml(record.schoolYear)} &nbsp;|&nbsp; <strong>Workflow Status:</strong> ${escapeHtml(record.status)}</p>
  <h3>Abstract</h3>
  <p>${escapeHtml(record.abstract)}</p>
  <h3>Research Methodology</h3>
  <p>${escapeHtml(record.methodology)}</p>
  <h3>Key Findings & Recommendations</h3>
  <p>${escapeHtml(record.keyFindings)}</p>
  <h3>Keywords</h3>
  <p>${escapeHtml(record.keywords)}</p>
  <hr/>
  <p style="font-size:10pt; color:#4b5563;"><strong>Attached File Record:</strong> ${escapeHtml(record.attachmentName)} | <strong>Committee Score:</strong> ${record.evaluationScore > 0 ? `${record.evaluationScore}/100` : 'Unrated'}</p>
</body>
</html>`;

  const baseName = (record.attachmentName || record.id).replace(/\.(pdf|docx|doc)$/i, '');
  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword;charset=utf-8',
  });
  triggerDownload(blob, `${baseName}_BNHS_Manuscript.doc`);
}

export function downloadResearchInventoryCsv(records: ResearchRecord[]) {
  const headers = [
    'Catalog ID',
    'Title',
    'Division',
    'Theme or Category',
    'Subcategory',
    'Authors',
    'Proponent Type',
    'Adviser',
    'Department or Grade',
    'School Year',
    'Status',
    'Evaluation Score',
    'Attachment Filename',
    'Google Drive URL',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) =>
    [
      r.id,
      r.title,
      getDivisionLabel(r.division),
      r.category,
      r.subcategory,
      r.authors,
      r.authorRole,
      r.adviser,
      r.departmentOrGrade,
      r.schoolYear,
      r.status,
      r.evaluationScore > 0 ? r.evaluationScore : 'Pending',
      r.attachmentName,
      r.driveUrl,
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csv = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `BNHS_Research_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function downloadStandalonePortalHtml(records: ResearchRecord[]) {
  const serializedRecords = JSON.stringify(records).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BNHS Research and Innovation Portal — Standalone Offline Edition</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FAF9F5;
      color: #18181B;
      line-height: 1.5;
    }
    header {
      background: #6B1420;
      color: #ffffff;
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    header p { margin: 2px 0 0; font-size: 13px; color: #FECDD3; }
    .container { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-box {
      background: #ffffff;
      border: 1px solid #E5E4DF;
      padding: 16px 20px;
    }
    .stat-box .num { font-size: 28px; font-weight: 700; color: #6B1420; font-variant-numeric: tabular-nums; }
    .stat-box .lbl { font-size: 12px; color: #52525B; margin-top: 4px; }
    .toolbar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      background: #ffffff;
      padding: 16px;
      border: 1px solid #E5E4DF;
    }
    input, select, textarea {
      padding: 9px 12px;
      border: 1px solid #D4D4D8;
      font-size: 14px;
      font-family: inherit;
      background: #ffffff;
    }
    input[type="search"] { flex: 1; min-width: 240px; }
    button {
      padding: 9px 16px;
      background: #6B1420;
      color: #ffffff;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    button.secondary { background: #F4F4F0; color: #18181B; border: 1px solid #D4D4D8; }
    .card {
      background: #ffffff;
      border: 1px solid #E5E4DF;
      padding: 20px 24px;
      margin-bottom: 14px;
    }
    .meta { font-size: 12px; color: #52525B; margin-bottom: 6px; }
    .card h3 { margin: 0 0 8px; font-size: 17px; color: #111827; }
    .card p { margin: 0 0 12px; font-size: 14px; color: #3F3F46; }
    .form-panel {
      display: none;
      background: #ffffff;
      border: 1px solid #6B1420;
      padding: 24px;
      margin-bottom: 24px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-bottom: 14px;
    }
    .form-grid label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
    .form-grid input, .form-grid select, .form-grid textarea { width: 100%; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Barobo National High School — Research & Innovation Portal</h1>
      <p>Standalone Browser Edition · Basic Research · Action Research (7 Themes) · TUKLAS Project Fair</p>
    </div>
    <button onclick="toggleForm()">+ Add Local Research Entry</button>
  </header>

  <div class="container">
    <div id="formPanel" class="form-panel">
      <h3 style="margin-top:0;">Submit Research Entry (Saved to Browser LocalStorage)</h3>
      <div class="form-grid">
        <div><label>Research Title</label><input id="fTitle" required /></div>
        <div>
          <label>Research Division</label>
          <select id="fDiv">
            <option value="basic">Basic Research</option>
            <option value="action">Action Research (7 Themes)</option>
            <option value="tuklas">TUKLAS: A Research Project Fair</option>
          </select>
        </div>
        <div><label>Theme / Category</label><input id="fCat" placeholder="e.g., Theme 1: Teaching and Learning or Life Science (LS)" /></div>
        <div><label>Subcategory</label><input id="fSub" placeholder="e.g., Botany & Agricultural Sciences" /></div>
        <div><label>Authors / Proponents</label><input id="fAuthors" /></div>
        <div><label>Adviser</label><input id="fAdviser" /></div>
        <div><label>School Year</label><input id="fSy" value="2026-2027" /></div>
        <div><label>Attachment Filename</label><input id="fFile" placeholder="e.g., BNHS_Manuscript_2026.pdf" /></div>
      </div>
      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Abstract</label>
        <textarea id="fAbs" rows="3" style="width:100%;"></textarea>
      </div>
      <button onclick="saveLocalEntry()">Save Entry</button>
      <button class="secondary" onclick="toggleForm()">Cancel</button>
    </div>

    <div class="stats" id="statsGrid"></div>

    <div class="toolbar">
      <input type="search" id="qSearch" placeholder="Search title, author, keyword, or category..." oninput="render()" />
      <select id="qDiv" onchange="render()">
        <option value="all">All Research Divisions</option>
        <option value="basic">1. Basic Research</option>
        <option value="action">2. Action Research (7 Themes)</option>
        <option value="tuklas">3. TUKLAS Project Fair (4 Categories)</option>
      </select>
      <select id="qStatus" onchange="render()">
        <option value="all">All Statuses</option>
        <option value="Approved">Approved</option>
        <option value="Completed">Completed</option>
        <option value="Ongoing">Ongoing</option>
        <option value="Pending Review">Pending Review</option>
      </select>
    </div>

    <div id="listContainer"></div>
  </div>

  <footer style="background:#6B1420;color:#FFE4E6;padding:10px 16px;overflow:hidden;white-space:nowrap;font-size:12px;font-weight:500;">
    <marquee behavior="scroll" direction="left" scrollamount="5">
      Copyright ©Barobo National High School Research and Innovation Portal <span id="copyrightYear"></span> developed by: Bless T. Tajale.
    </marquee>
  </footer>

  <script>
    function updateCopyrightYear() {
      const yEl = document.getElementById('copyrightYear');
      if (yEl) yEl.textContent = new Date().getFullYear();
    }
    updateCopyrightYear();
    setInterval(updateCopyrightYear, 60000);
    const INITIAL_DATA = ${serializedRecords};
    const STORAGE_KEY = 'bnhs_standalone_portal_entries_v1';
    function getEntries() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
      return INITIAL_DATA;
    }
    function toggleForm() {
      const el = document.getElementById('formPanel');
      el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }
    function saveLocalEntry() {
      const title = document.getElementById('fTitle').value.trim();
      if (!title) return;
      const list = getEntries();
      list.unshift({
        id: 'bnhs_local_' + Date.now(),
        title,
        division: document.getElementById('fDiv').value,
        category: document.getElementById('fCat').value.trim() || 'General',
        subcategory: document.getElementById('fSub').value.trim(),
        authors: document.getElementById('fAuthors').value.trim() || 'BNHS Researcher',
        adviser: document.getElementById('fAdviser').value.trim(),
        schoolYear: document.getElementById('fSy').value.trim() || '2026-2027',
        status: 'Ongoing',
        attachmentName: document.getElementById('fFile').value.trim() || 'Unattached',
        abstract: document.getElementById('fAbs').value.trim() || 'No abstract provided.'
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      toggleForm();
      render();
    }
    function render() {
      const entries = getEntries();
      const q = document.getElementById('qSearch').value.toLowerCase();
      const div = document.getElementById('qDiv').value;
      const st = document.getElementById('qStatus').value;

      document.getElementById('statsGrid').innerHTML = [
        { num: entries.length, lbl: 'Total Research Records' },
        { num: entries.filter(x => x.division === 'basic').length, lbl: 'Basic Research' },
        { num: entries.filter(x => x.division === 'action').length, lbl: 'Action Research (7 Themes)' },
        { num: entries.filter(x => x.division === 'tuklas').length, lbl: 'TUKLAS Fair Projects' }
      ].map(s => '<div class="stat-box"><div class="num">' + s.num + '</div><div class="lbl">' + s.lbl + '</div></div>').join('');

      const filtered = entries.filter(item => {
        if (div !== 'all' && item.division !== div) return false;
        if (st !== 'all' && item.status !== st) return false;
        if (q && !(item.title + ' ' + item.authors + ' ' + item.category + ' ' + item.subcategory + ' ' + item.abstract).toLowerCase().includes(q)) return false;
        return true;
      });

      document.getElementById('listContainer').innerHTML = filtered.map(item =>
        '<div class="card">' +
          '<div class="meta">' + item.division.toUpperCase() + ' · ' + item.category + (item.subcategory ? ' / ' + item.subcategory : '') + ' · SY ' + item.schoolYear + ' · Status: ' + item.status + '</div>' +
          '<h3>' + item.title + '</h3>' +
          '<p>' + item.abstract + '</p>' +
          '<div class="meta"><strong>Authors:</strong> ' + item.authors + (item.adviser ? ' · <strong>Adviser:</strong> ' + item.adviser : '') + ' · <strong>Attachment:</strong> ' + (item.attachmentName || 'None') + '</div>' +
        '</div>'
      ).join('');
    }
    render();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, 'BNHS_Research_Portal.html');
}
