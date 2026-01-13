import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, Shield, Users, TrendingUp, Clock, BarChart3, Star, Sparkles, Rocket, Globe, Award, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900"></div>
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* Announcement Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge className="px-4 py-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-2" />
                New: Advanced Analytics & AI-Powered Insights
              </Badge>
            </div>
            
            <div className="text-center space-y-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight animate-slide-up">
                Transform Your
                <span className="block bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent mt-2">
                  IT Operations
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
                The all-in-one platform that empowers teams to manage projects, track time, invoice clients, and grow faster. Built for modern IT professionals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-delay-2">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-xl shadow-primary/50 text-lg px-10 py-7 rounded-xl transform hover:scale-105 transition-all duration-200">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="border-2 border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary text-lg px-10 py-7 rounded-xl transform hover:scale-105 transition-all duration-200">
                    <Globe className="mr-2 h-5 w-5" />
                    Explore Features
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="mt-20 border-t border-slate-200 dark:border-slate-700 pt-12">
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-8 uppercase tracking-wider font-semibold">
                Trusted by innovative teams worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">TechCorp</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">DevStudio</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">CloudTeam</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">AgileWorks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 py-16 border-y border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10K+</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">500K+</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-amber-600 mb-2">4.9★</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Preview */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/20">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Built for Excellence
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to run your IT operations smoothly and efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Lightning Fast</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Built with cutting-edge technology for blazing-fast performance. Experience real-time updates and instant responses.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Secure & Reliable</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Enterprise-grade security with JWT authentication, encryption, and role-based access control. Your data is safe with us.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 border-slate-200 dark:border-slate-700 hover:border-accent dark:hover:border-accent transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-teal-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Team Collaboration</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Work together seamlessly with real-time updates, comments, and notifications. Keep everyone on the same page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Manage IT Operations
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and boost productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Project Management</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Organize projects, create phases, and manage tasks with Kanban boards.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Time Tracking</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track billable hours with timesheets and automated time entries.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Invoicing & Billing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generate professional invoices and manage subscriptions with Razorpay.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Team Management</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage team members with role-based permissions and access control.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Analytics & Reports</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get insights with comprehensive reporting and analytics dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">CRM & Clients</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage client relationships and track all communications in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/features">
              <Button size="lg" variant="outline">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent border-accent/20">
              <HeartHandshake className="h-3 w-3 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See what our customers have to say about their experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">
                  "OpsPilot has completely transformed how we manage our projects. The time tracking and invoicing features are game-changers!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">John Doe</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">CTO, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">
                  "The best project management tool we've used. Intuitive, powerful, and the analytics are incredible. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                    SM
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Sarah Miller</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">PM, DevStudio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">
                  "Outstanding platform! It's streamlined our entire workflow. The customer support team is also incredibly responsive."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-teal-600 flex items-center justify-center text-white font-semibold">
                    MC
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Mike Chen</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Founder, CloudTeam</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-5xl mx-auto">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-600 to-accent rounded-3xl transform -rotate-1"></div>
            <div className="relative bg-gradient-to-r from-primary via-emerald-600 to-accent rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
              <div className="flex justify-center mb-6">
                <Award className="h-16 w-16 text-yellow-300" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Transform Your IT Operations?
              </h2>
              <p className="text-xl mb-10 text-emerald-50 max-w-2xl mx-auto">
                Join thousands of teams already using OpsPilot to streamline their workflow and boost productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-emerald-50 text-lg px-10 py-7 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7 rounded-xl transform hover:scale-105 transition-all duration-200">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-emerald-50 mt-6">
                No credit card required • Get started in minutes
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
