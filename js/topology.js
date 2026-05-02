// topology.js — Network topology fullscreen overlay.
// Called from navigation.js when the topology tile expands.

const TOPO_NODES = [
  { id:'router',        label:'OPNsense',      sublabel:'Router / FW',  icon:'◈', color:'yellow', zone:'both', xFrac:0.13, yFrac:0.50, type:'Firewall / Router',    os:'OPNsense 24.x',    desc:'Main gateway, firewall, DNS, DHCP.',           ports:'22, 443, 80',       isHost:false, connections:['proxmox-soc','proxmox-life'] },
  { id:'proxmox-life',  label:'Proxmox',       sublabel:'Node 2',       icon:'◉', color:'purple', zone:'life', xFrac:0.26, yFrac:0.25, type:'Hypervisor',           os:'Proxmox VE 8.x',   desc:'Host für Home-Services und Life Zone VMs.',    ports:'8006, 22',          isHost:true,  connections:['router'] },
  { id:'homeassistant', label:'Home Assistant',sublabel:'',             icon:'⌂', color:'purple', zone:'life', xFrac:0.40, yFrac:0.10, type:'VM / Container',       os:'HAOS 2024.x',      desc:'Smart Home Automation Hub.',                   ports:'8123',              isHost:false, connections:['proxmox-life'] },
  { id:'pihole',        label:'Pi-Hole',       sublabel:'',             icon:'⊘', color:'purple', zone:'life', xFrac:0.51, yFrac:0.16, type:'VM / Container',       os:'Debian 12',        desc:'Netzwerkweiter DNS-Adblocker.',                ports:'53, 80',            isHost:false, connections:['proxmox-life'] },
  { id:'nginx',         label:'Nginx Proxy',   sublabel:'',             icon:'↗', color:'purple', zone:'life', xFrac:0.62, yFrac:0.09, type:'VM / Container',       os:'Debian 12',        desc:'Reverse Proxy Manager.',                       ports:'80, 443',           isHost:false, connections:['proxmox-life'] },
  { id:'jellyfin',      label:'Jellyfin',      sublabel:'',             icon:'▶', color:'purple', zone:'life', xFrac:0.72, yFrac:0.17, type:'VM / Container',       os:'Debian 12',        desc:'Self-hosted Media Server.',                    ports:'8096',              isHost:false, connections:['proxmox-life'] },
  { id:'nextcloud',     label:'Nextcloud',     sublabel:'',             icon:'☁', color:'purple', zone:'life', xFrac:0.81, yFrac:0.10, type:'VM / Container',       os:'Debian 12',        desc:'Self-hosted Cloud Storage.',                   ports:'443',               isHost:false, connections:['proxmox-life'] },
  { id:'ollama',        label:'Ollama',        sublabel:'Local AI',     icon:'◎', color:'purple', zone:'life', xFrac:0.89, yFrac:0.18, type:'VM / Container',       os:'Ubuntu 22.04',     desc:'Lokaler LLM Runner (Mistral, Llama).',         ports:'11434',             isHost:false, connections:['proxmox-life'] },
  { id:'nas',           label:'NAS',           sublabel:'Storage',      icon:'▣', color:'purple', zone:'life', xFrac:0.96, yFrac:0.11, type:'Physical / VM',        os:'TrueNAS Scale',    desc:'Netzwerkspeicher für alle VMs.',               ports:'445, 2049',         isHost:false, connections:['proxmox-life'] },
  { id:'proxmox-soc',   label:'Proxmox',       sublabel:'Node 1',       icon:'◉', color:'green',  zone:'soc',  xFrac:0.26, yFrac:0.75, type:'Hypervisor',           os:'Proxmox VE 8.x',   desc:'Host für SOC-Tools und Security Research.',    ports:'8006, 22',          isHost:true,  connections:['router'] },
  { id:'wazuh',         label:'Wazuh',         sublabel:'SIEM',         icon:'⊕', color:'green',  zone:'soc',  xFrac:0.40, yFrac:0.63, type:'VM',                   os:'Ubuntu 22.04',     desc:'Open-Source SIEM und XDR Platform.',           ports:'1514, 1515, 55000', isHost:false, connections:['proxmox-soc'] },
  { id:'elk',           label:'ELK Stack',     sublabel:'',             icon:'≡', color:'green',  zone:'soc',  xFrac:0.51, yFrac:0.80, type:'VM',                   os:'Ubuntu 22.04',     desc:'Elasticsearch, Logstash, Kibana.',             ports:'5601, 9200',        isHost:false, connections:['proxmox-soc'] },
  { id:'graylog',       label:'Graylog',       sublabel:'',             icon:'◷', color:'green',  zone:'soc',  xFrac:0.62, yFrac:0.67, type:'VM',                   os:'Ubuntu 22.04',     desc:'Log Management Platform.',                     ports:'9000, 514',         isHost:false, connections:['proxmox-soc'] },
  { id:'docker',        label:'Docker Host',   sublabel:'',             icon:'⬡', color:'green',  zone:'soc',  xFrac:0.72, yFrac:0.82, type:'VM',                   os:'Ubuntu 22.04',     desc:'Container Host für Security Tools.',           ports:'2375, 8080',        isHost:false, connections:['proxmox-soc'] },
  { id:'ubuntu',        label:'Ubuntu Server', sublabel:'',             icon:'○', color:'green',  zone:'soc',  xFrac:0.81, yFrac:0.70, type:'VM',                   os:'Ubuntu 22.04 LTS', desc:'General-Purpose Linux Server.',                ports:'22',                isHost:false, connections:['proxmox-soc'] },
  { id:'kali',          label:'Kali Linux',    sublabel:'Attack VM',    icon:'☠', color:'red',    zone:'soc',  xFrac:0.89, yFrac:0.78, type:'VM – Isolated VLAN',   os:'Kali Linux 2024.x',desc:'Pentest VM, isoliert im eigenen VLAN.',        ports:'—',                 isHost:false, connections:['proxmox-soc'] },
  { id:'targets',       label:'Target VMs',    sublabel:'Isolated',     icon:'⊗', color:'red',    zone:'soc',  xFrac:0.96, yFrac:0.85, type:'VMs – Isolated VLAN',  os:'Various',          desc:'Vulnerable VMs für Practice Labs.',            ports:'—',                 isHost:false, connections:['proxmox-soc','kali'] },
  { id:'grafana',       label:'Grafana',       sublabel:'Prometheus',   icon:'◈', color:'cyan',   zone:'life', xFrac:0.96, yFrac:0.38, type:'Monitoring Stack',     os:'Ubuntu 22.04',     desc:'Monitoring aller Hosts, VMs und Services.',    ports:'3000, 9090',        isHost:false, connections:['proxmox-life','proxmox-soc','homeassistant','pihole','nginx','jellyfin','nextcloud','ollama','nas','wazuh','elk','graylog','docker','ubuntu','kali','targets'] }
];

