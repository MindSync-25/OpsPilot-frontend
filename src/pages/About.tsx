import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function About() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Built for Modern IT Teams
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            We're on a mission to simplify IT operations management and empower teams to do their best work.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                OpsPilot was born from the frustration of managing IT projects across multiple disconnected tools. We believe teams deserve a single, unified platform that brings together project management, time tracking, invoicing, and collaboration.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Our goal is to eliminate the complexity of IT operations and help teams focus on what matters most: delivering exceptional results for their clients.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary via-emerald-600 to-accent rounded-2xl p-8 text-white">
              <Target className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Our Vision</h3>
              <p className="text-emerald-50">
                To become the go-to platform for IT teams worldwide, enabling seamless collaboration and operational excellence through innovative technology.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Speed</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Fast, responsive, and efficient. We value your time.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Security</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your data is protected with enterprise-grade security.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Collaboration</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Built for teams to work together seamlessly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Simplicity</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Powerful features without the complexity.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 mb-20">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Built with Modern Technology
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">React</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Frontend Framework</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">Spring Boot</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Backend API</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">PostgreSQL</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Database</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">AWS</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cloud Infrastructure</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-20">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-slate-600 dark:text-slate-400">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">50,000+</div>
              <p className="text-slate-600 dark:text-slate-400">Projects Managed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
              <p className="text-slate-600 dark:text-slate-400">Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-emerald-600 to-accent py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Thousands of Teams
            </h2>
            <p className="text-lg mb-8 text-emerald-50">
              Start managing your IT operations more efficiently today.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-emerald-50">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
