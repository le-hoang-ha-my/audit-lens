'use client';

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password);
        if (result?.success && result.data) {
          toast.success('Success!', {
            description: result.data.message,
          });
          setEmail('');
          setPassword('');
          setIsSignUp(false);
        } else if (result?.error) {
          toast.error('Error', {
            description: result.error,
          });
        }
      } else {
        const result = await signInWithEmail(email, password);
        // If signIn succeeds, it will redirect, so we won't reach here
        // If it fails, show the error
        if (result && !result.success && result.error) {
          toast.error('Error', {
            description: result.error,
          });
        }
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp
            ? 'Enter your details to create your AuditLens account'
            : 'Enter your credentials to access AuditLens'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>{isSignUp ? 'Sign up' : 'Sign in'}</>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}