const TOPO_COLORS = {
  green:  '#39ff14',
  purple: '#c084fc',
  cyan:   '#00e5ff',
  yellow: '#ffd600',
  red:    '#ff3b3b'
};

const SVG_NS    = 'http://www.w3.org/2000/svg';
const topoPos   = {};
let   topoDrag  = null;
let   topoReady = false;

// ── Public API ───────────────────────────────────────────────────────────────

export function openTopology() {
  const overlay = _ensureOverlay();
  if (!overlay) return;
  overlay.classList.add('is-open');

  // Defer init until the overlay is laid out (clientWidth/Height = 0 otherwise)
  if (!topoReady) {
    requestAnimationFrame(() => {
      topoInit();
      topoReady = true;
    });
  } else {
    rescaleNodesToCanvas();
    topoRedraw();
  }
}

export function closeTopology() {
  const overlay = document.getElementById('topology-expanded');
  if (overlay) overlay.classList.remove('is-open');
  topoClosePanel();
}

// ── Defensive overlay creation (no-op if static HTML already present) ────────

function _ensureOverlay() {
  let overlay = document.getElementById('topology-expanded');
  if (overlay) return overlay;
  if (!document.body) return null;

  overlay = document.createElement('div');
  overlay.id = 'topology-expanded';

  // Sub-bar (BACK button + label + desc + meta)
  const subBar = document.createElement('div');
  subBar.className = 'topo-sub-bar';
  const back = document.createElement('button');
  back.className   = 'topo-sub-back';
  back.id          = 'topo-back-btn';
  back.type        = 'button';
  back.textContent = '◀ BACK';
  subBar.appendChild(back);
  const divider = document.createElement('div');
  divider.className = 'topo-sub-divider';
  subBar.appendChild(divider);
  const lbl = document.createElement('span');
  lbl.className   = 'topo-sub-label';
  lbl.textContent = 'HOMELAB';
  subBar.appendChild(lbl);
  const desc = document.createElement('span');
  desc.className   = 'topo-sub-desc';
  desc.textContent = 'Homelab-Netzwerk mit zwei Proxmox-Nodes — SOC Zone für Security-Tools (Wazuh, ELK, Graylog) und Life Zone für Self-Hosted-Services (Nextcloud, Jellyfin, Home Assistant). Alle Systeme im Status PLANNED.';
  subBar.appendChild(desc);
  const meta = document.createElement('span');
  meta.className   = 'topo-sub-meta';
  meta.textContent = '2× PROXMOX · SOC ZONE + LIFE ZONE · PLANNED';
  subBar.appendChild(meta);
  overlay.appendChild(subBar);

  // Canvas row (flex: 1) — canvas wrapper + side panel side-by-side
  const row = document.createElement('div');
  row.className = 'topo-canvas-row';

  const wrapper = document.createElement('div');
  wrapper.className = 'topo-canvas-wrapper';
  const canvas = document.createElement('div');
  canvas.id = 'topo-canvas';
  wrapper.appendChild(canvas);

  const monitor = document.createElement('div');
  monitor.className = 'topo-monitor-badge';
  const dotL = document.createElement('div'); dotL.className = 'topo-pulse-dot'; monitor.appendChild(dotL);
  monitor.appendChild(document.createTextNode(' GRAFANA + PROMETHEUS — MONITORING ALL SYSTEMS '));
  const dotR = document.createElement('div'); dotR.className = 'topo-pulse-dot'; monitor.appendChild(dotR);
  wrapper.appendChild(monitor);

  row.appendChild(wrapper);

  // Side panel (slides in from the right). Content built per-click.
  const panel = document.createElement('div');
  panel.id = 'topo-side-panel';
  row.appendChild(panel);

  overlay.appendChild(row);
  document.body.appendChild(overlay);
  return overlay;
}


