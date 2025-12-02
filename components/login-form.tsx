'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { signIn } from '@/lib/auth/auth-helpers';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error(error.message || 'Failed to sign in');
      } else {
        // Get user profile to determine role
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          toast.success('Signed in successfully');
          
          // Redirect based on role
          if (profile?.role === 'admin' || profile?.role === 'supervisor') {
            router.push('/admin');
          } else {
            router.push('/staff');
          }
        } else {
          router.push('/staff');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Glassmorphism Card */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
        {/* Card Glow Effect */}
        <div className="absolute inset-0 rounded-3xl"></div>

        <div className="relative z-10">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="text-center pb-4 px-4 sm:pb-6 sm:px-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium border border-blue-200 mb-3 sm:mb-4">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                 CASURECO II Queue Management System
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Access Your Account
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                Enter your credentials to access the staff dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`h-10 sm:h-12 text-sm sm:text-base bg-white/80 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl backdrop-blur-sm ${
                        errors.email
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      Password
                    </Label>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={`pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base bg-white/80 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl backdrop-blur-sm ${
                        errors.password
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl group"
                  disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Test Credentials Info */}
              {/* <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">Test Credentials:</p>
                <div className="space-y-2 text-xs text-blue-700">
                  <div>
                    <p className="font-semibold">Admin:</p>
                    <p className="font-mono">admin@test.com / password123</p>
                  </div>
                  <div>
                    <p className="font-semibold">Staff 1:</p>
                    <p className="font-mono">staff1@test.com / password123</p>
                  </div>
                  <div>
                    <p className="font-semibold">Staff 2:</p>
                    <p className="font-mono">staff2@test.com / password123</p>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
