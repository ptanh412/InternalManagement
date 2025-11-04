import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically send the data to your backend
      console.log('Contact form submitted:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      name: 'Email',
      value: 'contact@internalms.com',
      href: 'mailto:contact@internalms.com',
      icon: EnvelopeIcon,
    },
    {
      name: 'Phone',
      value: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
      icon: PhoneIcon,
    },
    {
      name: 'Address',
      value: '123 Business Ave, Suite 100\nSan Francisco, CA 94105',
      href: 'https://maps.google.com',
      icon: MapPinIcon,
    },
    {
      name: 'Support Hours',
      value: 'Monday - Friday\n9:00 AM - 6:00 PM PST',
      href: null,
      icon: ClockIcon,
    },
  ];

  const faqs = [
    {
      question: 'What is the setup time for new accounts?',
      answer: 'Most organizations can be up and running within 24-48 hours. Our team provides full onboarding support to ensure a smooth transition.'
    },
    {
      question: 'Do you offer data migration services?',
      answer: 'Yes, we provide comprehensive data migration services to help you transfer your existing data from other platforms seamlessly.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a 14-day free trial with full access to all features. No credit card required to start.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer email support for all plans, priority support for Professional plans, and 24/7 dedicated support for Enterprise customers.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Have questions about our platform? Want to schedule a demo? 
            We'd love to hear from you and help you get started.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Send Us a Message
            </h2>
            <p className="text-gray-600 mb-8">
              Fill out the form below and our team will get back to you within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="input-field"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="input-field"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  required
                  className="input-field"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your needs..."
                ></textarea>
              </div>

              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p className="text-sm">Thank you! Your message has been sent successfully. We'll get back to you soon.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-3 px-6 border border-transparent text-base font-medium rounded-md text-white ${
                  isSubmitting
                    ? 'bg-primary-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                } transition-colors duration-200`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Contact Information
            </h2>
            <p className="text-gray-600 mb-8">
              Reach out to us through any of these channels. Our team is here to help.
            </p>

            <div className="space-y-6">
              {contactInfo.map((info) => {
                const IconComponent = info.icon;
                return (
                  <div key={info.name} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {info.name}
                      </h3>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-primary-600 hover:text-primary-500 whitespace-pre-line"
                          target={info.href.startsWith('http') ? '_blank' : undefined}
                          rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-gray-600 whitespace-pre-line">
                          {info.value}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FAQ Section */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <h4 className="font-medium text-gray-900">
                          {faq.question}
                        </h4>
                        <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 text-gray-600">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;