// ── Init ─────────────────────────────────────────────────────────────────────

function topoInit() {
  const canvas = document.getElementById('topo-canvas');
  if (!canvas) return;

  // Reset (allow re-init if size changed dramatically)
  canvas.textContent = '';

  // Zone backgrounds
  const lifeBg = document.createElement('div'); lifeBg.className = 'topo-zone-life-bg'; canvas.appendChild(lifeBg);
  const socBg  = document.createElement('div'); socBg.className  = 'topo-zone-soc-bg';  canvas.appendChild(socBg);

  // Zone labels
  const lifeLabel = document.createElement('div');
  lifeLabel.className = 'topo-zone-label topo-zone-label--life';
  lifeLabel.textContent = '── LIFE ZONE';
  canvas.appendChild(lifeLabel);

  const socLabel = document.createElement('div');
  socLabel.className = 'topo-zone-label topo-zone-label--soc';
  socLabel.textContent = '── SOC ZONE';
  canvas.appendChild(socLabel);

  // SVG layer
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', 'topo-svg');
  svg.setAttribute('class', 'topo-svg');
  canvas.appendChild(svg);

  // Internet entry
  const internet = document.createElement('div');
  internet.id = 'topo-internet';
  internet.className = 'topo-internet';

  const diamond = document.createElement('div');
  diamond.className = 'topo-internet__diamond';
  const innerDia = document.createElement('div');
  innerDia.className = 'topo-internet__inner';
  diamond.appendChild(innerDia);
  internet.appendChild(diamond);

  const inLabel = document.createElement('div');
  inLabel.className = 'topo-internet__label';
  inLabel.textContent = 'INTERNET';
  internet.appendChild(inLabel);
  canvas.appendChild(internet);

  // Now read dimensions (canvas is laid out)
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  // Initial positions from fractional coords
  TOPO_NODES.forEach(n => {
    topoPos[n.id] = {
      x: n.xFrac * W - 30,
      y: n.yFrac * H - 36
    };
  });

  // Render nodes
  TOPO_NODES.forEach(n => topoCreateNode(n, canvas, H));

  // Draw connections
  topoRedraw();

  // Fit all nodes inside the visible canvas area
  rescaleNodesToCanvas();
  topoRedraw();

  // BACK button in the sub-bar
  const backBtn = document.getElementById('topo-back-btn');
  if (backBtn) backBtn.addEventListener('click', closeTopology);

  document.addEventListener('mousemove', topoDragMove);
  document.addEventListener('mouseup',   topoDragStop);

  // Rescale + redraw on resize
  window.addEventListener('resize', () => {
    rescaleNodesToCanvas();
    topoRedraw();
  });
}

