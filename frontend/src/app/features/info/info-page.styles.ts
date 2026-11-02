/** Shared look for the Contact, Terms and Privacy pages: one readable column of prose. */
export const INFO_PAGE_STYLES = `
  .info-page {
    max-width: 52rem;
    margin: 0 auto;
  }

  .info-page .page-head {
    margin-bottom: 1.4rem;
  }

  .info-updated {
    display: inline-block;
    margin-top: .5rem;
    font-size: .78rem;
    color: var(--muted);
  }

  .info-page section {
    margin-bottom: 1.5rem;
  }

  .info-page h2 {
    font-size: 1.05rem;
    font-weight: 750;
    margin-bottom: .45rem;
  }

  .info-page p,
  .info-page li {
    color: var(--text-dim);
    line-height: 1.65;
    font-size: .92rem;
  }

  .info-page ul {
    padding-left: 1.2rem;
    margin: .35rem 0 0;
  }

  .info-page li + li {
    margin-top: .3rem;
  }

  .info-page a {
    color: var(--brand-bright);
  }

  .info-related {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    font-size: .85rem;
  }
`;
