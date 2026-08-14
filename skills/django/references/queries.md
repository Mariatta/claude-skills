# Queries: catching N+1 before it ships

## Why this is a write-time concern

An N+1 is invisible in development and invisible in review unless someone is looking
for it. The page works. The tests pass. The fixture has three rows, so the extra
queries cost nothing, and the code reads perfectly well: `for book in books:` then
`book.author.name` is exactly how you would write it if the ORM were free.

It only becomes visible where the row count is real, which means production, which
means an alert. By then the fix is a hotfix on a live incident rather than a word
added to a `get_queryset`.

So the useful question is never "has an alert fired on this view", it is "does this
change iterate over model instances, and if so what queries does it run". That question
can be answered while writing the code, and the answer can be pinned by a test so the
next person cannot un-answer it.

## 1. Recognising the shape without running anything

Every one of these is an N+1 until the queryset proves otherwise.

**Read paths**

- A `for` loop over a queryset whose body touches a dotted attribute that crosses a
  relation.
- A template `{% for %}` containing `{{ item.related.name }}`, `{{ item.things.count }}`,
  or `{% if item.things.exists %}`. Templates swallow the query silently and cannot
  raise, which is what makes them the worst place for one.
- A DRF nested serializer, or a `SerializerMethodField` that touches a relation. The
  serializer runs once per row by design; anything it touches multiplies.
- A `ModelAdmin.list_display` entry naming a method that crosses a foreign key.
- `__str__` touching a related object. This one leaks everywhere at once: every select
  widget, every admin dropdown, every autocomplete, every log line.
- A model property that runs a query. Call sites cannot tell it apart from a field.
- `.count()`, `.exists()`, `.first()`, or `.get()` called inside a loop.

**Write paths**

- `.save()` inside a loop. Use `bulk_create`, `bulk_update`, or a single
  `.update()`.
- A `post_save` signal handler that queries. It runs once per row, including once per
  row of a bulk import.

## 2. The fix, by access shape

| What the code does | What the queryset needs |
|---|---|
| `book.author.name` (forward FK / OneToOne) | `select_related("author")`: one JOIN, no extra query |
| `author.books.all()` (reverse FK) | `prefetch_related("books")`: one extra query total |
| `book.tags.all()` (M2M) | `prefetch_related("tags")` |
| `item.content_object` (GenericForeignKey) | `prefetch_related("content_object")` |
| `book.author.publisher.name` (two hops) | `select_related("author__publisher")` |
| `author.books.all()` then `book.publisher` | `Prefetch("books", queryset=Book.objects.select_related("publisher"))` |
| only some children per parent | `Prefetch("books", queryset=Book.objects.filter(...), to_attr="recent_books")` |
| `author.books.count()` per row | `annotate(book_count=Count("books"))` |
| `author.books.exists()` per row | `annotate(has_books=Exists(Book.objects.filter(author=OuterRef("pk"))))` |
| one scalar off a related row | `annotate(author_name=F("author__name"))`, or `Subquery` when it needs filtering |
| a dict lookup by id inside a loop | `Model.objects.in_bulk(ids)`, or a dict built from `values_list` |

`select_related` and `prefetch_related` are not alternatives; a list view that shows a
book's author and its tags wants both, chained. `select_related` follows single-valued
relations only, which is why the reverse and many-to-many rows in that table have no
`select_related` option: joining them would multiply the parent rows.

## 3. The cache rules that catch people out

`prefetch_related` stores its result on the instance. Reaching that cache is easy to
miss by one method call, and missing it puts the N+1 straight back while the
`prefetch_related` sits in the queryset looking like the problem is handled.

- `.all()` on a prefetched related manager uses the cache. **Everything else does
  not.** `.filter()`, `.exclude()`, `.order_by()`, `.count()`, `.exists()`, `.first()`,
  and `.last()` each issue a fresh query, once per parent row.
- The fix is to move the work into Python: `Prefetch(..., queryset=..., to_attr=...)`
  to filter and order once in SQL, then `len(obj.recent_books)`,
  `next(iter(obj.recent_books), None)`, and list comprehensions over the attribute.
- Re-fetching an object inside the loop (`Book.objects.get(pk=book.pk)`) returns a new
  instance with an empty cache. The prefetch is still paid for and no longer used.
- `.only()` and `.defer()` trade one problem for another: touching a deferred field is
  a query per instance. With `select_related`, name the related fields too, as in
  `.select_related("author").only("title", "author__name")`.
- A queryset caches its rows once evaluated, so iterating it twice is one query. But
  `.filter()` on it returns a **new** queryset with an empty cache, so `qs.filter(...)`
  inside a loop is a query per iteration even though `qs` was already evaluated.
- `.iterator()` deliberately drops the result cache. Combined with `prefetch_related`
  it needs an explicit `chunk_size` (Django 4.1 and later); without one the prefetch
  does not happen.
- Already holding a list rather than a queryset, from a paginator or from
  `in_bulk().values()`, use `prefetch_related_objects(objs, "books")` rather than
  re-querying.
- `Count` across two different multi-valued joins in one queryset multiplies rows and
  inflates both counts. Use `distinct=True`, or move one of them to a `Subquery`.

## 4. Where the fetching goes

One place per view, as far up as possible, so every render path gets it:

- **Class-based views**: `get_queryset()`. Not the template, not the context.
- **DRF viewsets**: `get_queryset()`. A serializer never fetches its own data; if a
  serializer needs a relation, the viewset that uses it prefetches the relation.
- **ModelAdmin**: `list_select_related`, or override `get_queryset()` for prefetches.
  Use `autocomplete_fields` or `raw_id_fields` for foreign keys with many rows, so the
  form does not render every option, and keep `__str__` off related objects.