// ── Node creation ────────────────────────────────────────────────────────────

function topoCreateNode(n, canvas, H) {
  const c   = TOPO_COLORS[n.color] || '#fff';
  const sz  = n.isHost ? 62 : 48;   // +20% — Änderung 4
  const fsz = n.isHost ? 20 : 14;
  const bw  = n.isHost ? 2  : 1.5;
  // Outer ring tint (alpha 0.06 ≈ hex 0F)
  const ringTint = c.length === 7 ? c + '0F' : c;

  const el = document.createElement('div');
  el.id           = `topo-node-${n.id}`;
  el.className    = 'topo-node';
  el.dataset.id   = n.id;
  el.style.left   = topoPos[n.id].x + 'px';
  el.style.top    = topoPos[n.id].y + 'px';

  const inner = document.createElement('div');
  inner.className = 'topo-node__inner';

  const circle = document.createElement('div');
  circle.className     = 'topo-node__circle';
  circle.style.width   = sz + 'px';
  circle.style.height  = sz + 'px';
  circle.style.border  = bw + 'px solid ' + c;
  circle.style.color   = c;
  circle.style.fontSize = fsz + 'px';
  circle.style.boxShadow = '0 0 0 4px ' + ringTint;
  circle.textContent   = n.icon;
  inner.appendChild(circle);

  const label = document.createElement('div');
  label.className = 'topo-node__label';
  label.style.color = c;
  label.appendChild(document.createTextNode(n.label));
  if (n.sublabel) {
    label.appendChild(document.createElement('br'));
    const sub = document.createElement('span');
    sub.className   = 'topo-node__sublabel';
    sub.textContent = n.sublabel;
    label.appendChild(sub);
  }
  inner.appendChild(label);
  el.appendChild(inner);

  el.addEventListener('click',     () => topoShowPanel(n));
  el.addEventListener('mousedown', e => topoStartDrag(e, n.id, n.zone, H));

  canvas.appendChild(el);
}

// ── Drag ─────────────────────────────────────────────────────────────────────

function topoStartDrag(e, id, zone, H) {
  e.preventDefault();
  const canvas = document.getElementById('topo-canvas');
  const rect   = canvas.getBoundingClientRect();
  topoDrag = {
    id, zone, H, rect,
    ox: e.clientX - topoPos[id].x - rect.left,
    oy: e.clientY - topoPos[id].y - rect.top
  };
  const el = document.getElementById(`topo-node-${id}`);
  if (el) el.classList.add('topo-node--dragging');
}

function topoDragMove(e) {
  if (!topoDrag) return;
  const { id, zone, H, ox, oy, rect } = topoDrag;
  let x = e.clientX - rect.left - ox;
  let y = e.clientY - rect.top  - oy;
  const W   = rect.width;
  const mid = H / 2;

  x = Math.max(0, Math.min(W - 72, x));
  y = Math.max(0, Math.min(H - 80, y));
  if (zone === 'life') y = Math.min(y, mid - 80);
  if (zone === 'soc')  y = Math.max(y, mid + 8);

  topoPos[id] = { x, y };
  const el = document.getElementById(`topo-node-${id}`);
  if (el) {
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }
  topoRedraw();
}

