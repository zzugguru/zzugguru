import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const deployWorkflow = readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
const pullRequestWorkflow = readFileSync('.github/workflows/pull-request-checks.yml', 'utf8');
const viteConfig = readFileSync('vite.config.ts', 'utf8');

describe('GitHub Pages deployment contract', () => {
  it('deploys automatically only from the default develop branch and supports manual recovery', () => {
    expect(deployWorkflow).toMatch(/push:\s*\n\s*branches:\s*\n\s*- develop/);
    expect(deployWorkflow).toContain('workflow_dispatch:');
    expect(deployWorkflow).not.toMatch(/^\s*- (main|Feat-test)\s*$/m);
    expect(pullRequestWorkflow).toMatch(/pull_request:\s*\n\s*branches:\s*\n\s*- develop/);
  });

  it('builds and deploys the dist artifact with the required Pages contract', () => {
    expect(deployWorkflow).toContain('pages: write');
    expect(deployWorkflow).toContain('id-token: write');
    expect(deployWorkflow).toContain('uses: actions/configure-pages@v5');
    expect(deployWorkflow).toMatch(/uses: actions\/upload-pages-artifact@v4[\s\S]*?path: dist/);
    expect(deployWorkflow).toMatch(/deploy:[\s\S]*?needs: build/);
    expect(deployWorkflow).toContain('name: github-pages');
    expect(deployWorkflow).toContain('uses: actions/deploy-pages@v4');
    expect(viteConfig).toContain("base: '/zzugguru/'");
  });
});
