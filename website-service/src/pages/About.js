import React from 'react';
import { 
  ShieldCheckIcon, 
  LightBulbIcon, 
  UsersIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

const About = () => {
  const values = [
    {
      name: 'Security First',
      description: 'We prioritize the security of your data with enterprise-grade encryption and security measures.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Innovation',
      description: 'Continuously improving our platform with cutting-edge technology and user feedback.',
      icon: LightBulbIcon,
    },
    {
      name: 'Collaboration',
      description: 'Building tools that enhance teamwork and enable seamless communication.',
      icon: UsersIcon,
    },
    {
      name: 'Global Reach',
      description: 'Supporting teams worldwide with reliable, scalable infrastructure.',
      icon: GlobeAltIcon,
    },
  ];

  const team = [
    {
      name: 'John Smith',
      role: 'CEO & Founder',
      image: '/api/placeholder/150/150',
      bio: 'Visionary leader with 15+ years in enterprise software.',
    },
    {
      name: 'Sarah Johnson',
      role: 'CTO',
      image: '/api/placeholder/150/150',
      bio: 'Technical expert specializing in scalable systems architecture.',
    },
    {
      name: 'Mike Chen',
      role: 'Head of Product',
      image: '/api/placeholder/150/150',
      bio: 'Product strategist focused on user experience and innovation.',
    },
    {
      name: 'Emily Davis',
      role: 'VP of Engineering',
      image: '/api/placeholder/150/150',
      bio: 'Engineering leader passionate about building robust solutions.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Our Company
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We're on a mission to revolutionize internal management systems, 
              making them more efficient, user-friendly, and powerful for modern businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, our company emerged from a simple observation: 
                  businesses were struggling with fragmented internal management 
                  tools that hindered rather than helped their operations.
                </p>
                <p>
                  Our founding team, with decades of combined experience in enterprise 
                  software, set out to create a unified platform that would streamline 
                  internal processes while remaining intuitive and accessible.
                </p>
                <p>
                  Today, we serve hundreds of organizations worldwide, from startups 
                  to enterprise companies, helping them optimize their internal 
                  operations and boost productivity.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">2020</div>
                  <div className="text-gray-600">Founded</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
                  <div className="text-gray-600">Clients</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
                  <div className="text-gray-600">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do and help us deliver 
              exceptional value to our customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const IconComponent = value.icon;
              return (
                <div key={value.name} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary-100 rounded-lg">
                      <IconComponent className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.name}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind our innovative internal 
              management platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-1 aspect-h-1">
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <div className="w-24 h-24 bg-primary-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-700">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            To empower organizations with intuitive, powerful, and secure internal 
            management tools that enhance productivity, foster collaboration, and 
            drive business success in the digital age.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;