function topoDragStop() {
  if (!topoDrag) return;
  const el = document.getElementById(`topo-node-${topoDrag.id}`);
  if (el) el.classList.remove('topo-node--dragging');
  topoDrag = null;
}

// ── SVG connections ──────────────────────────────────────────────────────────

function topoRedraw() {
  const svg = document.getElementById('topo-svg');
  if (!svg) return;

  // Clear
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // <defs> with arrow marker
  const defs   = document.createElementNS(SVG_NS, 'defs');
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', 'ta');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth',  '5');
  marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto-start-reverse');
  const mp = document.createElementNS(SVG_NS, 'path');
  mp.setAttribute('d', 'M2 1L8 5L2 9');
  mp.setAttribute('fill', 'none');
  mp.setAttribute('stroke-width', '1.5');
  mp.setAttribute('stroke-linecap', 'round');
  mp.setAttribute('stroke-linejoin', 'round');
  mp.setAttribute('stroke', 'context-stroke');
  marker.appendChild(mp);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Internet → router (animated)
  const canvas = document.getElementById('topo-canvas');
  const ie     = document.getElementById('topo-internet');
  if (ie && canvas) {
    const cr = canvas.getBoundingClientRect();
    const ir = ie.getBoundingClientRect();
    const ix = ir.left - cr.left + ir.width  / 2;
    const iy = ir.top  - cr.top  + ir.height * 0.35;
    const rp = topoPos['router'];
    if (rp) topoPath(svg, ix, iy, rp.x + 26, rp.y + 26, '#ffd600', false, true);
  }

  // Node-to-node connections
  TOPO_NODES.forEach(n => {
    n.connections.forEach(tid => {
      const sp = topoPos[n.id];
      const dp = topoPos[tid];
      if (!sp || !dp) return;
      const isMonitoring = n.id === 'grafana';
      const isIso = ['kali','targets'].includes(n.id) || ['kali','targets'].includes(tid);
      const color = isIso              ? '#ff3b3b'
                  : n.color === 'purple' ? '#c084fc'
                  : n.color === 'cyan'   ? '#00e5ff'
                  :                        '#39ff14';
      topoPath(svg, sp.x + 26, sp.y + 26, dp.x + 26, dp.y + 26, color, isIso, false, isMonitoring);
    });
  });
}

function topoPath(svg, x1, y1, x2, y2, color, dashed, animated, isMonitoring) {
  const mx = (x1 + x2) / 2;
  const d  = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;

  const base = document.createElementNS(SVG_NS, 'path');
  base.setAttribute('d',              d);
  base.setAttribute('fill',           'none');
  base.setAttribute('stroke',         color);
  base.setAttribute('stroke-width',   '0.75');   // dünner — Änderung 3

  if (isMonitoring) {
    base.setAttribute('stroke-opacity', '0.12');
    base.setAttribute('stroke-dasharray', '2 6');
  } else {
    base.setAttribute('stroke-opacity', '0.25');   // dezenter — Änderung 4
    if (dashed) base.setAttribute('stroke-dasharray', '4 4');
  }
  svg.appendChild(base);

  // Internet → router gets the slow "topo-path-flow" pulse
  if (animated) {
    const flow = document.createElementNS(SVG_NS, 'path');
    flow.setAttribute('d',              d);
    flow.setAttribute('fill',           'none');
    flow.setAttribute('stroke',         color);
    flow.setAttribute('stroke-width',   '1.5');
    flow.setAttribute('stroke-opacity', '0.6');
    flow.setAttribute('stroke-dasharray', '4 8');
    flow.classList.add('topo-path-flow');   // CSS-class animation (CSP-safe)
    svg.appendChild(flow);
  }

  // Animated dataflow overlay for normal connections (skip dashed/monitoring)
  if (!dashed && !isMonitoring && !animated) {
    const flow = document.createElementNS(SVG_NS, 'path');
    flow.setAttribute('d',              d);
    flow.setAttribute('fill',           'none');
    flow.setAttribute('stroke',         color);
    flow.setAttribute('stroke-width',   '1');
    flow.setAttribute('stroke-opacity', '0.55');   // präsenter — Änderung 4
    flow.setAttribute('stroke-dasharray', '3 12');
    flow.classList.add('topo-flow-line');
    // Random delay so lines don't pulse in sync
    flow.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';
    svg.appendChild(flow);
  }
}

