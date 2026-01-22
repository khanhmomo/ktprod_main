import 'next';

declare module 'next' {
  export interface PageProps {
    params: Record<string, string>;
    searchParams?: { [key: string]: string | string[] | undefined };
  }
}
