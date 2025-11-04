import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      name: 'Project Management',
      description: 'Organize and track projects with powerful management tools.',
      icon: ChartBarIcon,
    },
    {
      name: 'Team Collaboration',
      description: 'Enable seamless collaboration between team members.',
      icon: UsersIcon,
    },
    {
      name: 'Task Tracking',
      description: 'Monitor task progress and deadlines efficiently.',
      icon: DocumentTextIcon,
    },
    {
      name: 'Time Management',
      description: 'Track time spent on projects and optimize productivity.',
      icon: ClockIcon,
    },
  ];

  const stats = [
    { name: 'Active Projects', value: '150+' },
    { name: 'Team Members', value: '500+' },
    { name: 'Tasks Completed', value: '10,000+' },
    { name: 'Hours Tracked', value: '50,000+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Internal Management
              <span className="block text-primary-200">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-100">
              Streamline your business operations with our comprehensive internal 
              management system. Boost productivity and enhance collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-primary-600 transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your internal operations effectively 
              and efficiently in one integrated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.name} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary-100 rounded-lg">
                      <IconComponent className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of organizations already using our platform
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start managing your internal operations more effectively today. 
            Join our growing community of successful teams.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Start Free Trial
            <CheckCircleIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;