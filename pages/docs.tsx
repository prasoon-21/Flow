import dynamic from 'next/dynamic';
import Head from 'next/head';

type SwaggerUIProps = {
  url?: string;
  docExpansion?: 'list' | 'full' | 'none' | string;
  [key: string]: unknown;
};

const SwaggerUI = dynamic<SwaggerUIProps>(() => import('swagger-ui-react'), { ssr: false });

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>API Docs | Aurika Flow</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh' }}>
        <SwaggerUI url="/api/openapi" docExpansion="list" />
      </div>
    </>
  );
}