// ── Side panel ───────────────────────────────────────────────────────────────

function topoShowPanel(n) {
  const panel = document.getElementById('topo-side-panel');
  if (!panel) return;
  const c = TOPO_COLORS[n.color] || '#fff';
  const wasOpen = panel.classList.contains('is-open');

  while (panel.firstChild) panel.removeChild(panel.firstChild);

  const inner = document.createElement('div');
  inner.className = 'topo-panel-inner';

  // Header: relative container for the absolutely-positioned close button
  const header = document.createElement('div');
  header.className = 'topo-panel-node-header';

  // Close button — absolute inside header so it's never covered by the badge
  const close = document.createElement('button');
  close.id   = 'topo-panel-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '✕';
  close.addEventListener('click', topoClosePanel);
  header.appendChild(close);

  const dot = document.createElement('div');
  dot.className = 'topo-panel-dot';
  dot.style.background = c;
  header.appendChild(dot);

  const text = document.createElement('div');
  text.className = 'topo-panel-node-text';
  const name = document.createElement('div');
  name.className = 'topo-panel-node-name';
  name.style.color = c;
  name.textContent = n.label;
  text.appendChild(name);
  if (n.sublabel) {
    const sub = document.createElement('div');
    sub.className = 'topo-panel-node-sub';
    sub.textContent = n.sublabel;
    text.appendChild(sub);
  }
  header.appendChild(text);

  const status = document.createElement('span');
  status.className = 'topo-panel-status';
  status.textContent = 'PLANNED';
  header.appendChild(status);

  inner.appendChild(header);

  // Fields
  [
    ['TYPE',  n.type],
    ['OS',    n.os],
    ['PORTS', n.ports],
    ['INFO',  n.desc]
  ].forEach(([k, v]) => inner.appendChild(_topoPanelField(k, v)));

  panel.appendChild(inner);
  panel.classList.add('is-open');

  // After the slide-in transition: rescale nodes to the new (smaller)
  // canvas width so nothing gets clipped, then redraw the SVG paths.
  if (!wasOpen) {
    setTimeout(() => {
      rescaleNodesToCanvas();
      topoRedraw();
    }, 320);
  }
}

function topoClosePanel() {
  const panel = document.getElementById('topo-side-panel');
  if (panel && panel.classList.contains('is-open')) {
    panel.classList.remove('is-open');
    setTimeout(() => {
      rescaleNodesToCanvas();
      topoRedraw();
    }, 320);
  }
}

// ── Re-position all nodes from xFrac/yFrac against current canvas size ──────

function rescaleNodesToCanvas() {
  const canvas = document.getElementById('topo-canvas');
  if (!canvas) return;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return;
  const pad = 32;

  TOPO_NODES.forEach(n => {
    const x = pad + n.xFrac * (W - pad * 2) - 30;
    const y = pad + n.yFrac * (H - pad * 2) - 36;
    topoPos[n.id] = { x, y };
    const el = document.getElementById(`topo-node-${n.id}`);
    if (el) {
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    }
  });

  // Internet-Entry stays anchored vertically at 50%
  const ie = document.getElementById('topo-internet');
  if (ie) ie.style.top = '50%';
}

function _topoPanelField(label, value) {
  const field = document.createElement('div');
  field.className = 'topo-panel-field';
  const k = document.createElement('div');
  k.className = 'topo-panel-key';
  k.textContent = label;
  field.appendChild(k);
  const v = document.createElement('div');
  v.className = 'topo-panel-val';
  v.textContent = value;
  field.appendChild(v);
  return field;
}
