import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const htmlPath = resolve(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf-8');

// Extract the CSP content attribute value
const cspMatch = html.match(
  /http-equiv="Content-Security-Policy"\s+content="([^"]*)"/is
);
const cspValue = cspMatch ? cspMatch[1].replace(/\s+/g, ' ').trim() : '';

describe('CSP — meta tag presence', () => {
  it('has a Content-Security-Policy meta tag', () => {
    expect(html).toContain('Content-Security-Policy');
  });

  it('successfully extracts the CSP value', () => {
    expect(cspValue.length).toBeGreaterThan(0);
  });
});

describe('CSP — dangerous directives are absent', () => {
  it("does not allow 'unsafe-inline'", () => {
    expect(cspValue).not.toContain("'unsafe-inline'");
  });

  it("does not allow 'unsafe-eval'", () => {
    expect(cspValue).not.toContain("'unsafe-eval'");
  });

  it("does not allow 'unsafe-hashes'", () => {
    expect(cspValue).not.toContain("'unsafe-hashes'");
  });
});

describe('CSP — required directives are present', () => {
  it("has default-src 'self'", () => {
    expect(cspValue).toContain("default-src 'self'");
  });

  it("has script-src 'self'", () => {
    expect(cspValue).toContain("script-src 'self'");
  });

  it("has frame-ancestors 'none'", () => {
    expect(cspValue).toContain("frame-ancestors 'none'");
  });

  it("has base-uri 'self'", () => {
    expect(cspValue).toContain("base-uri 'self'");
  });

  it("has object-src 'none'", () => {
    expect(cspValue).toContain("object-src 'none'");
  });
});

describe('CSP — form-action restricts submission targets', () => {
  it('has a form-action directive', () => {
    expect(cspValue).toContain('form-action');
  });

  it('does not allow form-action *', () => {
    expect(cspValue).not.toContain('form-action *');
  });
});

describe('HTML — no inline scripts or event handlers', () => {
  it('has no inline <script> blocks (only <script src="...">)', () => {
    // Match <script> tags that do NOT have a src attribute
    const inlineScriptRegex = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi;
    expect(html.match(inlineScriptRegex)).toBeNull();
  });

  it('has no inline event handler attributes (onclick, onload, etc.)', () => {
    const inlineHandlerRegex = /\s(on\w+)\s*=/gi;
    expect(html.match(inlineHandlerRegex)).toBeNull();
  });

  it('has no inline style attributes', () => {
    const inlineStyleRegex = /\sstyle\s*=/gi;
    expect(html.match(inlineStyleRegex)).toBeNull();
  });
});

describe('HTML — external resource security', () => {
  it('has no external script sources', () => {
    const externalScriptRegex = /<script[^>]+src=["']https?:\/\//gi;
    expect(html.match(externalScriptRegex)).toBeNull();
  });

  it('has no external stylesheet sources', () => {
    // Allow only relative paths
    const externalStyleRegex = /<link[^>]+href=["']https?:\/\//gi;
    expect(html.match(externalStyleRegex)).toBeNull();
  });
});
