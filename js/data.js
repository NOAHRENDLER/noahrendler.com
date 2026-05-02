/**
 * DATA — Single source of truth for all site content.
 *
 * Rules:
 *   - No HTML strings in text fields. The renderer builds DOM via createElement.
 *   - All content must exist in both 'de' and 'en'.
 *   - Placeholders are marked as {{PLACEHOLDER_DESCRIPTION}} and must be
 *     replaced before deployment (see docs/06_DEPLOYMENT.md checklist).
 *   - IDs must be unique within their category (validated in tests/unit/data.test.js).
 *   - severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
 *   - caseStatus: 'open' | 'in-progress' | 'closed'
 *   - proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
 */

const DATA = Object.freeze({

  meta: Object.freeze({
    version: '1.0.0',
    lastUpdated: '2026-04-14'
  }),

  // ─────────────────────────────────────────────
  // DEUTSCH (default)
  // ─────────────────────────────────────────────
  de: Object.freeze({

    // ── Section data (legacy section-based renderer) ─────────
    status: Object.freeze({
      name: 'Noah Rendler',
      title: 'Cybersecurity Student',
      location: 'Raum Stuttgart',
      specializations: Object.freeze([
        'SOC Analysis',
        'Incident Response',
        'Security Engineering'
      ]),
      status: 'SUCHE BACHELORARBEIT',
      bio: 'Cybersecurity-Student im Raum Stuttgart mit Fokus auf Security Operations, Incident Response und Security Engineering. Aktiv auf der Suche nach einer Bachelorarbeit-Stelle im Security-Bereich.'
    }),

    threatIntel: Object.freeze([
      Object.freeze({
        id: 'TI-001',
        date: '2026-04-01',
        severity: 'high',
        category: 'research',
        title: 'Kritische Schwachstelle in OpenSSH entdeckt',
        summary: 'Eine neu entdeckte Schwachstelle im OpenSSH-Daemon erlaubt unter bestimmten Bedingungen Remote Code Execution ohne Authentifizierung.',
        tags: Object.freeze(['SSH', 'RCE', 'CVE']),
        link: null
      })
    ]),

    cases: Object.freeze([
      Object.freeze({
        id: 'CASE-001',
        status: 'open',
        title: '{{PROJEKTNAME}}',
        description: '{{BESCHREIBUNG}}',
        tech: Object.freeze(['{{TECH}}']),
        started: '{{DATUM}}',
        closed: null,
        link: null
      })
    ]),

    skills: Object.freeze([
      // --- Netzwerk & Analyse ---
      Object.freeze({ tool: 'Nmap', category: 'Netzwerk & Analyse', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Wireshark', category: 'Netzwerk & Analyse', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Netcat', category: 'Netzwerk & Analyse', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'tcpdump', category: 'Netzwerk & Analyse', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Shodan', category: 'Netzwerk & Analyse', proficiency: 'intermediate', years: null }),

      // --- Offensive Security ---
      Object.freeze({ tool: 'Burp Suite', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Metasploit', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Gobuster', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Hydra', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'John the Ripper', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Hashcat', category: 'Offensive Security', proficiency: 'intermediate', years: null }),

      // --- Defensive & SOC ---
      Object.freeze({ tool: 'Elastic / ELK', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Wazuh', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Suricata', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Yara', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Google SecOps', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Microsoft Sentinel', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Defender for Endpoint', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),

      // --- Schwachstellen & Threat Intel ---
      Object.freeze({ tool: 'Nessus', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'OpenVAS', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Nikto', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Maltego', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VirusTotal', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'AbuseIPDB', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'MITRE ATT&CK', category: 'Schwachstellen & Threat Intel', proficiency: 'intermediate', years: null }),

      // --- Scripting & Protokolle ---
      Object.freeze({ tool: 'Python', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Bash', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'SQL', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'TCP/IP', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'DNS / DHCP', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'HTTP/HTTPS / TLS', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VPN / Firewalls', category: 'Scripting & Protokolle', proficiency: 'intermediate', years: null }),

      // --- Infrastruktur & Enterprise ---
      Object.freeze({ tool: 'Linux (Kali/Ubuntu)', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Windows', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Docker', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VMware', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Proxmox', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Git', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Intune / Entra ID', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Jira / Confluence', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'ServiceNow', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Lookout', category: 'Infrastruktur & Enterprise', proficiency: 'intermediate', years: null }),
    ]),

    contact: Object.freeze({
      email: 'rendlernoah@protonmail.com',
      linkedin: 'https://linkedin.com/in/noah-rendler',
      github: 'https://github.com/NOAHRENDLER',
      formAction: 'https://formspree.io/f/meevkole'
    }),

    profile: Object.freeze({
      name: 'Noah Rendler',
      title: 'Cybersecurity Student',
      location: 'Raum Stuttgart',
      specializations: Object.freeze([
        'SOC Analysis',
        'Incident Response',
        'Security Engineering'
      ]),
      status: 'SUCHE BACHELORARBEIT',
      shortBio: 'IT-Sicherheit-Student mit Fokus auf die defensive Seite der Security — Angriffe erkennen, verstehen, abwehren. Aktuell auf der Suche nach einer Bachelorarbeit im Blue-Team-Bereich.',
      labels: Object.freeze({
        identification: 'IDENTIFIKATION',
        aboutMe: 'ÜBER MICH',
        myStory: 'MEINE GESCHICHTE',
        status: 'STATUS',
        education: 'AUSBILDUNG',
        languages: 'SPRACHEN',
        eduTitle: 'B.Eng. IT-Sicherheit',
        eduSub: 'Hochschule Esslingen · 2023 – heute',
        eduNote: 'Gewechselt von Technischer Informatik nach 4 Semestern',
        langRows: Object.freeze([
          Object.freeze({ key: 'DEUTSCH', val: 'Muttersprache' }),
          Object.freeze({ key: 'ENGLISCH', val: 'Fließend' })
        ]),
        clearance: 'B.SC. Y3',
        available: 'VERFÜGBAR'
      }),
      bio: 'Ich studiere IT-Sicherheit an der Hochschule Esslingen und interessiere mich besonders für die defensive Seite der Security — also dafür, Angriffe zu erkennen, zu verstehen und darauf zu reagieren. Was mich antreibt: der Wunsch, etwas Sinnvolles zu schützen. Neben dem Studium baue ich eigene Labs auf, probiere Dinge auf TryHackMe aus und arbeite an eigenen Projekten. Aktuell suche ich eine Bachelorarbeit, bei der ich genau das tun kann.',
      expandedBio: 'Angefangen habe ich mit Technischer Informatik — Security hat mich dort von Anfang an am meisten interessiert, auch wenn es nur ein Randthema war. Als die Hochschule Esslingen den Studiengang IT-Sicherheit eingeführt hat, war die Entscheidung einfach: nach vier Semestern gewechselt, ohne lange nachzudenken. Seitdem habe ich meinen Fokus bewusst auf die defensive Seite gelegt — also darauf, wie Angriffe erkannt, analysiert und abgewehrt werden. Was mich am Blue Team-Ansatz fasziniert, ist die Kombination aus technischem Tiefgang und dem Gefühl, dass die Arbeit einen echten Unterschied macht. Systeme und Menschen zu schützen ist für mich kein abstraktes Ziel, sondern der Grund, warum ich in diesem Bereich arbeiten will. Ich lerne am liebsten selbständig und strukturiert — durch eigene Projekte, ein kleines Heimlabor und Plattformen wie TryHackMe. Außerhalb der IT halte ich den Kopf frei mit Sport und Musik.'
    }),

    cv: Object.freeze([
      Object.freeze({ current: true,  date: 'Sept. 2023 – heute', title: 'B.Eng. IT-Sicherheit', subtitle: 'Hochschule Esslingen' }),
      Object.freeze({ current: false,  date: 'Aug. 2025 – Jan. 2026', title: 'Praktikant im Vodafone Business Security Operations Center', subtitle: 'Vodafone GmbH' }),
      Object.freeze({ current: false,  date: 'Jan. 2025 – Jul. 2025', title: 'Werkstudent im Bereich Manufacturing IT - Security', subtitle: 'Robert Bosch GmbH' }),
      Object.freeze({ current: false,  date: 'Nov. 2023 – Dez. 2024', title: 'Werkstudent im Bereich Manufacturing IT - Infrastruktur', subtitle: 'Robert Bosch GmbH' }),
      Object.freeze({ current: false, date: 'Sept. 2021 - Aug. 2023',    title: 'B.Eng. Technische Informatik', subtitle: 'Hochschule Esslingen' }),
      Object.freeze({ current: false,  date: 'Sept. 2020 – Aug. 2021', title: 'Bundesfreiwilligendienst', subtitle: 'Technisches Hilfswerk' })
    ]),

    certs: Object.freeze([
      Object.freeze({ abbr: 'SC-200',   name: 'Security Operations Analyst Associate',   issuer: 'Microsoft',       year: '2026' }),
      Object.freeze({ abbr: 'Cribl',  name: 'Cribl Certified User',  issuer: 'Cribl',     year: '2025' }),
      Object.freeze({ abbr: 'Cribl', name: 'Cribl Certified Admin - Stream',      issuer: 'Cribl', year: '2025' }),
      Object.freeze({ abbr: 'Cribl', name: 'Cribl Certified Admin - Edge',      issuer: 'Cribl', year: '2025' }),
      Object.freeze({ abbr: 'Cisco', name: 'Cybersecurity Operations Fundamentals Specialization',      issuer: 'Cisco', year: '2024' }),
      Object.freeze({ abbr: 'InfoSec', name: 'Python for Cybersecurity',      issuer: 'InfoSec', year: '2023' }),
      Object.freeze({ abbr: 'Google', name: 'Google Cybersecurity Certificate',      issuer: 'Google', year: '2023' })
    ]),

    threatFeed: Object.freeze([
      Object.freeze({ title: 'Microsoft Defender Zero-Days Actively Exploited',                         source: 'The Hacker News',         date: '2026-04-18', url: 'https://thehackernews.com/2026/04/three-microsoft-defender-zero-days.html',                                                                                                                            tags: Object.freeze(['zero-day', 'Microsoft', 'exploit']) }),
      Object.freeze({ title: 'Microsoft Patches SharePoint Zero-Day and 160 Other Vulnerabilities',    source: 'SecurityWeek',            date: '2026-04-16', url: 'https://www.securityweek.com/microsoft-patches-exploited-sharepoint-zero-day-and-160-other-vulnerabilities/',                                                                                 tags: Object.freeze(['patch-tuesday', 'zero-day', 'SharePoint']) }),
      Object.freeze({ title: 'CISA Adds 6 Exploited Flaws in Fortinet, Microsoft, Adobe',             source: 'The Hacker News',         date: '2026-04-14', url: 'https://thehackernews.com/2026/04/cisa-adds-6-known-exploited-flaws-in.html',                                                                                                                          tags: Object.freeze(['CISA', 'KEV', 'Fortinet']) }),
      Object.freeze({ title: 'Supply-Chain Attacks Hit Trivy, Axios, LiteLLM',                        source: 'DIESEC',                  date: '2026-04-10', url: 'https://diesec.com/2026/04/top-5-cybersecurity-news-stories-april-10-2026/',                                                                                                                        tags: Object.freeze(['supply-chain', 'DevOps', 'CI/CD']) }),
      Object.freeze({ title: 'Ukraine CERT: AI-Generated Sites Used to Deliver Malware',              source: 'The Hacker News',         date: '2026-04-16', url: 'https://thehackernews.com/',                                                                                                                                                                         tags: Object.freeze(['APT', 'AI', 'malware']) }),
      Object.freeze({ title: 'AI Cybersecurity 2026: Insights from 1,500 Leaders',                    source: 'Cloud Security Alliance', date: '2026-04-02', url: 'https://cloudsecurityalliance.org/blog/2026/04/02/the-state-of-ai-cybersecurity-2026-unveiling-insights-from-over-1-500-security-leaders',                                                         tags: Object.freeze(['AI', 'report', 'trends']) }),
      Object.freeze({ title: 'IBM X-Force Threat Intelligence Index 2026',                            source: 'IBM',                     date: '2026-03-11', url: 'https://www.ibm.com/think/insights/more-2026-cyberthreat-trends',                                                                                                                                    tags: Object.freeze(['report', 'AI', 'supply-chain']) }),
      Object.freeze({ title: 'Ransomware Hits Water Treatment Plant in North Dakota',                  source: 'The Edvocate',            date: '2026-04-07', url: 'https://www.theedadvocate.org/surge-in-cybersecurity-incidents-april-2026-highlights-major-threats/',                                                                                              tags: Object.freeze(['ransomware', 'critical-infrastructure', 'ICS']) }),
      Object.freeze({ title: 'AI-Driven Threats Force 92% of Orgs to Upgrade Defenses',               source: 'Kiteworks',               date: '2026-02-25', url: 'https://www.kiteworks.com/cybersecurity-risk-management/ai-cybersecurity-2026-trends-report/',                                                                                                       tags: Object.freeze(['AI', 'defense', 'trends']) }),
      Object.freeze({ title: 'Agentic AI: New Insider Threat Class for 2026',                         source: 'Harvard Business Review', date: '2025-12-19', url: 'https://hbr.org/sponsored/2025/12/6-cybersecurity-predictions-for-the-ai-economy-in-2026',                                                                                                         tags: Object.freeze(['AI', 'agentic', 'predictions']) })
    ]),

    projects: Object.freeze([
      Object.freeze({
        id: 'soc-portfolio',
        name: 'SOC Portfolio Website',
        status: 'active',
        date: '2026-04',
        summary: 'Dieses Portfolio — gebaut mit HTML/CSS/JS im SIEM-Stil.',
        description: 'Interaktives Portfolio im SOC/SIEM-Dashboard-Stil. Reine Frontend-Umsetzung ohne Framework, bilingual (DE/EN), mit Tile-Navigation, mehrsprachigen Inhalten und automatisierten Unit-Tests.',
        tools: Object.freeze(['HTML', 'CSS', 'JavaScript', 'Vitest']),
        links: Object.freeze([{ label: '→ GitHub', url: 'https://github.com/NoahRendler/soc-portfolio' }])
      }),
      Object.freeze({
        id: 'opensource-soc',
        name: 'Open-Source SOC',
        status: 'completed',
        date: '2025-12',
        summary: 'Wazuh + ELK Stack für ein kleines KMU-Netzwerk.',
        description: 'Aufbau eines vollständigen, kostenfreien SOC-Stacks auf Basis von Wazuh (SIEM/EDR), Elasticsearch, Logstash und Kibana. Eingesetzt für ein kleines Unternehmensnetzwerk mit 20 Endpoints.',
        tools: Object.freeze(['Wazuh', 'Elastic / ELK', 'Docker', 'Linux']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'homelab',
        name: 'Homelab',
        status: 'planned',
        date: '2026-06',
        summary: 'Physisches Homelab mit Proxmox für Security-Experimente.',
        description: 'Aufbau eines dedizierten physischen Homelabs auf Basis von Proxmox VE. Geplante Umgebungen: SIEM, Netzwerksegmentierung, Vulnerable VMs für CTF-ähnliche Übungen.',
        tools: Object.freeze(['Proxmox', 'Linux', 'VMware']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'homelab-soc',
        name: 'Homelab SOC',
        status: 'planned',
        date: '2026-07',
        summary: 'Wazuh & ELK auf eigenem Proxmox-Cluster.',
        description: 'Betrieb eines vollständigen SOC-Setups im eigenen Homelab — Wazuh als SIEM/EDR, ELK für Log-Analyse, automatisierte Alert-Pipelines.',
        tools: Object.freeze(['Wazuh', 'Elastic / ELK', 'Proxmox', 'Python']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'ssh-bruteforce-ml',
        name: 'SSH Brute-Force Erkennung (ML)',
        status: 'planned',
        date: '2026-08',
        summary: 'ML-basierte Anomalie-Erkennung für SSH-Login-Muster.',
        description: 'Entwicklung eines Bachelorarbeit-Prototyps: ML-Modell zur Erkennung von SSH-Brute-Force-Angriffen auf Basis von Auth-Log-Daten. Fokus auf False-Positive-Rate und Realzeit-Klassifikation.',
        tools: Object.freeze(['Python', 'scikit-learn', 'Wazuh', 'Elastic / ELK']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'threat-intel-platform',
        name: 'Threat Intelligence Platform',
        status: 'planned',
        date: '2026-09',
        summary: 'Eigenes TI-Aggregations-Tool für IOC-Enrichment.',
        description: 'Aufbau einer leichtgewichtigen Threat-Intelligence-Plattform: Aggregation von IOCs aus öffentlichen Feeds (MISP, AbuseIPDB, VirusTotal), Enrichment-Pipeline und Dashboard.',
        tools: Object.freeze(['Python', 'MISP', 'VirusTotal', 'AbuseIPDB', 'Docker']),
        links: Object.freeze([])
      })
    ]),

    uptime: Object.freeze({
      days: Object.freeze([
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'partial' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'down' }),
        Object.freeze({ status: 'up' })
      ]),
      responseMs: 47,
      lastDeploy: '3d',
      uptimePercent: '99.7',
      sparkLabel: 'ANTWORTZEIT // 24H',
      logEntries: Object.freeze([
        Object.freeze({ time: '19:14:02',  color: '#39ff14',       msg: 'Deploy v1.4.2 — erfolgreich' }),
        Object.freeze({ time: '16:33:47',  color: 'var(--accent)', msg: 'SSL-Zertifikat erneuert' }),
        Object.freeze({ time: '11:02:19',  color: '#ffd600',       msg: 'Antwortzeit-Spike → 89ms (behoben)' }),
        Object.freeze({ time: 'gestern',   color: '#39ff14',       msg: 'Uptime-Check bestanden — 100%' })
      ])
    }),

    radar: Object.freeze({
      toolsLabel: 'TOOLS',
      axes: Object.freeze([
        Object.freeze({ label: 'NETZWERK',    value: 6, color: '#00e5ff', tools: Object.freeze(['Nmap','Wireshark','Netcat','tcpdump','Shodan']) }),
        Object.freeze({ label: 'OFFENSIVE',  value: 5, color: '#ffd600', tools: Object.freeze(['Burp Suite','Metasploit','Gobuster','Hydra','John the Ripper','Hashcat']) }),
        Object.freeze({ label: 'DEFENSIVE',  value: 7, color: '#39ff14', tools: Object.freeze(['Elastic/ELK','Wazuh','Suricata','Yara','Google SecOps','Sentinel','Defender']) }),
        Object.freeze({ label: 'VULN/INTEL', value: 6, color: '#ec4899', tools: Object.freeze(['Nessus','OpenVAS','Nikto','Maltego','VirusTotal','AbuseIPDB','MITRE ATT&CK']) }),
        Object.freeze({ label: 'SCRIPTING',  value: 6, color: '#c084fc', tools: Object.freeze(['Python','Bash','SQL','TCP/IP','DNS/DHCP','HTTP/TLS','VPN/Firewalls']) }),
        Object.freeze({ label: 'INFRA',      value: 8, color: '#f97316', tools: Object.freeze(['Linux','Windows','Docker','VMware','Proxmox','Git','Intune/Entra ID','Jira','ServiceNow']) })
      ])
    }),

    ui: Object.freeze({
      topbar: Object.freeze({
        title: 'SOC // PORTFOLIO',
        statusLabel: 'SUCHE BACHELORARBEIT'
      }),

      nav: Object.freeze({
        status:     'STATUS',
        threatIntel: 'THREAT INTEL',
        skills:     'SKILLS',
        cases:      'CASES',
        contact:    'KONTAKT'
      }),

      sections: Object.freeze({
        status:     'STATUS PANEL',
        threatIntel: 'THREAT INTELLIGENCE',
        skills:     'SKILLS MATRIX',
        cases:      'AKTIVE CASES',
        contact:    'KONTAKT'
      }),

      threatIntel: Object.freeze({
        noEntries: 'Keine Einträge vorhanden.',
        categoryLabels: Object.freeze({
          project:       'PROJECT',
          ctf:           'CTF',
          research:      'RESEARCH',
          certification: 'CERT'
        })
      }),

      skillsTable: Object.freeze({
        tool:        'TOOL',
        category:    'KATEGORIE',
        proficiency: 'KÖNNEN',
        years:       'JAHRE'
      }),

      cases: Object.freeze({
        noEntries: 'Keine Cases vorhanden.',
        statusLabels: Object.freeze({
          'open': 'OPEN',
          'in-progress': 'IN PROGRESS',
          'closed': 'CLOSED',
          'completed': 'ABGESCHLOSSEN',
          'active': 'AKTIV',
          'planned': 'GEPLANT'
        }),
        labelStarted: 'Gestartet',
        labelClosed: 'Abgeschlossen',
        linkLabel: '→ GitHub',
        descriptionLabel: 'BESCHREIBUNG',
        toolsLabel: 'TOOLS',
        linksLabel: 'LINKS'
      }),
      contact: Object.freeze({
        emailLabel: 'E-MAIL',
        linkedinLabel: 'LINKEDIN',
        githubLabel: 'GITHUB',
        formTitle: 'NACHRICHT SENDEN',
        nameLabel: 'Name',
        emailFieldLabel: 'E-Mail',
        messageLabel: 'Nachricht',
        composeLabel: 'NACHRICHT SENDEN',
        senderIdLabel: 'ABSENDER',
        returnAddressLabel: 'E-MAIL ADRESSE',
        messagePayloadLabel: 'NACHRICHT',
        submitLabel: '\u25B6 SENDEN',
        contactVectorsLabel: 'KONTAKTKANÄLE',
        channelSecureLabel: 'KANAL GESICHERT',
        channelSecureSub: 'TLS 1.3 // AES-256-GCM',
        validation: Object.freeze({
          nameRequired: 'Name ist erforderlich.',
          emailInvalid: 'Ungültige E-Mail-Adresse.',
          messageRequired: 'Nachricht ist erforderlich (max. 1000 Zeichen).',
          tooManyRequests: 'Zu viele Anfragen. Bitte warte einen Moment.',
          sending: 'TRANSMITTING...',
          success: 'TRANSMISSION SUCCESSFUL — SECURE CHANNEL CONFIRMED',
          error: 'TRANSMISSION FAILED — RETRY'
        })
      }),

      // ── Tile header labels (grid) ────────────────────────────
      tiles: Object.freeze({
        analystProfile:  'ANALYST PROFIL',
        networkTopology: 'NETWORK TOPOLOGY',
        threatFeed:      'THREAT INTEL FEED',
        projects:        'PROJEKTE',
        certifications:  'ZERTIFIZIERUNGEN',
        skillsMatrix:    'SKILLS MATRIX',
        careerTimeline:  'CAREER TIMELINE',
        systemMonitor:   'SYSTEM MONITOR',
        threatRadar:     'THREAT RADAR',
        secureChannel:   'SECURE CHANNEL'
      }),

      expandHint: '▶ ERWEITERN',

      // ── System Status Bar items ──────────────────────────────
      sysBar: Object.freeze([
        Object.freeze({ label: 'STATUS',       value: 'ONLINE',     dot: 'green' }),
        Object.freeze({ label: 'CLEARANCE',    value: 'B.SC. Y3',   dot: 'cyan'  }),
        Object.freeze({ label: 'AVAILABILITY', value: 'IMMEDIATE',  dot: 'green' }),
        Object.freeze({ label: 'SECTOR',       value: 'STUTTGART',  dot: 'amber' })
      ])
    })
  }),

  // ─────────────────────────────────────────────
  // ENGLISH
  // ─────────────────────────────────────────────
  en: Object.freeze({

    // ── Section data (legacy section-based renderer) ─────────
    status: Object.freeze({
      name: 'Noah Rendler',
      title: 'Cybersecurity Student',
      location: 'Stuttgart Area',
      specializations: Object.freeze([
        'SOC Analysis',
        'Incident Response',
        'Security Engineering'
      ]),
      status: 'SEEKING PLACEMENT',
      bio: 'Cybersecurity student in the Stuttgart area, focused on Security Operations, Incident Response, and Security Engineering. Actively seeking a bachelor thesis placement in the security domain.'
    }),

    threatIntel: Object.freeze([
      Object.freeze({
        id: 'TI-001',
        date: '2026-04-01',
        severity: 'high',
        category: 'research',
        title: 'Critical Vulnerability Discovered in OpenSSH',
        summary: 'A newly discovered vulnerability in the OpenSSH daemon allows remote code execution under certain conditions without authentication.',
        tags: Object.freeze(['SSH', 'RCE', 'CVE']),
        link: null
      })
    ]),

    cases: Object.freeze([
      Object.freeze({
        id: 'CASE-001',
        status: 'open',
        title: '{{PROJECT NAME}}',
        description: '{{DESCRIPTION}}',
        tech: Object.freeze(['{{TECH}}']),
        started: '{{DATE}}',
        closed: null,
        link: null
      })
    ]),

    skills: Object.freeze([
      // --- Network & Analysis ---
      Object.freeze({ tool: 'Nmap', category: 'Network & Analysis', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Wireshark', category: 'Network & Analysis', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Netcat', category: 'Network & Analysis', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'tcpdump', category: 'Network & Analysis', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Shodan', category: 'Network & Analysis', proficiency: 'intermediate', years: null }),

      // --- Offensive Security ---
      Object.freeze({ tool: 'Burp Suite', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Metasploit', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Gobuster', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Hydra', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'John the Ripper', category: 'Offensive Security', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Hashcat', category: 'Offensive Security', proficiency: 'intermediate', years: null }),

      // --- Defensive & SOC ---
      Object.freeze({ tool: 'Elastic / ELK', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Wazuh', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Suricata', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Yara', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Google SecOps', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Microsoft Sentinel', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Defender for Endpoint', category: 'Defensive & SOC', proficiency: 'intermediate', years: null }),

      // --- Vulnerability & Threat Intel ---
      Object.freeze({ tool: 'Nessus', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'OpenVAS', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Nikto', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Maltego', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VirusTotal', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'AbuseIPDB', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'MITRE ATT&CK', category: 'Vuln & Threat Intel', proficiency: 'intermediate', years: null }),

      // --- Scripting & Protocols ---
      Object.freeze({ tool: 'Python', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Bash', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'SQL', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'TCP/IP', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'DNS / DHCP', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'HTTP/HTTPS / TLS', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VPN / Firewalls', category: 'Scripting & Protocols', proficiency: 'intermediate', years: null }),

      // --- Infrastructure & Enterprise ---
      Object.freeze({ tool: 'Linux (Kali/Ubuntu)', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Windows', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Docker', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'VMware', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Proxmox', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Git', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Intune / Entra ID', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Jira / Confluence', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'ServiceNow', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
      Object.freeze({ tool: 'Lookout', category: 'Infrastructure & Enterprise', proficiency: 'intermediate', years: null }),
    ]),

    contact: Object.freeze({
      email: 'rendlernoah@protonmail.com',
      linkedin: 'https://linkedin.com/in/noah-rendler',
      github: 'https://github.com/NOAHRENDLER',
      formAction: 'https://formspree.io/f/meevkole'
    }),

    profile: Object.freeze({
      name: 'Noah Rendler',
      title: 'Cybersecurity Student',
      location: 'Stuttgart Area',
      specializations: Object.freeze([
        'SOC Analysis',
        'Incident Response',
        'Security Engineering'
      ]),
      status: 'SEEKING PLACEMENT',
      shortBio: 'IT Security student focused on the defensive side — detecting, understanding, and mitigating attacks. Currently looking for a bachelor thesis in the Blue Team space.',
      labels: Object.freeze({
        identification: 'IDENTIFICATION',
        aboutMe: 'ABOUT ME',
        myStory: 'MY STORY',
        status: 'STATUS',
        education: 'EDUCATION',
        languages: 'LANGUAGES',
        eduTitle: 'B.Eng. IT Security',
        eduSub: 'Hochschule Esslingen · 2023 – present',
        eduNote: 'Switched from Computer Engineering after 4 semesters',
        langRows: Object.freeze([
          Object.freeze({ key: 'GERMAN', val: 'Native' }),
          Object.freeze({ key: 'ENGLISH', val: 'Fluent' })
        ]),
        clearance: 'B.SC. Y3',
        available: 'AVAILABLE'
      }),
      bio: "I'm studying IT Security at Hochschule Esslingen with a particular focus on the defensive side — detecting, understanding, and responding to attacks. What drives me is the desire to protect something meaningful. Besides my studies, I build my own labs, practice on TryHackMe, and work on personal projects. I'm currently looking for a bachelor thesis where I can do exactly that.",
      expandedBio: "I started with Computer Engineering — Security interested me from the very beginning, even though it was only a peripheral topic. When Hochschule Esslingen introduced the IT Security degree program, the decision was easy: I switched after four semesters without much deliberation. Since then, I've deliberately focused on the defensive side — how attacks are detected, analyzed, and mitigated. What fascinates me about the Blue Team approach is the combination of technical depth and the feeling that the work makes a real difference. Protecting systems and people isn't an abstract goal for me — it's the reason I want to work in this field. I learn best independently and in a structured way — through personal projects, a small home lab, and platforms like TryHackMe. Outside of IT, I clear my head with sports and music."
    }),

    cv: Object.freeze([
      Object.freeze({ current: true,  date: 'Sept. 2023 – present', title: 'B.Eng. IT Security', subtitle: 'Hochschule Esslingen - University of Applied Sciences' }),
      Object.freeze({ current: false,  date: 'Aug. 2025 – Jan. 2026', title: 'Intern in Vodafone Business Security Operations Center', subtitle: 'Vodafone GmbH' }),
      Object.freeze({ current: false,  date: 'Jan. 2025 – Jul. 2025', title: 'Working Student in Manufacturing IT - Security', subtitle: 'Robert Bosch GmbH' }),
      Object.freeze({ current: false,  date: 'Nov. 2023 – Dec. 2024', title: 'Working Student in Manufacturing IT - Infrastructure', subtitle: 'Robert Bosch GmbH' }),
      Object.freeze({ current: false, date: 'Sept. 2021 - Aug. 2023',    title: 'B.Eng. Technical Computer Science', subtitle: 'Hochschule Esslingen - University of Applied Sciences' }),
      Object.freeze({ current: false,  date: 'Sept. 2020 – Aug. 2021', title: 'Federal Voluntary Service', subtitle: 'Federal Agency for Technical Relief' })
    ]),

    certs: Object.freeze([
      Object.freeze({ abbr: 'SC-200',   name: 'Security Operations Analyst Associate',   issuer: 'Microsoft',       year: '2026' }),
      Object.freeze({ abbr: 'Cribl',  name: 'Cribl Certified User',  issuer: 'Cribl',     year: '2025' }),
      Object.freeze({ abbr: 'Cribl', name: 'Cribl Certified Admin - Stream',      issuer: 'Cribl', year: '2025' }),
      Object.freeze({ abbr: 'Cribl', name: 'Cribl Certified Admin - Edge',      issuer: 'Cribl', year: '2025' }),
      Object.freeze({ abbr: 'Cisco', name: 'Cybersecurity Operations Fundamentals Specialization',      issuer: 'Cisco', year: '2024' }),
      Object.freeze({ abbr: 'InfoSec', name: 'Python for Cybersecurity',      issuer: 'InfoSec', year: '2023' }),
      Object.freeze({ abbr: 'Google', name: 'Google Cybersecurity Certificate',      issuer: 'Google', year: '2023' })
    ]),

    threatFeed: Object.freeze([
      Object.freeze({ title: 'Microsoft Defender Zero-Days Actively Exploited',                         source: 'The Hacker News',         date: '2026-04-18', url: 'https://thehackernews.com/2026/04/three-microsoft-defender-zero-days.html',                                                                                                                            tags: Object.freeze(['zero-day', 'Microsoft', 'exploit']) }),
      Object.freeze({ title: 'Microsoft Patches SharePoint Zero-Day and 160 Other Vulnerabilities',    source: 'SecurityWeek',            date: '2026-04-16', url: 'https://www.securityweek.com/microsoft-patches-exploited-sharepoint-zero-day-and-160-other-vulnerabilities/',                                                                                 tags: Object.freeze(['patch-tuesday', 'zero-day', 'SharePoint']) }),
      Object.freeze({ title: 'CISA Adds 6 Exploited Flaws in Fortinet, Microsoft, Adobe',             source: 'The Hacker News',         date: '2026-04-14', url: 'https://thehackernews.com/2026/04/cisa-adds-6-known-exploited-flaws-in.html',                                                                                                                          tags: Object.freeze(['CISA', 'KEV', 'Fortinet']) }),
      Object.freeze({ title: 'Supply-Chain Attacks Hit Trivy, Axios, LiteLLM',                        source: 'DIESEC',                  date: '2026-04-10', url: 'https://diesec.com/2026/04/top-5-cybersecurity-news-stories-april-10-2026/',                                                                                                                        tags: Object.freeze(['supply-chain', 'DevOps', 'CI/CD']) }),
      Object.freeze({ title: 'Ukraine CERT: AI-Generated Sites Used to Deliver Malware',              source: 'The Hacker News',         date: '2026-04-16', url: 'https://thehackernews.com/',                                                                                                                                                                         tags: Object.freeze(['APT', 'AI', 'malware']) }),
      Object.freeze({ title: 'AI Cybersecurity 2026: Insights from 1,500 Leaders',                    source: 'Cloud Security Alliance', date: '2026-04-02', url: 'https://cloudsecurityalliance.org/blog/2026/04/02/the-state-of-ai-cybersecurity-2026-unveiling-insights-from-over-1-500-security-leaders',                                                         tags: Object.freeze(['AI', 'report', 'trends']) }),
      Object.freeze({ title: 'IBM X-Force Threat Intelligence Index 2026',                            source: 'IBM',                     date: '2026-03-11', url: 'https://www.ibm.com/think/insights/more-2026-cyberthreat-trends',                                                                                                                                    tags: Object.freeze(['report', 'AI', 'supply-chain']) }),
      Object.freeze({ title: 'Ransomware Hits Water Treatment Plant in North Dakota',                  source: 'The Edvocate',            date: '2026-04-07', url: 'https://www.theedadvocate.org/surge-in-cybersecurity-incidents-april-2026-highlights-major-threats/',                                                                                              tags: Object.freeze(['ransomware', 'critical-infrastructure', 'ICS']) }),
      Object.freeze({ title: 'AI-Driven Threats Force 92% of Orgs to Upgrade Defenses',               source: 'Kiteworks',               date: '2026-02-25', url: 'https://www.kiteworks.com/cybersecurity-risk-management/ai-cybersecurity-2026-trends-report/',                                                                                                       tags: Object.freeze(['AI', 'defense', 'trends']) }),
      Object.freeze({ title: 'Agentic AI: New Insider Threat Class for 2026',                         source: 'Harvard Business Review', date: '2025-12-19', url: 'https://hbr.org/sponsored/2025/12/6-cybersecurity-predictions-for-the-ai-economy-in-2026',                                                                                                         tags: Object.freeze(['AI', 'agentic', 'predictions']) })
    ]),

    projects: Object.freeze([
      Object.freeze({
        id: 'soc-portfolio',
        name: 'SOC Portfolio Website',
        status: 'active',
        date: '2026-04',
        summary: 'This portfolio — built with HTML/CSS/JS in SIEM style.',
        description: 'Interactive portfolio in SOC/SIEM dashboard style. Pure frontend without a framework, bilingual (DE/EN), with tile navigation, multilingual content, and automated unit tests.',
        tools: Object.freeze(['HTML', 'CSS', 'JavaScript', 'Vitest']),
        links: Object.freeze([{ label: '→ GitHub', url: 'https://github.com/NoahRendler/soc-portfolio' }])
      }),
      Object.freeze({
        id: 'opensource-soc',
        name: 'Open-Source SOC',
        status: 'completed',
        date: '2025-12',
        summary: 'Wazuh + ELK Stack deployment for a small business network.',
        description: 'Built a complete, free SOC stack based on Wazuh (SIEM/EDR), Elasticsearch, Logstash, and Kibana. Deployed for a small business network with 20 endpoints.',
        tools: Object.freeze(['Wazuh', 'Elastic / ELK', 'Docker', 'Linux']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'homelab',
        name: 'Homelab',
        status: 'planned',
        date: '2026-06',
        summary: 'Physical homelab with Proxmox for security experiments.',
        description: 'Building a dedicated physical homelab based on Proxmox VE. Planned environments: SIEM, network segmentation, vulnerable VMs for CTF-like exercises.',
        tools: Object.freeze(['Proxmox', 'Linux', 'VMware']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'homelab-soc',
        name: 'Homelab SOC',
        status: 'planned',
        date: '2026-07',
        summary: 'Wazuh & ELK on own Proxmox cluster.',
        description: 'Running a full SOC setup in the home lab — Wazuh as SIEM/EDR, ELK for log analysis, automated alert pipelines.',
        tools: Object.freeze(['Wazuh', 'Elastic / ELK', 'Proxmox', 'Python']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'ssh-bruteforce-ml',
        name: 'SSH Brute-Force Detection (ML)',
        status: 'planned',
        date: '2026-08',
        summary: 'ML-based anomaly detection for SSH login patterns.',
        description: 'Developing a bachelor thesis prototype: ML model for detecting SSH brute-force attacks based on auth log data. Focus on false-positive rate and real-time classification.',
        tools: Object.freeze(['Python', 'scikit-learn', 'Wazuh', 'Elastic / ELK']),
        links: Object.freeze([])
      }),
      Object.freeze({
        id: 'threat-intel-platform',
        name: 'Threat Intelligence Platform',
        status: 'planned',
        date: '2026-09',
        summary: 'Custom TI aggregation tool for IOC enrichment.',
        description: 'Building a lightweight threat intelligence platform: aggregation of IOCs from public feeds (MISP, AbuseIPDB, VirusTotal), enrichment pipeline, and dashboard.',
        tools: Object.freeze(['Python', 'MISP', 'VirusTotal', 'AbuseIPDB', 'Docker']),
        links: Object.freeze([])
      })
    ]),

    uptime: Object.freeze({
      days: Object.freeze([
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'partial' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'up' }),
        Object.freeze({ status: 'down' }),
        Object.freeze({ status: 'up' })
      ]),
      responseMs: 47,
      lastDeploy: '3d',
      uptimePercent: '99.7',
      sparkLabel: 'RESPONSE TIME // 24H',
      logEntries: Object.freeze([
        Object.freeze({ time: '19:14:02',  color: '#39ff14',       msg: 'Deploy v1.4.2 — successful' }),
        Object.freeze({ time: '16:33:47',  color: 'var(--accent)', msg: 'SSL certificate renewed' }),
        Object.freeze({ time: '11:02:19',  color: '#ffd600',       msg: 'Response spike → 89ms (resolved)' }),
        Object.freeze({ time: 'yesterday', color: '#39ff14',       msg: 'Uptime check passed — 100%' })
      ])
    }),

    radar: Object.freeze({
      toolsLabel: 'TOOLS',
      axes: Object.freeze([
        Object.freeze({ label: 'NETWORK',    value: 6, color: '#00e5ff', tools: Object.freeze(['Nmap','Wireshark','Netcat','tcpdump','Shodan']) }),
        Object.freeze({ label: 'OFFENSIVE',  value: 5, color: '#ffd600', tools: Object.freeze(['Burp Suite','Metasploit','Gobuster','Hydra','John the Ripper','Hashcat']) }),
        Object.freeze({ label: 'DEFENSIVE',  value: 7, color: '#39ff14', tools: Object.freeze(['Elastic/ELK','Wazuh','Suricata','Yara','Google SecOps','Sentinel','Defender']) }),
        Object.freeze({ label: 'VULN/INTEL', value: 6, color: '#ec4899', tools: Object.freeze(['Nessus','OpenVAS','Nikto','Maltego','VirusTotal','AbuseIPDB','MITRE ATT&CK']) }),
        Object.freeze({ label: 'SCRIPTING',  value: 6, color: '#c084fc', tools: Object.freeze(['Python','Bash','SQL','TCP/IP','DNS/DHCP','HTTP/TLS','VPN/Firewalls']) }),
        Object.freeze({ label: 'INFRA',      value: 8, color: '#f97316', tools: Object.freeze(['Linux','Windows','Docker','VMware','Proxmox','Git','Intune/Entra ID','Jira','ServiceNow']) })
      ])
    }),

    ui: Object.freeze({
      topbar: Object.freeze({
        title: 'SOC // PORTFOLIO',
        statusLabel: 'SEEKING PLACEMENT'
      }),

      nav: Object.freeze({
        status:     'STATUS',
        threatIntel: 'THREAT INTEL',
        skills:     'SKILLS',
        cases:      'CASES',
        contact:    'CONTACT'
      }),

      sections: Object.freeze({
        status:     'STATUS PANEL',
        threatIntel: 'THREAT INTELLIGENCE',
        skills:     'SKILLS MATRIX',
        cases:      'ACTIVE CASES',
        contact:    'CONTACT'
      }),

      threatIntel: Object.freeze({
        noEntries: 'No entries available.',
        categoryLabels: Object.freeze({
          project:       'PROJECT',
          ctf:           'CTF',
          research:      'RESEARCH',
          certification: 'CERT'
        })
      }),

      skillsTable: Object.freeze({
        tool:        'TOOL',
        category:    'CATEGORY',
        proficiency: 'PROFICIENCY',
        years:       'YEARS'
      }),

      cases: Object.freeze({
        noEntries: 'No cases available.',
        statusLabels: Object.freeze({
          'open': 'OPEN',
          'in-progress': 'IN PROGRESS',
          'closed': 'CLOSED',
          'completed': 'COMPLETED',
          'active': 'ACTIVE',
          'planned': 'PLANNED'
        }),
        labelStarted: 'Started',
        labelClosed: 'Closed',
        linkLabel: '→ GitHub',
        descriptionLabel: 'DESCRIPTION',
        toolsLabel: 'TOOLS',
        linksLabel: 'LINKS'
      }),
      contact: Object.freeze({
        emailLabel: 'EMAIL',
        linkedinLabel: 'LINKEDIN',
        githubLabel: 'GITHUB',
        formTitle: 'SEND MESSAGE',
        nameLabel: 'Name',
        emailFieldLabel: 'Email',
        messageLabel: 'Message',
        composeLabel: 'COMPOSE TRANSMISSION',
        senderIdLabel: 'SENDER ID',
        returnAddressLabel: 'RETURN ADDRESS',
        messagePayloadLabel: 'MESSAGE PAYLOAD',
        submitLabel: '\u25B6 TRANSMIT',
        contactVectorsLabel: 'CONTACT VECTORS',
        channelSecureLabel: 'CHANNEL SECURE',
        channelSecureSub: 'TLS 1.3 // AES-256-GCM',
        validation: Object.freeze({
          nameRequired: 'Name is required.',
          emailInvalid: 'Invalid email address.',
          messageRequired: 'Message is required (max. 1000 characters).',
          tooManyRequests: 'Too many requests. Please wait a moment.',
          sending: 'TRANSMITTING...',
          success: 'TRANSMISSION SUCCESSFUL — SECURE CHANNEL CONFIRMED',
          error: 'TRANSMISSION FAILED — RETRY'
        })
      }),

      // ── Tile header labels (grid) ────────────────────────────
      tiles: Object.freeze({
        analystProfile:  'ANALYST PROFILE',
        networkTopology: 'NETWORK TOPOLOGY',
        threatFeed:      'THREAT INTEL FEED',
        projects:        'PROJECTS',
        certifications:  'CERTIFICATIONS',
        skillsMatrix:    'SKILLS MATRIX',
        careerTimeline:  'CAREER TIMELINE',
        systemMonitor:   'SYSTEM MONITOR',
        threatRadar:     'THREAT RADAR',
        secureChannel:   'SECURE CHANNEL'
      }),

      expandHint: '▶ EXPAND',

      // ── System Status Bar items ──────────────────────────────
      sysBar: Object.freeze([
        Object.freeze({ label: 'STATUS',       value: 'ONLINE',     dot: 'green' }),
        Object.freeze({ label: 'CLEARANCE',    value: 'B.SC. Y3',   dot: 'cyan'  }),
        Object.freeze({ label: 'AVAILABILITY', value: 'IMMEDIATE',  dot: 'green' }),
        Object.freeze({ label: 'SECTOR',       value: 'STUTTGART',  dot: 'amber' })
      ])
    })
  })
});

export { DATA };
