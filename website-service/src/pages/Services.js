import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  ShieldCheckIcon,
  CloudIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Services = () => {
  const services = [
    {
      name: 'Project Management',
      description: 'Complete project lifecycle management with advanced tracking, resource allocation, and milestone monitoring.',
      icon: ChartBarIcon,
      features: [
        'Project planning and scheduling',
        'Resource management',
        'Progress tracking',
        'Budget monitoring',
        'Risk assessment'
      ],
      pricing: 'Starting at $29/month'
    },
    {
      name: 'Team Collaboration',
      description: 'Enhance team productivity with integrated communication tools and collaborative workspaces.',
      icon: UsersIcon,
      features: [
        'Team messaging and chat',
        'File sharing and storage',
        'Video conferencing',
        'Real-time collaboration',
        'Team calendars'
      ],
      pricing: 'Starting at $19/month'
    },
    {
      name: 'Task Management',
      description: 'Organize, assign, and track tasks with powerful workflow automation and reporting capabilities.',
      icon: DocumentTextIcon,
      features: [
        'Task creation and assignment',
        'Workflow automation',
        'Priority management',
        'Due date tracking',
        'Performance analytics'
      ],
      pricing: 'Starting at $15/month'
    },
    {
      name: 'Time Tracking',
      description: 'Monitor time spent on projects and tasks with detailed reporting and productivity insights.',
      icon: ClockIcon,
      features: [
        'Automatic time tracking',
        'Manual time entry',
        'Detailed reporting',
        'Productivity analytics',
        'Billing integration'
      ],
      pricing: 'Starting at $12/month'
    },
    {
      name: 'Security & Compliance',
      description: 'Enterprise-grade security features to protect your data and ensure regulatory compliance.',
      icon: ShieldCheckIcon,
      features: [
        'End-to-end encryption',
        'Role-based access control',
        'Audit trails',
        'Compliance reporting',
        'Security monitoring'
      ],
      pricing: 'Enterprise pricing'
    },
    {
      name: 'Cloud Integration',
      description: 'Seamlessly integrate with your existing cloud services and third-party applications.',
      icon: CloudIcon,
      features: [
        'API integrations',
        'Cloud storage sync',
        'Third-party app connections',
        'Data import/export',
        'Custom integrations'
      ],
      pricing: 'Starting at $25/month'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 10 team members',
        'Basic project management',
        'Task tracking',
        'Email support',
        '5GB storage'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$59',
      description: 'Ideal for growing businesses',
      features: [
        'Up to 50 team members',
        'Advanced project management',
        'Time tracking',
        'Priority support',
        '100GB storage',
        'Custom workflows',
        'Reporting & analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'Unlimited team members',
        'All features included',
        '24/7 dedicated support',
        'Unlimited storage',
        'Custom integrations',
        'Advanced security',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Our Services
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Comprehensive internal management solutions designed to streamline 
            your operations and boost productivity across your organization.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive suite of internal management tools 
              designed to meet all your business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div key={service.name} className="card p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg mr-4">
                      <IconComponent className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="text-primary-600 font-semibold">
                    {service.pricing}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your team size and requirements. 
              All plans include our core features with varying levels of access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`card p-8 relative ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary-600">
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={`block w-full text-center py-3 px-4 rounded-md font-medium transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using our platform to streamline 
            their internal management processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-primary-600 transition-colors duration-200"
            >
              <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;