- **Function views and services**: at the point the queryset is built, not where it is
  consumed.
- **Three or more call sites needing the same shape**: a queryset or manager method
  (`Book.objects.for_listing()`). This is the fix for the list view being correct while
  the CSV export, the API, and the digest email each re-derive it and get it wrong.

A template should never be the reason a query runs. If fixing a template's N+1 means
editing the template, the view was the bug.

## 5. The test that keeps it fixed

A query-count test turns an N+1 regression into a failing build. Since full coverage
is already a merge gate here, the test is being written either way: this only changes
what it asserts.

The weak version pins a number:

```python
def test_book_list_query_count(client, django_assert_num_queries):
    BookFactory.create_batch(3)
    with django_assert_num_queries(6):
        client.get(reverse("books:list"))
```

The strong version asserts the invariant that actually matters, which is that the
count does not scale with the number of rows:

```python
from django.db import connection
from django.test.utils import CaptureQueriesContext


def test_book_list_queries_do_not_scale(client):
    BookFactory.create_batch(2)
    with CaptureQueriesContext(connection) as few:
        client.get(reverse("books:list"))

    BookFactory.create_batch(20)
    with CaptureQueriesContext(connection) as many:
        client.get(reverse("books:list"))

    assert len(many) == len(few), "\n".join(q["sql"] for q in many.captured_queries)
```

Prefer the second for anything that renders a list. It needs no magic number, it fails
with the offending SQL in the message, and it keeps passing through legitimate changes
that add a constant query while still failing the moment something starts running per
row.

Where a fixed number is used, treat it as documentation rather than a hurdle. A change
that genuinely adds a query updates the constant, and the reviewer sees the cost change
in the diff. That visibility is the entire point; silently raising the number to make
a red test green throws it away.

## 6. Libraries that detect this for you

Nothing here replaces knowing the shapes in section 1, but a lazy load that raises
beats a lazy load nobody sees. The three groups do different jobs, and a project wants
roughly one from each rather than all of them.

**See the queries while developing**

| Library | What it gives you |
|---|---|
| `django-debug-toolbar` | SQL panel per request, with a duplicate-query count and a traceback to the line that ran each query. The fastest way to check a page you just wrote. Development only. |
| `django-silk` | Request and query profiling stored and browsable, including on a staging deploy where the row counts are realistic. Heavier than the toolbar; it also profiles non-HTML endpoints, which the toolbar cannot. |
| `django-querycount` | Middleware that prints a per-request count and the duplicated queries to the console. Useful when the response is JSON or the work happens in a management command. |

**Turn a lazy load into an error**

| Library | What it gives you |
|---|---|
| `django-zen-queries` | `queries_disabled()` context manager: any query inside it raises. Wrap template rendering, or the serialization step, and an unprefetched relation fails loudly instead of quietly working. |
| `django-seal` | Seals a queryset so that any deferred field or unfetched relation access on its results warns or raises, naming the attribute. Narrower target than zen-queries: it follows the objects rather than a block of code. |
| `nplusone` | Detects the pattern at runtime and warns. This is the package people remember first, but check its release history against the maintained-library bar in the dependencies convention before adding it; the two above cover the same ground and are maintained. |

**Keep it from coming back**

| Library | What it gives you |
|---|---|
| `pytest-django` | `django_assert_num_queries` and `django_assert_max_num_queries` fixtures. On Django's own runner the equivalent is `assertNumQueries`. This is the baseline; a project needs no extra dependency to write the tests in section 5. |
| `django-perf-rec` | Records each test's query pattern into a checked-in file, so a change to the queries a view runs shows up as a diff in review rather than as a number to argue about. Worth it on a project with many list views. |

One library sits in a different category: `django-auto-prefetch` makes model instances
fetched together prefetch a relation on first access by any of them, which fixes the
pattern rather than reporting it. It is a real option for a codebase with a long tail
of existing N+1s, but it hides the cost of a query behind an attribute access, so
prefer an explicit `get_queryset` for new code and treat it as a safety net.

Without adding anything at all: `CaptureQueriesContext` in a shell or test, or the
`django.db.backends` logger at `DEBUG` for one request. Note `connection.queries` only
fills up when `DEBUG` is on, which is why the context manager is the reliable one.

## 7. When the alert fires anyway

Some will get through, and a production alert is the right backstop for those. Two
things belong in the fix:

- **A regression test in the same pull request as the fix.** Otherwise the alert comes
  back the next time the queryset is touched.
- **A look at the sibling call sites.** An alert says where the query hurt, under real
  traffic, on the URL that happened to get load. It does not say where the pattern
  exists. The export, the API endpoint, and the email digest over the same model are
  usually running the same loop without enough volume to page anyone yet.

An alert also arrives with the row counts that made it visible, which the local
fixtures do not have. That is the one thing it is genuinely better at, so it is worth
reading for what else the same page is doing, rather than closing once the N+1 is gone.

## 8. Query count is not the whole story

Collapsing N+1 into one query makes it one query that can still be slow, and a few
things are worth checking at the same time, since they are cheap while the queryset is
already open in the editor:

- **Pagination.** A correct single query over 200,000 rows is still a bad page.
- **Indexes on what is filtered and ordered.** A prefetch does an `IN` lookup on the
  foreign key; that column wants an index, which a `ForeignKey` gets by default and a
  filter on a plain field does not.
- **Fetching whole rows to use one column.** `values_list("id", flat=True)` where only
  ids are needed avoids building model instances at all.
- **Prefetching what the page never displays.** A `prefetch_related` left behind by a
  removed feature is a second query for nothing.