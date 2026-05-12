import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl" />
        <h1 className="font-serif text-9xl font-bold text-text-primary/10 select-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-4xl text-text-primary italic">Not Found</span>
        </div>
      </div>
      
      <p className="text-lg text-text-secondary max-w-md mb-8">
        Like a pebble dropped in an empty pond, the page you're looking for has vanished without a trace.
      </p>
      
      <Link to="/">
        <Button size="lg" className="px-8">
          Return to home
        </Button>
      </Link>
    </PageContainer>
  );
}
