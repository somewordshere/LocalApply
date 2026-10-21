# LocalApply 0.4.1

Released 2026-10-21.

### Security

- The interface can no longer write raw HTML into a page: the part of React that could (dangerouslySetInnerHTML, never used by LocalApply) is removed at build time. Mozilla's validator no longer warns about unsafe innerHTML assignments.
