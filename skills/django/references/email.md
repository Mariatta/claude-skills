# Email: one Markdown template, both parts

## Why

An email has to go out as `multipart/alternative` with a plain-text part and an HTML
part. The obvious approach, two body templates, is a trap: they drift, and the
plain-text one drifts silently because almost nobody reads it and no test catches a
missing paragraph.

Writing the body once in Markdown removes the possibility. Markdown reads acceptably
as plain text, which is exactly what the `text/plain` part needs, and converts to HTML
for the other part. One source, no drift.

## Shape

Per email, two templates:

| File | Role |
|---|---|
| `<app>/email/<name>.md` | The body. Markdown with Django template tags. The only place body copy lives. |
| `<app>/email/<name>.html` | The wrapper. Branded chrome only. Injects `{{ body|safe }}`. |

And one function that renders both from a single context.

## The sequence

1. Build the context once.
2. `render_to_string(TEXT_TEMPLATE, context)` produces `text_body`. This is the
   plain-text part, used as-is.
3. `markdown.markdown(text_body, extensions=["extra"])` produces the HTML fragment.
4. `render_to_string(HTML_TEMPLATE, {"body": rendered_html, ...})` wraps it.
5. `EmailMultiAlternatives(subject, text_body, from_email, [to])` then
   `.attach_alternative(html_body, "text/html")`.
6. `.send(fail_silently=False)`. Failing loudly is deliberate; a silently dropped
   invitation is worse than an exception.

Note step 3 converts the **already-rendered** text, not the raw template. Rendering
once and converting is what guarantees the two parts cannot disagree.

## Reference implementation

`expenses/services/invitations.py` in secretcodes. `surveys/` follows the same shape,
so this is the house standard rather than a one-off.

```python
import markdown
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

INVITE_TEXT_TEMPLATE = "expenses/email/invite.md"
INVITE_HTML_TEMPLATE = "expenses/email/invite.html"


def _render_invite_bodies(invitation, request):
    context = {...}
    text_body = render_to_string(INVITE_TEXT_TEMPLATE, context)
    rendered_html = markdown.markdown(text_body, extensions=["extra"])
    html_body = render_to_string(
        INVITE_HTML_TEMPLATE,
        {"body": rendered_html, "favicon_url": ...},
    )
    return text_body, html_body
```

Conventions visible in it worth copying:

- Template paths are module-level constants, not inline string literals.
- Absolute URLs come from `request.build_absolute_uri(reverse(...))`. Never
  hand-concatenate a domain.
- The render helper is private (`_render_...`) and separate from the send function, so
  bodies can be tested without sending.
- Tunables such as expiry windows come from `settings`, not literals.

## Known caveats in the reference build

Both are real in secretcodes today. They are documented rather than silently worked
around, because fixing them is Mariatta's call. If you are writing new email code,
know about them; if you are asked to fix them, this is the context.

### 1. Plain-text bodies are rendered with autoescape on

`render_to_string` escapes by default, and the Markdown templates do not wrap
themselves in `{% autoescape off %}`. So a context value containing an apostrophe,
ampersand, or angle bracket reaches the plain-text part as an HTML entity. A name like
`O'Brien` arrives as `O&#x27;Brien` in the text part.

The HTML part is unaffected, which is why this is easy to miss.

The fix is `{% autoescape off %}` around the Markdown template body, but that has to
be weighed against the second caveat, since turning escaping off on a template whose
output is then converted to HTML changes the injection surface.

### 2. The HTML path runs markdown without the sanitizer

`markdown.markdown(...)` is called directly on text containing user-controlled values
(display names, event names). The project already has a bleach-based
`safe_markdown` filter at `surveys/templatetags/survey_extras.py` with a tag
whitelist, and the email path does not use it.

With autoescape currently on, escaping happens to blunt this. That means the two
caveats are coupled: fixing caveat 1 without also routing through the sanitizer would
make caveat 2 materially worse. Treat them as one change, not two.

## When adding a new email

- Two templates under `<app>/templates/<app>/email/`, `.md` and `.html`.
- A render helper plus a send function in `<app>/services/`.
- Body copy only in the `.md`. If you find yourself adding a sentence to the `.html`
  wrapper, it belongs in the Markdown instead.
- Tests cover the render helper directly. Full coverage is a merge gate, and the
  helper is the part worth asserting on anyway.
