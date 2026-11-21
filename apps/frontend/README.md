This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## PDF fonts

The Arabic PDFs (jameya receipts and contact statements) use the Cairo files in `public/fonts/pdf/cairo-arabic-*.woff`, loaded by `src/lib/pdf.ts`.

`@react-pdf/renderer` shapes Arabic text left to right. Cairo's kerning pair for فـ followed by ـي is then applied on the wrong side of the glyph and closes the space before "في", so "لسه ليه في" renders as "لسه ليهفي". The committed fonts have the GPOS `kern` feature emptied to prevent this.

Run the script whenever these font files are replaced or re-downloaded:

```bash
pip install fonttools
pnpm --filter frontend fonts:strip-pdf-kerning
```

It rewrites the files in place and keeps their original timestamps, so running it on the upstream files reproduces the committed ones byte for byte. Check a few Arabic receipts afterwards. If a later react-pdf release shapes right-to-left text correctly, the original fonts (in git before commit 854f151) can be restored.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
