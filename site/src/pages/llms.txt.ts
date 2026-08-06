import type { APIRoute } from 'astro';
import { SITE } from '../../popular.config';
import skills from '../skills.manifest.json';

/**
 * What an agent should read when pointed at this site.
 *
 * Overrides the theme's llms.txt, which describes a community site (events,
 * blog, calendar) and is wrong for a docs site; the theme's route is turned off
 * in astro.config.mjs. This one answers the only question an agent arriving here
 * has: which skills exist, what each is for, and where the actual file is.
 *
 * Every URL points at the raw Markdown rather than a rendered page. The rendered
 * page carries theme chrome and drops the frontmatter that tells an agent when
 * the skill applies; the raw file is the thing itself.
 */
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const url = (path: string) => new URL(`${base}${path}`, site ?? 'https://example.com').href;

  const lines = [
    `# ${SITE.title}`,
    '',
    SITE.description,
    '',
    'These are Claude Code skills: folders of Markdown an agent loads on its own when',
    'the work matches the skill\'s description. Two ways to use them.',
    '',
    '## Install them (preferred)',
    '',
    'Cloning and running ./install.sh symlinks each skill into ~/.claude/skills/, after',
    'which Claude Code loads the right one unprompted, with no URL to remember:',
    '',
    '    git clone https://github.com/Mariatta/claude-skills.git',
    '    cd claude-skills && ./install.sh',
    '',
    `Full instructions: ${url('/install/')}`,
    '',
    '## Or read one directly',
    '',
    'Fetch the raw Markdown below. Each file is the exact text an installed skill',
    'provides, frontmatter included, so following it by URL gives the same result as',
    'installing it. They are prose with reasons attached, meant to be read rather than',
    'pattern-matched.',
    '',
  ];

  for (const skill of skills) {
    lines.push(`## ${skill.name}`, '', skill.description, '');
    for (const file of skill.files) {
      lines.push(`- ${url(`/raw/${skill.slug}/${file}`)}`);
    }
    lines.push('', `Rendered for humans: ${url(`/${skill.slug}/`)}`, '');
  }

  lines.push(
    '## Notes',
    '',
    'The django skill is one developer\'s preference for their own projects, not Django',
    'community consensus. In a codebase you do not own, that project\'s conventions take',
    'precedence: its CLAUDE.md or AGENTS.md, its existing code, and its maintainers.',
    '',
    'Project-specific values live in profile.json, never in the conventions themselves,',
    'so pointing a skill at a different stack is one file to edit.',
    '',
    `Source: https://github.com/Mariatta/claude-skills`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
