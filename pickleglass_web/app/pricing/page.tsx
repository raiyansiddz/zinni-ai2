'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const pricingPlans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      planType: 'free',
      features: [
        { name: 'Custom Prompt', included: true },
        { name: 'Pro Responses/day', value: 'Limited' },
        { name: 'Token Limit', value: 'Limited' },
        { name: 'Model Access', value: 'GPT-4-mini' },
        { name: 'AI Summary', included: true },
        { name: 'Team-wide Knowledge', included: false },
        { name: 'Post-call Coaching', included: false },
        { name: 'Priority Support', included: false },
        { name: 'Centralized Billing', included: false },
        { name: 'Data Privacy', included: false },
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: { monthly: 19.99, yearly: 199.99 },
      planType: 'pro',
      features: [
        { name: 'Custom Prompt', included: true },
        { name: 'Pro Responses/day', value: 'Unlimited' },
        { name: 'Token Limit', value: 'Unlimited' },
        { name: 'Model Access', value: 'GPT-4.1' },
        { name: 'AI Summary', included: true },
        { name: 'Team-wide Knowledge', included: false },
        { name: 'Post-call Coaching', included: false },
        { name: 'Priority Support', included: true },
        { name: 'Centralized Billing', included: false },
        { name: 'Data Privacy', included: false },
      ],
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: { monthly: 49.99, yearly: 499.99 },
      planType: 'enterprise',
      features: [
        { name: 'Custom Prompt', included: true },
        { name: 'Pro Responses/day', value: 'Unlimited' },
        { name: 'Token Limit', value: 'Unlimited' },
        { name: 'Model Access', value: 'GPT-4.1 + Claude' },
        { name: 'AI Summary', included: true },
        { name: 'Team-wide Knowledge', included: true },
        { name: 'Post-call Coaching', included: true },
        { name: 'Priority Support', included: true },
        { name: 'Centralized Billing', included: true },
        { name: 'Data Privacy', included: true },
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const handleUpgrade = (planType: string) => {
    console.log(`Upgrading to ${planType} plan`);
    // TODO: Implement Stripe checkout
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect plan for your AI assistant needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-500 ml-2">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                
                <button
                  onClick={() => handleUpgrade(plan.planType)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center">
                    <div className="flex-shrink-0 w-20 text-sm text-gray-600">
                      {feature.name}
                    </div>
                    <div className="flex-1 text-right">
                      {feature.value ? (
                        <span className="text-sm font-medium text-gray-900">
                          {feature.value}
                        </span>
                      ) : feature.included ? (
                        <Check className="h-5 w-5 text-green-500 ml-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Feature Comparison
          </h2>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                    Pro
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'Custom Prompt', free: true, pro: true, enterprise: true },
                  { name: 'Pro Responses/day', free: 'Limited', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { name: 'Token Limit', free: 'Limited', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { name: 'Model Access', free: 'GPT-4-mini', pro: 'GPT-4.1', enterprise: 'GPT-4.1 + Claude' },
                  { name: 'AI Summary', free: true, pro: true, enterprise: true },
                  { name: 'Team-wide Knowledge', free: false, pro: false, enterprise: true },
                  { name: 'Post-call Coaching', free: false, pro: false, enterprise: true },
                  { name: 'Priority Support', free: false, pro: true, enterprise: true },
                  { name: 'Centralized Billing', free: false, pro: false, enterprise: true },
                  { name: 'Data Privacy', free: false, pro: false, enterprise: true },
                ].map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}